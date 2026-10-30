import './env';
import { Pool } from 'pg';

export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string | null;
  googleSubject: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  lastMessage?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  inputType: 'voice' | 'text';
  audioDataUrl?: string;
  createdAt: string;
}

export interface RefreshSession {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
}

export interface UserSettings {
  userId: string;
  defaultVoice: string;
  voiceGender: 'female' | 'male';
  voiceStyle: string;
  voicePitch: number;
  language: string;
  playbackSpeed: number;
  autoPlaySpeech: boolean;
  micNoiseSuppression: boolean;
  theme: 'dark' | 'light' | 'system';
  audioRetentionDays: number;
}

function connectionString(): string {
  const raw = process.env.DATABASE_URL || '';
  return raw
    .replace(/([?&])channel_binding=[^&]*/g, '$1')
    .replace(/\?&/g, '?')
    .replace(/[?&]$/g, '');
}

const databaseUrl = connectionString();
const useSsl = /sslmode=(require|verify-ca|verify-full)|neon\.tech/i.test(databaseUrl);

export const pool = new Pool({
  connectionString: databaseUrl || 'postgresql://127.0.0.1:1/voxai',
  ssl: databaseUrl && useSsl ? { rejectUnauthorized: false } : undefined,
  max: 5,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 8000,
});

function iso(value: Date | string | null | undefined): string {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    fullName: String(row.full_name),
    email: String(row.email),
    passwordHash: row.password_hash ? String(row.password_hash) : null,
    googleSubject: row.google_subject ? String(row.google_subject) : null,
    isActive: Boolean(row.is_active),
    createdAt: iso(row.created_at as Date),
    updatedAt: iso(row.updated_at as Date),
  };
}

function mapConversation(row: Record<string, unknown>): Conversation {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    title: String(row.title),
    createdAt: iso(row.created_at as Date),
    updatedAt: iso(row.updated_at as Date),
    messageCount: row.message_count !== undefined ? Number(row.message_count) : undefined,
    lastMessage: row.last_message ? String(row.last_message) : undefined,
  };
}

function mapMessage(row: Record<string, unknown>): Message {
  return {
    id: String(row.id),
    conversationId: String(row.conversation_id),
    role: row.role as Message['role'],
    content: String(row.content),
    inputType: (row.input_type as Message['inputType']) || 'text',
    createdAt: iso(row.created_at as Date),
  };
}

function mapSettings(row: Record<string, unknown>): UserSettings {
  const gender = row.voice_gender === 'male' ? 'male' : 'female';
  const theme = row.theme === 'light' || row.theme === 'system' ? row.theme : 'dark';
  return {
    userId: String(row.user_id),
    defaultVoice: String(row.default_voice || 'Kore'),
    voiceGender: gender,
    voiceStyle: String(row.voice_style || 'Cute, cheerful, warm, and sweet friendly tone'),
    voicePitch: Number(row.voice_pitch ?? 1.15),
    language: String(row.language || 'en-US'),
    playbackSpeed: Number(row.playback_speed ?? 1),
    autoPlaySpeech: Boolean(row.auto_play_speech),
    micNoiseSuppression: Boolean(row.mic_noise_suppression),
    theme,
    audioRetentionDays: Number(row.audio_retention_days ?? 0),
  };
}

const DEFAULT_SETTINGS = {
  defaultVoice: 'Kore',
  voiceGender: 'female' as const,
  voiceStyle: 'Cute, cheerful, warm, and sweet friendly tone',
  voicePitch: 1.15,
  language: 'en-US',
  playbackSpeed: 1,
  autoPlaySpeech: true,
  micNoiseSuppression: true,
  theme: 'dark' as const,
  audioRetentionDays: 0,
};

export async function initDatabase(): Promise<void> {
  await pool.query('SELECT 1');
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

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query('SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1', [email.trim()]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function findUserById(id: string): Promise<User | null> {
  const result = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function findUserByGoogleSubject(sub: string): Promise<User | null> {
  const result = await pool.query('SELECT * FROM users WHERE google_subject = $1 LIMIT 1', [sub]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function createUser(user: User): Promise<User> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO users (id, full_name, email, password_hash, google_subject, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [user.id, user.fullName, user.email.toLowerCase(), user.passwordHash, user.googleSubject, user.isActive, user.createdAt, user.updatedAt]
    );
    await client.query(
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
        DEFAULT_SETTINGS.audioRetentionDays,
      ]
    );
    await client.query('COMMIT');
    return user;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const current = await findUserById(id);
  if (!current) return null;
  const next = { ...current, ...updates, updatedAt: new Date().toISOString() };
  await pool.query(
    `UPDATE users
     SET full_name = $2, email = $3, password_hash = $4, google_subject = $5, is_active = $6, updated_at = $7
     WHERE id = $1`,
    [id, next.fullName, next.email, next.passwordHash, next.googleSubject, next.isActive, next.updatedAt]
  );
  return next;
}

export async function createSession(session: RefreshSession): Promise<void> {
  await pool.query(
    `INSERT INTO refresh_sessions (id, user_id, token_hash, expires_at, revoked_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [session.id, session.userId, session.tokenHash, session.expiresAt, session.revokedAt, session.createdAt]
  );
}

export async function findSession(tokenHash: string): Promise<RefreshSession | null> {
  const result = await pool.query(
    'SELECT * FROM refresh_sessions WHERE token_hash = $1 AND revoked_at IS NULL LIMIT 1',
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
    createdAt: iso(row.created_at),
  };
}

export async function revokeSession(tokenHash: string): Promise<void> {
  await pool.query(
    'UPDATE refresh_sessions SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL',
    [tokenHash]
  );
}

export async function getSettings(userId: string): Promise<UserSettings> {
  const result = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [userId]);
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
        DEFAULT_SETTINGS.audioRetentionDays,
      ]
    );
    return { userId, ...DEFAULT_SETTINGS };
  }
  return mapSettings(result.rows[0]);
}

const SETTINGS_COLUMNS: Record<string, string> = {
  defaultVoice: 'default_voice',
  voiceGender: 'voice_gender',
  voiceStyle: 'voice_style',
  voicePitch: 'voice_pitch',
  language: 'language',
  playbackSpeed: 'playback_speed',
  autoPlaySpeech: 'auto_play_speech',
  micNoiseSuppression: 'mic_noise_suppression',
  theme: 'theme',
  audioRetentionDays: 'audio_retention_days',
};

export async function updateSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
  await getSettings(userId);
  const entries = Object.entries(updates).filter(([key]) => key in SETTINGS_COLUMNS && key !== 'userId');
  if (entries.length) {
    const sets = entries.map(([key], index) => `${SETTINGS_COLUMNS[key]} = $${index + 2}`);
    const values = entries.map(([, value]) => value);
    await pool.query(`UPDATE user_settings SET ${sets.join(', ')} WHERE user_id = $1`, [userId, ...values]);
  }
  return getSettings(userId);
}

export async function getConversations(userId: string): Promise<Conversation[]> {
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

export async function getConversationById(id: string, userId: string): Promise<Conversation | null> {
  const result = await pool.query(
    'SELECT * FROM conversations WHERE id = $1 AND user_id = $2 LIMIT 1',
    [id, userId]
  );
  return result.rows[0] ? mapConversation(result.rows[0]) : null;
}

export async function createConversation(userId: string, title = 'New Voice Session'): Promise<Conversation> {
  const conv: Conversation = {
    id: 'conv_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36),
    userId,
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await pool.query(
    'INSERT INTO conversations (id, user_id, title, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
    [conv.id, conv.userId, conv.title, conv.createdAt, conv.updatedAt]
  );
  return { ...conv, messageCount: 0 };
}

export async function updateConversation(
  id: string,
  userId: string,
  updates: { title?: string }
): Promise<Conversation | null> {
  const current = await getConversationById(id, userId);
  if (!current) return null;
  const title = updates.title?.trim() || current.title;
  const updatedAt = new Date().toISOString();
  await pool.query('UPDATE conversations SET title = $3, updated_at = $4 WHERE id = $1 AND user_id = $2', [
    id,
    userId,
    title,
    updatedAt,
  ]);
  return { ...current, title, updatedAt };
}

export async function deleteConversation(id: string, userId: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM conversations WHERE id = $1 AND user_id = $2', [id, userId]);
  return (result.rowCount ?? 0) > 0;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const result = await pool.query(
    'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
    [conversationId]
  );
  return result.rows.map(mapMessage);
}

export async function addMessage(msg: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
  const created: Message = {
    ...msg,
    id: 'msg_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36),
    createdAt: new Date().toISOString(),
  };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO messages (id, conversation_id, role, content, input_type, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [created.id, created.conversationId, created.role, created.content, created.inputType, created.createdAt]
    );
    const conv = await client.query('SELECT title FROM conversations WHERE id = $1', [created.conversationId]);
    let title = conv.rows[0]?.title as string | undefined;
    if (title === 'New Voice Session' && created.role === 'user') {
      const trimmed = created.content.trim().slice(0, 36);
      title = trimmed.length >= 35 ? `${trimmed}...` : trimmed || 'Voice Conversation';
    }
    await client.query('UPDATE conversations SET updated_at = $2, title = $3 WHERE id = $1', [
      created.conversationId,
      created.createdAt,
      title || 'Voice Conversation',
    ]);
    await client.query('COMMIT');
    return created;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
