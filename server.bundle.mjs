// backend/src/env.ts
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
var here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../.env") });
dotenv.config({ path: path.resolve(here, "../../.env") });

// backend/src/index.ts
import express from "express";
import cors from "cors";
import multer from "multer";

// backend/src/db.ts
import { Pool } from "pg";
function connectionString() {
  const raw = process.env.DATABASE_URL || "";
  return raw.replace(/([?&])channel_binding=[^&]*/g, "$1").replace(/\?&/g, "?").replace(/[?&]$/g, "");
}
var databaseUrl = connectionString();
var useSsl = /sslmode=(require|verify-ca|verify-full)|neon\.tech/i.test(databaseUrl);
var pool = new Pool({
  connectionString: databaseUrl || "postgresql://127.0.0.1:1/voxai",
  ssl: databaseUrl && useSsl ? { rejectUnauthorized: false } : void 0,
  max: 5,
  idleTimeoutMillis: 2e4,
  connectionTimeoutMillis: 8e3
});
function iso(value) {
  if (!value) return (/* @__PURE__ */ new Date()).toISOString();
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
function mapUser(row) {
  return {
    id: String(row.id),
    fullName: String(row.full_name),
    email: String(row.email),
    passwordHash: row.password_hash ? String(row.password_hash) : null,
    googleSubject: row.google_subject ? String(row.google_subject) : null,
    isActive: Boolean(row.is_active),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}
function mapConversation(row) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    messageCount: row.message_count !== void 0 ? Number(row.message_count) : void 0,
    lastMessage: row.last_message ? String(row.last_message) : void 0
  };
}
function mapMessage(row) {
  return {
    id: String(row.id),
    conversationId: String(row.conversation_id),
    role: row.role,
    content: String(row.content),
    inputType: row.input_type || "text",
    createdAt: iso(row.created_at)
  };
}
function mapSettings(row) {
  const gender = row.voice_gender === "male" ? "male" : "female";
  const theme = row.theme === "light" || row.theme === "system" ? row.theme : "dark";
  return {
    userId: String(row.user_id),
    defaultVoice: String(row.default_voice || "Kore"),
    voiceGender: gender,
    voiceStyle: String(row.voice_style || "Cute, cheerful, warm, and sweet friendly tone"),
    voicePitch: Number(row.voice_pitch ?? 1.15),
    language: String(row.language || "en-US"),
    playbackSpeed: Number(row.playback_speed ?? 1),
    autoPlaySpeech: Boolean(row.auto_play_speech),
    micNoiseSuppression: Boolean(row.mic_noise_suppression),
    theme,
    audioRetentionDays: Number(row.audio_retention_days ?? 0)
  };
}
var DEFAULT_SETTINGS = {
  defaultVoice: "Kore",
  voiceGender: "female",
  voiceStyle: "Cute, cheerful, warm, and sweet friendly tone",
  voicePitch: 1.15,
  language: "en-US",
  playbackSpeed: 1,
  autoPlaySpeech: true,
  micNoiseSuppression: true,
  theme: "dark",
  audioRetentionDays: 0
};
async function initDatabase() {
  await pool.query("SELECT 1");
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      google_subject TEXT UNIQUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      default_voice TEXT NOT NULL DEFAULT 'Kore',
      voice_gender TEXT NOT NULL DEFAULT 'female',
      voice_style TEXT NOT NULL DEFAULT 'Cute, cheerful, warm, and sweet friendly tone',
      voice_pitch DOUBLE PRECISION NOT NULL DEFAULT 1.15,
      language TEXT NOT NULL DEFAULT 'en-US',
      playback_speed DOUBLE PRECISION NOT NULL DEFAULT 1,
      auto_play_speech BOOLEAN NOT NULL DEFAULT TRUE,
      mic_noise_suppression BOOLEAN NOT NULL DEFAULT TRUE,
      theme TEXT NOT NULL DEFAULT 'dark',
      audio_retention_days INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS refresh_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      input_type TEXT NOT NULL DEFAULT 'text',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON refresh_sessions(user_id);
  `);
}
async function findUserByEmail(email) {
  const result = await pool.query("SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1", [email.trim()]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}
async function findUserById(id) {
  const result = await pool.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [id]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}
async function findUserByGoogleSubject(sub) {
  const result = await pool.query("SELECT * FROM users WHERE google_subject = $1 LIMIT 1", [sub]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}
async function createUser(user) {
  const client2 = await pool.connect();
  try {
    await client2.query("BEGIN");
    await client2.query(
      `INSERT INTO users (id, full_name, email, password_hash, google_subject, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [user.id, user.fullName, user.email.toLowerCase(), user.passwordHash, user.googleSubject, user.isActive, user.createdAt, user.updatedAt]
    );
    await client2.query(
      `INSERT INTO user_settings (
         user_id, default_voice, voice_gender, voice_style, voice_pitch, language,
         playback_speed, auto_play_speech, mic_noise_suppression, theme, audio_retention_days
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        user.id,
        DEFAULT_SETTINGS.defaultVoice,
        DEFAULT_SETTINGS.voiceGender,
        DEFAULT_SETTINGS.voiceStyle,
        DEFAULT_SETTINGS.voicePitch,
        DEFAULT_SETTINGS.language,
        DEFAULT_SETTINGS.playbackSpeed,
        DEFAULT_SETTINGS.autoPlaySpeech,
        DEFAULT_SETTINGS.micNoiseSuppression,
        DEFAULT_SETTINGS.theme,
        DEFAULT_SETTINGS.audioRetentionDays
      ]
    );
    await client2.query("COMMIT");
    return user;
  } catch (err) {
    await client2.query("ROLLBACK");
    throw err;
  } finally {
    client2.release();
  }
}
async function updateUser(id, updates) {
  const current = await findUserById(id);
  if (!current) return null;
  const next = { ...current, ...updates, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  await pool.query(
    `UPDATE users
     SET full_name = $2, email = $3, password_hash = $4, google_subject = $5, is_active = $6, updated_at = $7
     WHERE id = $1`,
    [id, next.fullName, next.email, next.passwordHash, next.googleSubject, next.isActive, next.updatedAt]
  );
  return next;
}
async function createSession(session) {
  await pool.query(
    `INSERT INTO refresh_sessions (id, user_id, token_hash, expires_at, revoked_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [session.id, session.userId, session.tokenHash, session.expiresAt, session.revokedAt, session.createdAt]
  );
}
async function findSession(tokenHash) {
  const result = await pool.query(
    "SELECT * FROM refresh_sessions WHERE token_hash = $1 AND revoked_at IS NULL LIMIT 1",
    [tokenHash]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: iso(row.expires_at),
    revokedAt: row.revoked_at ? iso(row.revoked_at) : null,
    createdAt: iso(row.created_at)
  };
}
async function revokeSession(tokenHash) {
  await pool.query(
    "UPDATE refresh_sessions SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL",
    [tokenHash]
  );
}
async function getSettings(userId) {
  const result = await pool.query("SELECT * FROM user_settings WHERE user_id = $1", [userId]);
  if (!result.rows[0]) {
    await pool.query(
      `INSERT INTO user_settings (
         user_id, default_voice, voice_gender, voice_style, voice_pitch, language,
         playback_speed, auto_play_speech, mic_noise_suppression, theme, audio_retention_days
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        userId,
        DEFAULT_SETTINGS.defaultVoice,
        DEFAULT_SETTINGS.voiceGender,
        DEFAULT_SETTINGS.voiceStyle,
        DEFAULT_SETTINGS.voicePitch,
        DEFAULT_SETTINGS.language,
        DEFAULT_SETTINGS.playbackSpeed,
        DEFAULT_SETTINGS.autoPlaySpeech,
        DEFAULT_SETTINGS.micNoiseSuppression,
        DEFAULT_SETTINGS.theme,
        DEFAULT_SETTINGS.audioRetentionDays
      ]
    );
    return { userId, ...DEFAULT_SETTINGS };
  }
  return mapSettings(result.rows[0]);
}
var SETTINGS_COLUMNS = {
  defaultVoice: "default_voice",
  voiceGender: "voice_gender",
  voiceStyle: "voice_style",
  voicePitch: "voice_pitch",
  language: "language",
  playbackSpeed: "playback_speed",
  autoPlaySpeech: "auto_play_speech",
  micNoiseSuppression: "mic_noise_suppression",
  theme: "theme",
  audioRetentionDays: "audio_retention_days"
};
async function updateSettings(userId, updates) {
  await getSettings(userId);
  const entries = Object.entries(updates).filter(([key]) => key in SETTINGS_COLUMNS && key !== "userId");
  if (entries.length) {
    const sets = entries.map(([key], index) => `${SETTINGS_COLUMNS[key]} = $${index + 2}`);
    const values = entries.map(([, value]) => value);
    await pool.query(`UPDATE user_settings SET ${sets.join(", ")} WHERE user_id = $1`, [userId, ...values]);
  }
  return getSettings(userId);
}
async function getConversations(userId) {
  const result = await pool.query(
    `SELECT c.*,
            (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS message_count,
            (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message
     FROM conversations c
     WHERE c.user_id = $1
     ORDER BY c.updated_at DESC`,
    [userId]
  );
  return result.rows.map(mapConversation);
}
async function getConversationById(id, userId) {
  const result = await pool.query(
    "SELECT * FROM conversations WHERE id = $1 AND user_id = $2 LIMIT 1",
    [id, userId]
  );
  return result.rows[0] ? mapConversation(result.rows[0]) : null;
}
async function createConversation(userId, title = "New Voice Session") {
  const conv = {
    id: "conv_" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36),
    userId,
    title,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await pool.query(
    "INSERT INTO conversations (id, user_id, title, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)",
    [conv.id, conv.userId, conv.title, conv.createdAt, conv.updatedAt]
  );
  return { ...conv, messageCount: 0 };
}
async function updateConversation(id, userId, updates) {
  const current = await getConversationById(id, userId);
  if (!current) return null;
  const title = updates.title?.trim() || current.title;
  const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  await pool.query("UPDATE conversations SET title = $3, updated_at = $4 WHERE id = $1 AND user_id = $2", [
    id,
    userId,
    title,
    updatedAt
  ]);
  return { ...current, title, updatedAt };
}
async function deleteConversation(id, userId) {
  const result = await pool.query("DELETE FROM conversations WHERE id = $1 AND user_id = $2", [id, userId]);
  return (result.rowCount ?? 0) > 0;
}
async function getMessages(conversationId) {
  const result = await pool.query(
    "SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
    [conversationId]
  );
  return result.rows.map(mapMessage);
}
async function addMessage(msg) {
  const created = {
    ...msg,
    id: "msg_" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const client2 = await pool.connect();
  try {
    await client2.query("BEGIN");
    await client2.query(
      `INSERT INTO messages (id, conversation_id, role, content, input_type, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [created.id, created.conversationId, created.role, created.content, created.inputType, created.createdAt]
    );
    const conv = await client2.query("SELECT title FROM conversations WHERE id = $1", [created.conversationId]);
    let title = conv.rows[0]?.title;
    if (title === "New Voice Session" && created.role === "user") {
      const trimmed = created.content.trim().slice(0, 36);
      title = trimmed.length >= 35 ? `${trimmed}...` : trimmed || "Voice Conversation";
    }
    await client2.query("UPDATE conversations SET updated_at = $2, title = $3 WHERE id = $1", [
      created.conversationId,
      created.createdAt,
      title || "Voice Conversation"
    ]);
    await client2.query("COMMIT");
    return created;
  } catch (err) {
    await client2.query("ROLLBACK");
    throw err;
  } finally {
    client2.release();
  }
}

// backend/src/auth.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
var ACCESS_TOKEN_EXPIRY = "15m";
var REFRESH_TOKEN_EXPIRY_DAYS = 7;
function jwtSecret() {
  return process.env.JWT_SECRET || "voxai_jwt_production_secret_key_9921_alpha";
}
function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}
function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, fullName: user.fullName },
    jwtSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}
async function generateRefreshToken(userId) {
  const token = crypto.randomBytes(40).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1e3);
  await createSession({
    id: "sess_" + crypto.randomBytes(12).toString("hex"),
    userId,
    tokenHash,
    expiresAt: expiresAt.toISOString(),
    revokedAt: null,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  return { token, expiresAt };
}
async function verifyRefreshToken(token) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const session = await findSession(tokenHash);
  if (!session) return null;
  if (new Date(session.expiresAt) < /* @__PURE__ */ new Date()) {
    await revokeSession(tokenHash);
    return null;
  }
  return session.userId;
}
async function revokeRefreshToken(token) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await revokeSession(tokenHash);
}
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ detail: "Authentication required. No token provided." });
    return;
  }
  const token = authHeader.substring(7).trim();
  try {
    const payload = jwt.verify(token, jwtSecret());
    const user = await findUserById(payload.sub);
    if (!user || !user.isActive) {
      res.status(401).json({ detail: "User session invalid or inactive." });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ detail: "Token expired or invalid signature." });
  }
}
function publicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    authProvider: user.googleSubject ? "google" : "local",
    createdAt: user.createdAt
  };
}

// backend/src/ai.ts
import OpenAI, { toFile } from "openai";

// backend/src/tools.ts
var WEATHER_CODES = {
  0: "clear sky",
  1: "mainly clear",
  2: "partly cloudy",
  3: "overcast",
  45: "foggy",
  48: "foggy",
  51: "light drizzle",
  53: "drizzle",
  55: "heavy drizzle",
  61: "light rain",
  63: "rain",
  65: "heavy rain",
  71: "light snow",
  73: "snow",
  75: "heavy snow",
  80: "rain showers",
  81: "rain showers",
  82: "heavy rain showers",
  95: "thunderstorm",
  96: "thunderstorm with hail",
  99: "thunderstorm with hail"
};
async function readJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(8e3) });
  if (!response.ok) {
    throw new Error(`Weather service returned ${response.status}`);
  }
  return response.json();
}
async function locate(query) {
  const place = query?.trim();
  if (place) {
    const data = await readJson(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=en&format=json`
    );
    const hit = data?.results?.[0];
    if (!hit) return null;
    return {
      name: [hit.name, hit.admin1].filter(Boolean).join(", "),
      country: hit.country,
      latitude: hit.latitude,
      longitude: hit.longitude
    };
  }
  const ip = await readJson("https://ipwho.is/");
  if (!ip?.success || typeof ip.latitude !== "number" || typeof ip.longitude !== "number") {
    return null;
  }
  return {
    name: [ip.city, ip.region].filter(Boolean).join(", ") || "your area",
    country: ip.country,
    latitude: ip.latitude,
    longitude: ip.longitude
  };
}
async function getCurrentWeather(location) {
  try {
    const place = await locate(location);
    if (!place) {
      return { error: location ? `No place found for "${location}".` : "Could not detect the current location. Ask for a city name." };
    }
    const data = await readJson(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto&temperature_unit=celsius&wind_speed_unit=kmh`
    );
    const current = data?.current;
    if (!current || typeof current.temperature_2m !== "number") {
      return { error: "The weather service did not return a current temperature." };
    }
    const code = Number(current.weather_code);
    return {
      location: place.name,
      country: place.country,
      temperatureC: current.temperature_2m,
      feelsLikeC: current.apparent_temperature,
      humidityPercent: current.relative_humidity_2m,
      windKmh: current.wind_speed_10m,
      condition: WEATHER_CODES[code] || "unknown conditions",
      observedAt: current.time,
      timezone: data.timezone || "auto"
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Weather lookup failed.";
    return { error: message };
  }
}

// backend/src/ai.ts
var LANGUAGE_NAMES = {
  "en-US": "English (United States)",
  "en-GB": "English (United Kingdom)",
  "es-ES": "Spanish (Espa\xF1ol)",
  "fr-FR": "French (Fran\xE7ais)",
  "de-DE": "German (Deutsch)",
  "it-IT": "Italian (Italiano)",
  "ja-JP": "Japanese (\u65E5\u672C\u8A9E)",
  "ko-KR": "Korean (\uD55C\uAD6D\uC5B4)",
  "zh-CN": "Chinese Mandarin (\u7B80\u4F53\u4E2D\u6587)",
  "hi-IN": "Hindi (\u0939\u093F\u0928\u094D\u0926\u0940)",
  "te-IN": "Telugu (\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41)",
  "kn-IN": "Kannada (\u0C95\u0CA8\u0CCD\u0CA8\u0CA1)",
  "ta-IN": "Tamil (\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD)",
  "pt-BR": "Portuguese (Portugu\xEAs)",
  "ar-SA": "Arabic (\u0627\u0644\u0639\u0631\u0628\u064A\u0629)",
  "ru-RU": "Russian (\u0420\u0443\u0441\u0441\u043A\u0438\u0439)",
  "nl-NL": "Dutch (Nederlands)"
};
var VOICE_MAP = {
  Kore: "nova",
  Charon: "shimmer",
  Puck: "echo",
  Zephyr: "fable",
  Fenrir: "onyx",
  alloy: "alloy",
  echo: "echo",
  fable: "fable",
  onyx: "onyx",
  nova: "nova",
  shimmer: "shimmer"
};
function client() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the server.");
  }
  return new OpenAI({ apiKey });
}
function openaiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}
function mapVoice(voiceName) {
  if (!voiceName) return "nova";
  return VOICE_MAP[voiceName] || "nova";
}
async function transcribeAudio(audioBase64, mimeType = "audio/webm", language = "en-US") {
  const clean = audioBase64.replace(/^data:audio\/[^;]+;base64,/, "");
  const buffer = Buffer.from(clean, "base64");
  if (!buffer.length) {
    throw new Error("Audio payload was empty.");
  }
  const ext = mimeType.includes("wav") ? "wav" : mimeType.includes("mp3") || mimeType.includes("mpeg") ? "mp3" : "webm";
  const file = await toFile(buffer, `speech.${ext}`, { type: mimeType.split(";")[0] || "audio/webm" });
  const lang = language.split("-")[0];
  const transcript = await client().audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: lang || void 0
  });
  return (transcript.text || "").trim();
}
async function generateChatResponse(userPrompt, history = [], language = "en-US", voiceStyle = "Cute, cheerful, warm and sweet") {
  const targetLangName = LANGUAGE_NAMES[language] || language;
  const messages = [
    {
      role: "system",
      content: `You are VoxAI, a voice conversational assistant with a cute, cheerful, friendly personality.
Your answers are spoken out loud.
1. Reply fluently in ${targetLangName} (${language}).
2. Tone: ${voiceStyle}.
3. Keep replies to 1-3 conversational sentences unless the user asks for detail.
4. Do not use markdown, tables, or symbols that sound awkward when read aloud.
5. If asked who you are, introduce yourself as VoxAI.
6. You have a live weather tool. If the user asks about weather, temperature, rain, humidity, wind, or today's conditions, call get_current_weather before you answer. Never invent a temperature or forecast.
7. If they do not name a city, call get_current_weather with an empty location so it uses their current area.
8. Say the place, the temperature in Celsius, and the sky condition in one or two short spoken sentences. Use Fahrenheit only if they ask for it.`
    }
  ];
  const recent = history.slice(-8).filter((item) => item.role !== "system");
  for (const item of recent) {
    messages.push({
      role: item.role === "assistant" ? "assistant" : "user",
      content: item.content
    });
  }
  const last = recent[recent.length - 1];
  if (!(last && last.role === "user" && last.content.trim() === userPrompt.trim())) {
    messages.push({ role: "user", content: userPrompt });
  }
  const tools = [
    {
      type: "function",
      function: {
        name: "get_current_weather",
        description: "Look up the live current temperature and weather for a city, or for the user's current area when no city is given. Use this for any weather or temperature question.",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "City or place name, such as Hyderabad or London. Leave empty to use the user's current area."
            }
          }
        }
      }
    }
  ];
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  for (let step = 0; step < 3; step += 1) {
    const response = await client().chat.completions.create({
      model,
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.4,
      max_tokens: 300
    });
    const choice = response.choices[0]?.message;
    const toolCalls = choice?.tool_calls ?? [];
    if (!toolCalls.length) {
      const reply = choice?.content?.trim();
      if (!reply) throw new Error("The language model returned an empty reply.");
      return reply;
    }
    messages.push(choice);
    for (const call of toolCalls) {
      if (call.type !== "function") continue;
      let location = "";
      try {
        location = String(JSON.parse(call.function.arguments || "{}").location || "");
      } catch {
        location = "";
      }
      const result = call.function.name === "get_current_weather" ? await getCurrentWeather(location) : { error: "That tool is not available." };
      console.log("Live tool", call.function.name, result);
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result)
      });
    }
  }
  throw new Error("The assistant could not finish the live lookup.");
}
async function synthesizeSpeech(text, voiceName = "Kore") {
  const sanitized = text.replace(/\*+/g, "").replace(/```[\s\S]*?```/g, "Code snippet.").slice(0, 1e3);
  const speech = await client().audio.speech.create({
    model: "tts-1",
    voice: mapVoice(voiceName),
    input: sanitized || "Hello from VoxAI.",
    response_format: "mp3"
  });
  const buffer = Buffer.from(await speech.arrayBuffer());
  return {
    audioDataUrl: `data:audio/mpeg;base64,${buffer.toString("base64")}`,
    format: "audio/mpeg"
  };
}

// backend/src/index.ts
var app = express();
var port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8e3;
var DEMO_EMAIL = "demo@voxai.internal";
var DEMO_PASSWORD = "VoxDemo2026!";
app.use(cors());
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});
var bootPromise = null;
function whenReady() {
  if (!bootPromise) {
    bootPromise = (async () => {
      await initDatabase();
      await seedDemo();
    })();
  }
  return bootPromise;
}
app.use((req, res, next) => {
  if (!req.path.startsWith("/api")) {
    next();
    return;
  }
  whenReady().then(() => next()).catch((err) => {
    console.error("Database unavailable:", err instanceof Error ? err.message : err);
    if (!res.headersSent) {
      res.status(503).json({ detail: "Database is unavailable. Set DATABASE_URL and try again." });
    }
  });
});
function asyncRoute(handler) {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
function safeMessage(err, fallback) {
  const message = err instanceof Error ? err.message : "";
  const code = typeof err === "object" && err && "code" in err ? String(err.code || "") : "";
  if (code === "invalid_api_key" || /incorrect api key/i.test(message)) {
    return "The OpenAI API key was rejected. Put a valid OPENAI_API_KEY in .env and restart the API.";
  }
  if (message.includes("sk-") || message.toLowerCase().includes("api key")) {
    return fallback;
  }
  return message || fallback;
}
app.get("/api/v1/health", asyncRoute(async (_req, res) => {
  let database = "disconnected";
  try {
    await pool.query("SELECT 1");
    database = "connected";
  } catch {
    database = "error";
  }
  res.json({
    status: database === "connected" ? "healthy" : "degraded",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    version: "1.0.0",
    services: {
      api: "online",
      database,
      openai: openaiConfigured()
    }
  });
}));
app.post("/api/v1/auth/register", asyncRoute(async (req, res) => {
  const { fullName, email, password } = req.body ?? {};
  if (!fullName || !email || !password) {
    res.status(400).json({ detail: "Full name, email, and password are required." });
    return;
  }
  if (String(password).length < 6) {
    res.status(400).json({ detail: "Password must be at least 6 characters." });
    return;
  }
  const existing = await findUserByEmail(email);
  if (existing) {
    res.status(409).json({ detail: "An account with this email already exists." });
    return;
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const user = {
    id: "usr_" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36),
    fullName: String(fullName).trim(),
    email: String(email).trim().toLowerCase(),
    passwordHash: await hashPassword(password),
    googleSubject: null,
    isActive: true,
    createdAt: now,
    updatedAt: now
  };
  await createUser(user);
  const accessToken = generateAccessToken(user);
  const { token: refreshToken } = await generateRefreshToken(user.id);
  res.status(201).json({
    accessToken,
    refreshToken,
    tokenType: "bearer",
    user: publicUser(user)
  });
}));
app.post("/api/v1/auth/login", asyncRoute(async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ detail: "Email and password are required." });
    return;
  }
  const user = await findUserByEmail(email);
  if (!user || !user.passwordHash) {
    res.status(401).json({ detail: "Invalid email or password." });
    return;
  }
  const match = await comparePassword(password, user.passwordHash);
  if (!match) {
    res.status(401).json({ detail: "Invalid email or password." });
    return;
  }
  const accessToken = generateAccessToken(user);
  const { token: refreshToken } = await generateRefreshToken(user.id);
  res.json({
    accessToken,
    refreshToken,
    tokenType: "bearer",
    user: publicUser(user)
  });
}));
app.post("/api/v1/auth/google/verify", asyncRoute(async (req, res) => {
  const { email, name, sub } = req.body ?? {};
  const googleSub = sub || "g_sub_" + Math.random().toString(36).slice(2, 9);
  const userEmail = String(email || "google.user@example.com").toLowerCase();
  const userName = name || "Google Explorer";
  let user = await findUserByGoogleSubject(googleSub);
  if (!user) {
    user = await findUserByEmail(userEmail);
    if (user) {
      user = await updateUser(user.id, { googleSubject: googleSub }) || user;
    } else {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      user = {
        id: "usr_g_" + Math.random().toString(36).slice(2, 10),
        fullName: userName,
        email: userEmail,
        passwordHash: null,
        googleSubject: googleSub,
        isActive: true,
        createdAt: now,
        updatedAt: now
      };
      await createUser(user);
    }
  }
  const accessToken = generateAccessToken(user);
  const { token: refreshToken } = await generateRefreshToken(user.id);
  res.json({
    accessToken,
    refreshToken,
    tokenType: "bearer",
    user: { ...publicUser(user), authProvider: "google" }
  });
}));
app.get("/api/v1/auth/google/login", (_req, res) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    res.json({
      configured: false,
      message: "Google OAuth is not configured. Sign in with email and password, or use the demo account."
    });
    return;
  }
  const redirectUri = `${process.env.APP_URL || "http://localhost:3000"}/api/v1/auth/google/callback`;
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(googleClientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&access_type=offline`;
  res.json({ configured: true, url });
});
app.post("/api/v1/auth/refresh", asyncRoute(async (req, res) => {
  const refreshToken = req.body?.refreshToken || req.body?.refresh_token;
  if (!refreshToken) {
    res.status(400).json({ detail: "Refresh token is required." });
    return;
  }
  const userId = await verifyRefreshToken(refreshToken);
  if (!userId) {
    res.status(401).json({ detail: "Invalid or expired refresh token." });
    return;
  }
  const user = await findUserById(userId);
  if (!user || !user.isActive) {
    res.status(401).json({ detail: "User account inactive or revoked." });
    return;
  }
  res.json({ accessToken: generateAccessToken(user), tokenType: "bearer" });
}));
app.post("/api/v1/auth/logout", asyncRoute(async (req, res) => {
  const refreshToken = req.body?.refreshToken || req.body?.refresh_token;
  if (refreshToken) await revokeRefreshToken(refreshToken);
  res.json({ success: true, message: "Logged out successfully." });
}));
app.get("/api/v1/auth/me", requireAuth, asyncRoute(async (req, res) => {
  const user = req.user;
  const settings = await getSettings(user.id);
  res.json({ ...publicUser(user), settings });
}));
app.get("/api/v1/settings", requireAuth, asyncRoute(async (req, res) => {
  res.json(await getSettings(req.user.id));
}));
app.put("/api/v1/settings", requireAuth, asyncRoute(async (req, res) => {
  res.json(await updateSettings(req.user.id, req.body ?? {}));
}));
app.get("/api/v1/conversations", requireAuth, asyncRoute(async (req, res) => {
  res.json(await getConversations(req.user.id));
}));
app.post("/api/v1/conversations", requireAuth, asyncRoute(async (req, res) => {
  const conv = await createConversation(req.user.id, req.body?.title || "New Voice Session");
  res.status(201).json(conv);
}));
app.get("/api/v1/conversations/:id", requireAuth, asyncRoute(async (req, res) => {
  const userId = req.user.id;
  const conv = await getConversationById(req.params.id, userId);
  if (!conv) {
    res.status(404).json({ detail: "Conversation not found or access denied." });
    return;
  }
  res.json({ ...conv, messages: await getMessages(conv.id) });
}));
app.patch("/api/v1/conversations/:id", requireAuth, asyncRoute(async (req, res) => {
  const conv = await updateConversation(req.params.id, req.user.id, { title: req.body?.title });
  if (!conv) {
    res.status(404).json({ detail: "Conversation not found or access denied." });
    return;
  }
  res.json(conv);
}));
app.delete("/api/v1/conversations/:id", requireAuth, asyncRoute(async (req, res) => {
  const ok = await deleteConversation(req.params.id, req.user.id);
  if (!ok) {
    res.status(404).json({ detail: "Conversation not found or access denied." });
    return;
  }
  res.json({ success: true, message: "Conversation deleted." });
}));
app.post("/api/v1/voice/transcribe", requireAuth, upload.single("audio"), asyncRoute(async (req, res) => {
  const user = req.user;
  let audioBase64 = "";
  let mimeType = "audio/webm";
  if (req.file) {
    audioBase64 = req.file.buffer.toString("base64");
    mimeType = req.file.mimetype || "audio/webm";
  } else if (req.body.audio) {
    audioBase64 = req.body.audio;
    mimeType = req.body.mimeType || "audio/webm";
  } else {
    res.status(400).json({ detail: "No audio data supplied in request." });
    return;
  }
  const settings = await getSettings(user.id);
  const text = await transcribeAudio(audioBase64, mimeType, req.body.language || settings.language);
  res.json({ text });
}));
app.post("/api/v1/voice/chat", requireAuth, asyncRoute(async (req, res) => {
  const user = req.user;
  const message = String(req.body?.message || "").trim();
  if (!message) {
    res.status(400).json({ detail: "Message content is required." });
    return;
  }
  const settings = await getSettings(user.id);
  const language = req.body.language || settings.language;
  const voiceStyle = req.body.voiceStyle || settings.voiceStyle;
  let convId = req.body.conversationId;
  if (!convId) {
    convId = (await createConversation(user.id, "New Voice Session")).id;
  } else if (!await getConversationById(convId, user.id)) {
    res.status(404).json({ detail: "Conversation not found." });
    return;
  }
  const userMsg = await addMessage({
    conversationId: convId,
    role: "user",
    content: message,
    inputType: "text"
  });
  const history = await getMessages(convId);
  const replyText = await generateChatResponse(message, history, language, voiceStyle);
  const assistantMsg = await addMessage({
    conversationId: convId,
    role: "assistant",
    content: replyText,
    inputType: "text"
  });
  res.json({ conversationId: convId, userMessage: userMsg, assistantMessage: assistantMsg });
}));
app.post("/api/v1/voice/synthesize", requireAuth, asyncRoute(async (req, res) => {
  const text = String(req.body?.text || "").trim();
  if (!text) {
    res.status(400).json({ detail: "Text to synthesize is required." });
    return;
  }
  const settings = await getSettings(req.user.id);
  const result = await synthesizeSpeech(text, req.body.voice || settings.defaultVoice);
  res.json(result);
}));
app.post("/api/v1/voice/turn", requireAuth, upload.single("audio"), asyncRoute(async (req, res) => {
  const user = req.user;
  const settings = await getSettings(user.id);
  const language = req.body.language || settings.language;
  const voice = req.body.voice || settings.defaultVoice;
  const voiceStyle = req.body.voiceStyle || settings.voiceStyle;
  let transcription = String(req.body.textFallback || "").trim();
  let audioBase64 = "";
  let mimeType = "audio/webm";
  if (req.file) {
    audioBase64 = req.file.buffer.toString("base64");
    mimeType = req.file.mimetype || "audio/webm";
  } else if (req.body.audio) {
    audioBase64 = req.body.audio;
    mimeType = req.body.mimeType || "audio/webm";
  }
  if (audioBase64 && !transcription) {
    transcription = await transcribeAudio(audioBase64, mimeType, language);
  }
  if (!transcription) {
    res.status(400).json({ detail: "No clear speech detected. Please speak closer to your microphone." });
    return;
  }
  let convId = req.body.conversationId;
  if (!convId || !await getConversationById(convId, user.id)) {
    convId = (await createConversation(user.id, "New Voice Session")).id;
  }
  const userMessage = await addMessage({
    conversationId: convId,
    role: "user",
    content: transcription,
    inputType: audioBase64 ? "voice" : "text"
  });
  const history = await getMessages(convId);
  const assistantText = await generateChatResponse(transcription, history, language, voiceStyle);
  let audioDataUrl;
  if (settings.autoPlaySpeech) {
    try {
      audioDataUrl = (await synthesizeSpeech(assistantText, voice)).audioDataUrl;
    } catch (err) {
      console.warn("TTS failed, client can fall back to browser speech:", err instanceof Error ? err.message : err);
    }
  }
  const assistantMessage = await addMessage({
    conversationId: convId,
    role: "assistant",
    content: assistantText,
    inputType: "voice"
  });
  res.json({
    conversationId: convId,
    transcription,
    response: assistantText,
    audioDataUrl,
    userMessage,
    assistantMessage
  });
}));
app.use((err, _req, res, _next) => {
  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({ detail: safeMessage(err, "Request failed due to an internal error.") });
});
async function seedDemo() {
  const existing = await findUserByEmail(DEMO_EMAIL);
  if (existing) return;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await createUser({
    id: "usr_demo_founder_001",
    fullName: "Alex Vance",
    email: DEMO_EMAIL,
    passwordHash: await hashPassword(DEMO_PASSWORD),
    googleSubject: null,
    isActive: true,
    createdAt: now,
    updatedAt: now
  });
  console.log("Demo user ready: demo@voxai.internal");
}
var index_default = app;
var onVercel = Boolean(process.env.VERCEL);
var entry = (process.argv[1] || "").replace(/\\/g, "/");
var startedDirectly = /(?:^|\/)index\.(?:ts|js|mjs|cjs)$/.test(entry);
if (onVercel) {
  whenReady().catch((err) => {
    console.error("Database unavailable:", err instanceof Error ? err.message : err);
  });
} else if (startedDirectly) {
  whenReady().then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`VoxAI API listening on http://127.0.0.1:${port}`);
      console.log(`OpenAI configured: ${openaiConfigured()}`);
    });
  }).catch((err) => {
    console.error("Failed to start API:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
export {
  index_default as default
};
