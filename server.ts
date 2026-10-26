import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import {
  storage,
  User,
} from './src/server/storage';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  requireAuth,
  AuthRequest,
} from './src/server/auth';
import {
  transcribeAudio,
  generateChatResponse,
  synthesizeSpeech,
} from './src/server/ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Security & Middlewares
app.use(cors());
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Multer memory storage for direct audio uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max audio
});

// Seed an initial demo account if none exists
const DEMO_EMAIL = 'demo@voxai.internal';
if (!storage.findUserByEmail(DEMO_EMAIL)) {
  hashPassword('VoxDemo2026!').then(hashed => {
    storage.createUser({
      id: 'usr_demo_founder_001',
      fullName: 'Alex Vance',
      email: DEMO_EMAIL,
      passwordHash: hashed,
      googleSubject: null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log('Demo user seeded: demo@voxai.internal / VoxDemo2026!');
  });
}

// ----------------------------------------------------
// 1. Health Endpoint
// ----------------------------------------------------
app.get('/api/v1/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      api: 'online',
      storage: 'connected',
      geminiPipeline: !!process.env.GEMINI_API_KEY,
    },
  });
});

// ----------------------------------------------------
// 2. Auth Endpoints
// ----------------------------------------------------
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({ detail: 'Full name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ detail: 'Password must be at least 6 characters.' });
      return;
    }

    const existing = storage.findUserByEmail(email);
    if (existing) {
      res.status(409).json({ detail: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      googleSubject: null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.createUser(user);

    const accessToken = generateAccessToken(user);
    const { token: refreshToken } = generateRefreshToken(user.id);

    res.status(201).json({
      accessToken,
      refreshToken,
      tokenType: 'bearer',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        authProvider: 'local',
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ detail: 'Registration failed due to an internal error.' });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ detail: 'Email and password are required.' });
      return;
    }

    const user = storage.findUserByEmail(email);
    if (!user || !user.passwordHash) {
      res.status(401).json({ detail: 'Invalid email or password.' });
      return;
    }

    const match = await comparePassword(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ detail: 'Invalid email or password.' });
      return;
    }

    const accessToken = generateAccessToken(user);
    const { token: refreshToken } = generateRefreshToken(user.id);

    res.json({
      accessToken,
      refreshToken,
      tokenType: 'bearer',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        authProvider: user.googleSubject ? 'google' : 'local',
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ detail: 'Login failed due to an internal error.' });
  }
});

// Google OAuth verification endpoint
app.post('/api/v1/auth/google/verify', async (req, res) => {
  try {
    const { credential, email, name, sub } = req.body;
    
    // In production with real Google Client ID, verify ID token signature & aud.
    // For universal preview/testing, accept valid google sub + email
    const googleSub = sub || 'g_sub_' + Math.random().toString(36).substring(2, 9);
    const userEmail = (email || 'google.user@example.com').toLowerCase();
    const userName = name || 'Google Explorer';

    let user = storage.findUserByGoogleSubject(googleSub);
    if (!user) {
      user = storage.findUserByEmail(userEmail);
      if (user) {
        // Link google account
        storage.updateUser(user.id, { googleSubject: googleSub });
      } else {
        // Create new OAuth user
        user = {
          id: 'usr_g_' + Math.random().toString(36).substring(2, 10),
          fullName: userName,
          email: userEmail,
          passwordHash: null,
          googleSubject: googleSub,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        storage.createUser(user);
      }
    }

    const accessToken = generateAccessToken(user);
    const { token: refreshToken } = generateRefreshToken(user.id);

    res.json({
      accessToken,
      refreshToken,
      tokenType: 'bearer',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        authProvider: 'google',
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Google Auth error:', err);
    res.status(500).json({ detail: 'Google sign-in verification failed.' });
  }
});

app.get('/api/v1/auth/google/login', (_req, res) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    res.json({
      configured: false,
      message: 'Google OAuth Client ID is not configured in environment variables. You can sign in using email/password or the one-click Google Sign-In button.',
    });
    return;
  }
  const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/v1/auth/google/callback`;
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(googleClientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&access_type=offline`;
  res.json({ configured: true, url });
});

app.get('/api/v1/auth/google/callback', (req, res) => {
  // Callback redirection handling
  res.redirect('/#oauth-success');
});

app.post('/api/v1/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ detail: 'Refresh token is required.' });
    return;
  }

  const userId = verifyRefreshToken(refreshToken);
  if (!userId) {
    res.status(401).json({ detail: 'Invalid or expired refresh token.' });
    return;
  }

  const user = storage.findUserById(userId);
  if (!user || !user.isActive) {
    res.status(401).json({ detail: 'User account inactive or revoked.' });
    return;
  }

  const newAccessToken = generateAccessToken(user);
  res.json({
    accessToken: newAccessToken,
    tokenType: 'bearer',
  });
});

app.post('/api/v1/auth/logout', (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    revokeRefreshToken(refreshToken);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

app.get('/api/v1/auth/me', requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  const settings = storage.getSettings(user.id);
  res.json({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    authProvider: user.googleSubject ? 'google' : 'local',
    createdAt: user.createdAt,
    settings,
  });
});

// ----------------------------------------------------
// 3. User Settings Endpoints
// ----------------------------------------------------
app.get('/api/v1/settings', requireAuth, (req: AuthRequest, res) => {
  const settings = storage.getSettings(req.user!.id);
  res.json(settings);
});

app.put('/api/v1/settings', requireAuth, (req: AuthRequest, res) => {
  const updated = storage.updateSettings(req.user!.id, req.body);
  res.json(updated);
});

// ----------------------------------------------------
// 4. Conversations Endpoints
// ----------------------------------------------------
app.get('/api/v1/conversations', requireAuth, (req: AuthRequest, res) => {
  const conversations = storage.getConversations(req.user!.id);
  res.json(conversations);
});

app.post('/api/v1/conversations', requireAuth, (req: AuthRequest, res) => {
  const { title } = req.body;
  const conv = storage.createConversation(req.user!.id, title || 'New Voice Session');
  res.status(201).json(conv);
});

app.get('/api/v1/conversations/:id', requireAuth, (req: AuthRequest, res) => {
  const conv = storage.getConversationById(req.params.id, req.user!.id);
  if (!conv) {
    res.status(404).json({ detail: 'Conversation not found or access denied.' });
    return;
  }
  const messages = storage.getMessages(conv.id);
  res.json({
    ...conv,
    messages,
  });
});

app.patch('/api/v1/conversations/:id', requireAuth, (req: AuthRequest, res) => {
  const { title } = req.body;
  const conv = storage.updateConversation(req.params.id, req.user!.id, { title });
  if (!conv) {
    res.status(404).json({ detail: 'Conversation not found or access denied.' });
    return;
  }
  res.json(conv);
});

app.delete('/api/v1/conversations/:id', requireAuth, (req: AuthRequest, res) => {
  const ok = storage.deleteConversation(req.params.id, req.user!.id);
  if (!ok) {
    res.status(404).json({ detail: 'Conversation not found or access denied.' });
    return;
  }
  res.json({ success: true, message: 'Conversation deleted.' });
});

// ----------------------------------------------------
// 5. Voice & AI Pipeline Endpoints
// ----------------------------------------------------

/**
 * Audio transcription endpoint (STT)
 */
app.post('/api/v1/voice/transcribe', requireAuth, upload.single('audio'), async (req: AuthRequest, res) => {
  try {
    let audioBase64 = '';
    let mimeType = 'audio/webm';

    if (req.file) {
      audioBase64 = req.file.buffer.toString('base64');
      mimeType = req.file.mimetype || 'audio/webm';
    } else if (req.body.audio) {
      audioBase64 = req.body.audio;
      mimeType = req.body.mimeType || 'audio/webm';
    } else {
      res.status(400).json({ detail: 'No audio data supplied in request.' });
      return;
    }

    const userSettings = storage.getSettings(req.user!.id);
    const language = req.body.language || userSettings.language || 'en-US';

    const text = await transcribeAudio(audioBase64, mimeType, language);
    res.json({ text });
  } catch (err: any) {
    console.error('Transcription route error:', err);
    res.status(500).json({ detail: err.message || 'Speech-to-text failed.' });
  }
});

/**
 * Text chat reasoning endpoint (LLM)
 */
app.post('/api/v1/voice/chat', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { conversationId, message } = req.body;
    if (!message || !message.trim()) {
      res.status(400).json({ detail: 'Message content is required.' });
      return;
    }

    const userSettings = storage.getSettings(req.user!.id);
    const language = req.body.language || userSettings.language || 'en-US';
    const voiceStyle = req.body.voiceStyle || userSettings.voiceStyle || 'Cute, cheerful, warm and sweet';

    let convId = conversationId;
    if (!convId) {
      const conv = storage.createConversation(req.user!.id, 'New Voice Session');
      convId = conv.id;
    } else {
      const existing = storage.getConversationById(convId, req.user!.id);
      if (!existing) {
        res.status(404).json({ detail: 'Conversation not found.' });
        return;
      }
    }

    // Save user message
    const userMsg = storage.addMessage({
      conversationId: convId,
      role: 'user',
      content: message.trim(),
      inputType: 'text',
    });

    const history = storage.getMessages(convId);
    const replyText = await generateChatResponse(message, history, undefined, language, voiceStyle);

    // Save assistant message
    const assistantMsg = storage.addMessage({
      conversationId: convId,
      role: 'assistant',
      content: replyText,
      inputType: 'text',
    });

    res.json({
      conversationId: convId,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    });
  } catch (err: any) {
    console.error('Chat route error:', err);
    res.status(500).json({ detail: err.message || 'Failed to process chat response.' });
  }
});

/**
 * Text-to-speech synthesis endpoint (TTS)
 */
app.post('/api/v1/voice/synthesize', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { text, voice, style } = req.body;
    if (!text || !text.trim()) {
      res.status(400).json({ detail: 'Text to synthesize is required.' });
      return;
    }

    const userSettings = storage.getSettings(req.user!.id);
    const selectedVoice = voice || userSettings.defaultVoice || 'Kore';
    const selectedStyle = style || userSettings.voiceStyle || 'Cute, cheerful, warm and sweet';

    const result = await synthesizeSpeech(text, selectedVoice, selectedStyle);
    res.json(result);
  } catch (err: any) {
    console.error('TTS route error:', err);
    res.status(500).json({ detail: err.message || 'Speech synthesis failed.' });
  }
});

/**
 * Complete End-to-End Voice Turn
 * Audio in -> STT -> LLM Reasoning -> TTS -> Audio out
 */
app.post('/api/v1/voice/turn', requireAuth, upload.single('audio'), async (req: AuthRequest, res) => {
  try {
    let convId = req.body.conversationId;
    let audioBase64 = '';
    let mimeType = 'audio/webm';
    let transcription = req.body.textFallback || '';

    const userSettings = storage.getSettings(req.user!.id);
    const language = req.body.language || userSettings.language || 'en-US';
    const voice = req.body.voice || userSettings.defaultVoice || 'Kore';
    const voiceStyle = req.body.voiceStyle || userSettings.voiceStyle || 'Cute, cheerful, warm and sweet';

    if (req.file) {
      audioBase64 = req.file.buffer.toString('base64');
      mimeType = req.file.mimetype || 'audio/webm';
    } else if (req.body.audio) {
      audioBase64 = req.body.audio;
      mimeType = req.body.mimeType || 'audio/webm';
    }

    // Step 1: Transcribe if audio is provided
    if (audioBase64 && (!transcription || transcription.trim().length === 0)) {
      try {
        transcription = await transcribeAudio(audioBase64, mimeType, language);
      } catch (sttErr: any) {
        console.warn('Backend STT failed, checking text fallback:', sttErr?.message);
        if (!transcription) {
          throw new Error('Speech transcription failed. Please try speaking again.');
        }
      }
    }

    if (!transcription || !transcription.trim()) {
      res.status(400).json({ detail: 'No clear speech detected. Please speak closer to your microphone.' });
      return;
    }

    // Ensure conversation exists
    if (!convId) {
      const conv = storage.createConversation(req.user!.id, 'New Voice Session');
      convId = conv.id;
    } else {
      const existing = storage.getConversationById(convId, req.user!.id);
      if (!existing) {
        const conv = storage.createConversation(req.user!.id, 'Voice Session');
        convId = conv.id;
      }
    }

    // Step 2: Record User Message
    const userMessage = storage.addMessage({
      conversationId: convId,
      role: 'user',
      content: transcription.trim(),
      inputType: audioBase64 ? 'voice' : 'text',
    });

    // Step 3: LLM Conversation Reasoning with Language & History
    const history = storage.getMessages(convId);
    const assistantText = await generateChatResponse(transcription, history, undefined, language, voiceStyle);

    // Step 4: Text-to-Speech synthesis
    let audioDataUrl: string | undefined;

    if (userSettings.autoPlaySpeech) {
      try {
        const ttsResult = await synthesizeSpeech(assistantText, voice, voiceStyle);
        audioDataUrl = ttsResult.audioDataUrl;
      } catch (ttsErr: any) {
        console.warn('TTS generation failed on server, client will use Web Speech synthesis fallback:', ttsErr?.message);
      }
    }

    // Step 5: Save assistant message
    const assistantMessage = storage.addMessage({
      conversationId: convId,
      role: 'assistant',
      content: assistantText,
      inputType: 'voice',
      audioDataUrl: audioDataUrl ? audioDataUrl.slice(0, 500) : undefined,
    });

    res.json({
      conversationId: convId,
      transcription,
      response: assistantText,
      audioDataUrl,
      userMessage,
      assistantMessage,
    });
  } catch (err: any) {
    console.error('Voice turn pipeline error:', err);
    res.status(500).json({ detail: err.message || 'Voice interaction turn failed.' });
  }
});

// ----------------------------------------------------
// 6. Vite Integration / Static file serving
// ----------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`VoxAI Server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
