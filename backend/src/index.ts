import './env';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import {
  addMessage,
  createConversation,
  createUser,
  deleteConversation,
  findUserByEmail,
  findUserByGoogleSubject,
  findUserById,
  getConversationById,
  getConversations,
  getMessages,
  getSettings,
  initDatabase,
  pool,
  updateConversation,
  updateSettings,
  updateUser,
  User,
} from './db';
import {
  AuthRequest,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  publicUser,
  requireAuth,
  revokeRefreshToken,
  verifyRefreshToken,
} from './auth';
import { generateChatResponse, openaiConfigured, synthesizeSpeech, transcribeAudio } from './ai';

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;
const DEMO_EMAIL = 'demo@voxai.internal';
const DEMO_PASSWORD = 'VoxDemo2026!';

app.use(cors());
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

let bootPromise: Promise<void> | null = null;

function whenReady(): Promise<void> {
  if (!bootPromise) {
    bootPromise = (async () => {
      await initDatabase();
      await seedDemo();
    })();
  }
  return bootPromise;
}

app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    next();
    return;
  }
  whenReady().then(() => next()).catch((err: unknown) => {
    console.error('Database unavailable:', err instanceof Error ? err.message : err);
    if (!res.headersSent) {
      res.status(503).json({ detail: 'Database is unavailable. Set DATABASE_URL and try again.' });
    }
  });
});

function asyncRoute(handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

function safeMessage(err: unknown, fallback: string): string {
  const message = err instanceof Error ? err.message : fallback;
  if (message.includes('sk-') || message.toLowerCase().includes('api key')) {
    return fallback;
  }
  return message || fallback;
}

app.get('/api/v1/health', asyncRoute(async (_req, res) => {
  let database = 'disconnected';
  try {
    await pool.query('SELECT 1');
    database = 'connected';
  } catch {
    database = 'error';
  }
  res.json({
    status: database === 'connected' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      api: 'online',
      database,
      openai: openaiConfigured(),
    },
  });
}));

app.post('/api/v1/auth/register', asyncRoute(async (req, res) => {
  const { fullName, email, password } = req.body ?? {};
  if (!fullName || !email || !password) {
    res.status(400).json({ detail: 'Full name, email, and password are required.' });
    return;
  }
  if (String(password).length < 6) {
    res.status(400).json({ detail: 'Password must be at least 6 characters.' });
    return;
  }
  const existing = await findUserByEmail(email);
  if (existing) {
    res.status(409).json({ detail: 'An account with this email already exists.' });
    return;
  }
  const now = new Date().toISOString();
  const user: User = {
    id: 'usr_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36),
    fullName: String(fullName).trim(),
    email: String(email).trim().toLowerCase(),
    passwordHash: await hashPassword(password),
    googleSubject: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  await createUser(user);
  const accessToken = generateAccessToken(user);
  const { token: refreshToken } = await generateRefreshToken(user.id);
  res.status(201).json({
    accessToken,
    refreshToken,
    tokenType: 'bearer',
    user: publicUser(user),
  });
}));

app.post('/api/v1/auth/login', asyncRoute(async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ detail: 'Email and password are required.' });
    return;
  }
  const user = await findUserByEmail(email);
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
  const { token: refreshToken } = await generateRefreshToken(user.id);
  res.json({
    accessToken,
    refreshToken,
    tokenType: 'bearer',
    user: publicUser(user),
  });
}));

app.post('/api/v1/auth/google/verify', asyncRoute(async (req, res) => {
  const { email, name, sub } = req.body ?? {};
  const googleSub = sub || 'g_sub_' + Math.random().toString(36).slice(2, 9);
  const userEmail = String(email || 'google.user@example.com').toLowerCase();
  const userName = name || 'Google Explorer';

  let user = await findUserByGoogleSubject(googleSub);
  if (!user) {
    user = await findUserByEmail(userEmail);
    if (user) {
      user = (await updateUser(user.id, { googleSubject: googleSub })) || user;
    } else {
      const now = new Date().toISOString();
      user = {
        id: 'usr_g_' + Math.random().toString(36).slice(2, 10),
        fullName: userName,
        email: userEmail,
        passwordHash: null,
        googleSubject: googleSub,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      await createUser(user);
    }
  }

  const accessToken = generateAccessToken(user);
  const { token: refreshToken } = await generateRefreshToken(user.id);
  res.json({
    accessToken,
    refreshToken,
    tokenType: 'bearer',
    user: { ...publicUser(user), authProvider: 'google' },
  });
}));

app.get('/api/v1/auth/google/login', (_req, res) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    res.json({
      configured: false,
      message: 'Google OAuth is not configured. Sign in with email and password, or use the demo account.',
    });
    return;
  }
  const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/v1/auth/google/callback`;
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(googleClientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&access_type=offline`;
  res.json({ configured: true, url });
});

app.post('/api/v1/auth/refresh', asyncRoute(async (req, res) => {
  const refreshToken = req.body?.refreshToken || req.body?.refresh_token;
  if (!refreshToken) {
    res.status(400).json({ detail: 'Refresh token is required.' });
    return;
  }
  const userId = await verifyRefreshToken(refreshToken);
  if (!userId) {
    res.status(401).json({ detail: 'Invalid or expired refresh token.' });
    return;
  }
  const user = await findUserById(userId);
  if (!user || !user.isActive) {
    res.status(401).json({ detail: 'User account inactive or revoked.' });
    return;
  }
  res.json({ accessToken: generateAccessToken(user), tokenType: 'bearer' });
}));

app.post('/api/v1/auth/logout', asyncRoute(async (req, res) => {
  const refreshToken = req.body?.refreshToken || req.body?.refresh_token;
  if (refreshToken) await revokeRefreshToken(refreshToken);
  res.json({ success: true, message: 'Logged out successfully.' });
}));

app.get('/api/v1/auth/me', requireAuth, asyncRoute(async (req, res) => {
  const user = (req as AuthRequest).user!;
  const settings = await getSettings(user.id);
  res.json({ ...publicUser(user), settings });
}));

app.get('/api/v1/settings', requireAuth, asyncRoute(async (req, res) => {
  res.json(await getSettings((req as AuthRequest).user!.id));
}));

app.put('/api/v1/settings', requireAuth, asyncRoute(async (req, res) => {
  res.json(await updateSettings((req as AuthRequest).user!.id, req.body ?? {}));
}));

app.get('/api/v1/conversations', requireAuth, asyncRoute(async (req, res) => {
  res.json(await getConversations((req as AuthRequest).user!.id));
}));

app.post('/api/v1/conversations', requireAuth, asyncRoute(async (req, res) => {
  const conv = await createConversation((req as AuthRequest).user!.id, req.body?.title || 'New Voice Session');
  res.status(201).json(conv);
}));

app.get('/api/v1/conversations/:id', requireAuth, asyncRoute(async (req, res) => {
  const userId = (req as AuthRequest).user!.id;
  const conv = await getConversationById(req.params.id, userId);
  if (!conv) {
    res.status(404).json({ detail: 'Conversation not found or access denied.' });
    return;
  }
  res.json({ ...conv, messages: await getMessages(conv.id) });
}));

app.patch('/api/v1/conversations/:id', requireAuth, asyncRoute(async (req, res) => {
  const conv = await updateConversation(req.params.id, (req as AuthRequest).user!.id, { title: req.body?.title });
  if (!conv) {
    res.status(404).json({ detail: 'Conversation not found or access denied.' });
    return;
  }
  res.json(conv);
}));

app.delete('/api/v1/conversations/:id', requireAuth, asyncRoute(async (req, res) => {
  const ok = await deleteConversation(req.params.id, (req as AuthRequest).user!.id);
  if (!ok) {
    res.status(404).json({ detail: 'Conversation not found or access denied.' });
    return;
  }
  res.json({ success: true, message: 'Conversation deleted.' });
}));

app.post('/api/v1/voice/transcribe', requireAuth, upload.single('audio'), asyncRoute(async (req, res) => {
  const user = (req as AuthRequest).user!;
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
  const settings = await getSettings(user.id);
  const text = await transcribeAudio(audioBase64, mimeType, req.body.language || settings.language);
  res.json({ text });
}));

app.post('/api/v1/voice/chat', requireAuth, asyncRoute(async (req, res) => {
  const user = (req as AuthRequest).user!;
  const message = String(req.body?.message || '').trim();
  if (!message) {
    res.status(400).json({ detail: 'Message content is required.' });
    return;
  }
  const settings = await getSettings(user.id);
  const language = req.body.language || settings.language;
  const voiceStyle = req.body.voiceStyle || settings.voiceStyle;

  let convId = req.body.conversationId as string | undefined;
  if (!convId) {
    convId = (await createConversation(user.id, 'New Voice Session')).id;
  } else if (!(await getConversationById(convId, user.id))) {
    res.status(404).json({ detail: 'Conversation not found.' });
    return;
  }

  const userMsg = await addMessage({
    conversationId: convId,
    role: 'user',
    content: message,
    inputType: 'text',
  });
  const history = await getMessages(convId);
  const replyText = await generateChatResponse(message, history, language, voiceStyle);
  const assistantMsg = await addMessage({
    conversationId: convId,
    role: 'assistant',
    content: replyText,
    inputType: 'text',
  });
  res.json({ conversationId: convId, userMessage: userMsg, assistantMessage: assistantMsg });
}));

app.post('/api/v1/voice/synthesize', requireAuth, asyncRoute(async (req, res) => {
  const text = String(req.body?.text || '').trim();
  if (!text) {
    res.status(400).json({ detail: 'Text to synthesize is required.' });
    return;
  }
  const settings = await getSettings((req as AuthRequest).user!.id);
  const result = await synthesizeSpeech(text, req.body.voice || settings.defaultVoice);
  res.json(result);
}));

app.post('/api/v1/voice/turn', requireAuth, upload.single('audio'), asyncRoute(async (req, res) => {
  const user = (req as AuthRequest).user!;
  const settings = await getSettings(user.id);
  const language = req.body.language || settings.language;
  const voice = req.body.voice || settings.defaultVoice;
  const voiceStyle = req.body.voiceStyle || settings.voiceStyle;
  let transcription = String(req.body.textFallback || '').trim();
  let audioBase64 = '';
  let mimeType = 'audio/webm';

  if (req.file) {
    audioBase64 = req.file.buffer.toString('base64');
    mimeType = req.file.mimetype || 'audio/webm';
  } else if (req.body.audio) {
    audioBase64 = req.body.audio;
    mimeType = req.body.mimeType || 'audio/webm';
  }

  if (audioBase64 && !transcription) {
    transcription = await transcribeAudio(audioBase64, mimeType, language);
  }
  if (!transcription) {
    res.status(400).json({ detail: 'No clear speech detected. Please speak closer to your microphone.' });
    return;
  }

  let convId = req.body.conversationId as string | undefined;
  if (!convId || !(await getConversationById(convId, user.id))) {
    convId = (await createConversation(user.id, 'New Voice Session')).id;
  }

  const userMessage = await addMessage({
    conversationId: convId,
    role: 'user',
    content: transcription,
    inputType: audioBase64 ? 'voice' : 'text',
  });
  const history = await getMessages(convId);
  const assistantText = await generateChatResponse(transcription, history, language, voiceStyle);

  let audioDataUrl: string | undefined;
  if (settings.autoPlaySpeech) {
    try {
      audioDataUrl = (await synthesizeSpeech(assistantText, voice)).audioDataUrl;
    } catch (err) {
      console.warn('TTS failed, client can fall back to browser speech:', err instanceof Error ? err.message : err);
    }
  }

  const assistantMessage = await addMessage({
    conversationId: convId,
    role: 'assistant',
    content: assistantText,
    inputType: 'voice',
  });

  res.json({
    conversationId: convId,
    transcription,
    response: assistantText,
    audioDataUrl,
    userMessage,
    assistantMessage,
  });
}));

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({ detail: safeMessage(err, 'Request failed due to an internal error.') });
});

async function seedDemo() {
  const existing = await findUserByEmail(DEMO_EMAIL);
  if (existing) return;
  const now = new Date().toISOString();
  await createUser({
    id: 'usr_demo_founder_001',
    fullName: 'Alex Vance',
    email: DEMO_EMAIL,
    passwordHash: await hashPassword(DEMO_PASSWORD),
    googleSubject: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  console.log('Demo user ready: demo@voxai.internal');
}

export default app;

const onVercel = Boolean(process.env.VERCEL);
const entry = (process.argv[1] || '').replace(/\\/g, '/');
const startedDirectly = /(?:^|\/)index\.(?:ts|js|mjs|cjs)$/.test(entry);

if (onVercel) {
  whenReady().catch((err) => {
    console.error('Database unavailable:', err instanceof Error ? err.message : err);
  });
} else if (startedDirectly) {
  whenReady()
    .then(() => {
      app.listen(port, '0.0.0.0', () => {
        console.log(`VoxAI API listening on http://127.0.0.1:${port}`);
        console.log(`OpenAI configured: ${openaiConfigured()}`);
      });
    })
    .catch((err) => {
      console.error('Failed to start API:', err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
