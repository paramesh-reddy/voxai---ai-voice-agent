import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string | null;
  googleSubject: string | null;
  isActive: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
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
  voiceGender?: 'female' | 'male';
  voiceStyle?: string;
  voicePitch?: number;
  language: string;
  playbackSpeed: number;
  autoPlaySpeech: boolean;
  micNoiseSuppression: boolean;
  theme: 'dark' | 'system' | 'light';
  audioRetentionDays: number;
}

interface DatabaseSchema {
  users: User[];
  conversations: Conversation[];
  messages: Message[];
  sessions: RefreshSession[];
  settings: UserSettings[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'voxai_store.json');

class Storage {
  private data: DatabaseSchema = {
    users: [],
    conversations: [],
    messages: [],
    sessions: [],
    settings: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.save();
      }
    } catch (err) {
      console.warn('Initializing in-memory database due to file read failure:', err);
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database state:', err);
    }
  }

  // Users
  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByGoogleSubject(sub: string): User | undefined {
    return this.data.users.find(u => u.googleSubject === sub);
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.data.settings.push({
      userId: user.id,
      defaultVoice: 'Kore',
      voiceGender: 'female',
      voiceStyle: 'Cute, cheerful, warm, and sweet friendly tone',
      voicePitch: 1.15,
      language: 'en-US',
      playbackSpeed: 1.0,
      autoPlaySpeech: true,
      micNoiseSuppression: true,
      theme: 'dark',
      audioRetentionDays: 0, // default do not permanently retain raw audio
    });
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const user = this.findUserById(id);
    if (!user) return null;
    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return user;
  }

  // Sessions
  public createSession(session: RefreshSession): RefreshSession {
    this.data.sessions.push(session);
    this.save();
    return session;
  }

  public findSession(tokenHash: string): RefreshSession | undefined {
    return this.data.sessions.find(s => s.tokenHash === tokenHash && !s.revokedAt);
  }

  public revokeSession(tokenHash: string): void {
    const session = this.data.sessions.find(s => s.tokenHash === tokenHash);
    if (session) {
      session.revokedAt = new Date().toISOString();
      this.save();
    }
  }

  // Conversations
  public getConversations(userId: string): Array<Conversation & { messageCount: number; lastMessage?: string }> {
    const convs = this.data.conversations
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return convs.map(c => {
      const messages = this.data.messages.filter(m => m.conversationId === c.id);
      const lastMsg = messages[messages.length - 1]?.content;
      return {
        ...c,
        messageCount: messages.length,
        lastMessage: lastMsg,
      };
    });
  }

  public getConversationById(id: string, userId: string): Conversation | undefined {
    return this.data.conversations.find(c => c.id === id && c.userId === userId);
  }

  public createConversation(userId: string, title = 'New Voice Session'): Conversation {
    const conv: Conversation = {
      id: 'conv_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      userId,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.conversations.push(conv);
    this.save();
    return conv;
  }

  public updateConversation(id: string, userId: string, updates: { title?: string }): Conversation | null {
    const conv = this.getConversationById(id, userId);
    if (!conv) return null;
    if (updates.title) conv.title = updates.title;
    conv.updatedAt = new Date().toISOString();
    this.save();
    return conv;
  }

  public deleteConversation(id: string, userId: string): boolean {
    const initialCount = this.data.conversations.length;
    this.data.conversations = this.data.conversations.filter(c => !(c.id === id && c.userId === userId));
    if (this.data.conversations.length !== initialCount) {
      // cascade delete messages
      this.data.messages = this.data.messages.filter(m => m.conversationId !== id);
      this.save();
      return true;
    }
    return false;
  }

  // Messages
  public getMessages(conversationId: string): Message[] {
    return this.data.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public addMessage(msg: Omit<Message, 'id' | 'createdAt'>): Message {
    const newMsg: Message = {
      ...msg,
      id: 'msg_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      createdAt: new Date().toISOString(),
    };
    this.data.messages.push(newMsg);

    // update conversation updatedAt
    const conv = this.data.conversations.find(c => c.id === msg.conversationId);
    if (conv) {
      conv.updatedAt = newMsg.createdAt;
      // Auto-title conversation if default title and user message
      if (conv.title === 'New Voice Session' && msg.role === 'user') {
        const trimmed = msg.content.trim().slice(0, 36);
        conv.title = trimmed.length > 0 ? (trimmed.length >= 35 ? trimmed + '...' : trimmed) : 'Voice Conversation';
      }
    }

    this.save();
    return newMsg;
  }

  // Settings
  public getSettings(userId: string): UserSettings {
    let s = this.data.settings.find(setting => setting.userId === userId);
    if (!s) {
      s = {
        userId,
        defaultVoice: 'Kore',
        voiceGender: 'female',
        voiceStyle: 'Cute, cheerful, warm, and sweet friendly tone',
        voicePitch: 1.15,
        language: 'en-US',
        playbackSpeed: 1.0,
        autoPlaySpeech: true,
        micNoiseSuppression: true,
        theme: 'dark',
        audioRetentionDays: 0,
      };
      this.data.settings.push(s);
      this.save();
    } else {
      // Ensure existing users get defaults for newly added fields
      let modified = false;
      if (!s.language) { s.language = 'en-US'; modified = true; }
      if (!s.voicePitch) { s.voicePitch = 1.15; modified = true; }
      if (!s.voiceGender) { s.voiceGender = 'female'; modified = true; }
      if (!s.voiceStyle) { s.voiceStyle = 'Cute, cheerful, warm, and sweet friendly tone'; modified = true; }
      if (!s.theme) { s.theme = 'dark'; modified = true; }
      if (modified) this.save();
    }
    return s;
  }

  public updateSettings(userId: string, updates: Partial<UserSettings>): UserSettings {
    const current = this.getSettings(userId);
    Object.assign(current, updates);
    this.save();
    return current;
  }
}

export const storage = new Storage();
