import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { createSession, findSession, findUserById, revokeSession, User } from './db';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export type AuthRequest = Request & {
  user?: User;
};

function jwtSecret(): string {
  return process.env.JWT_SECRET || 'voxai_jwt_production_secret_key_9921_alpha';
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateAccessToken(user: User): string {
  return jwt.sign(
    { sub: user.id, email: user.email, fullName: user.fullName },
    jwtSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

export async function generateRefreshToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  await createSession({
    id: 'sess_' + crypto.randomBytes(12).toString('hex'),
    userId,
    tokenHash,
    expiresAt: expiresAt.toISOString(),
    revokedAt: null,
    createdAt: new Date().toISOString(),
  });
  return { token, expiresAt };
}

export async function verifyRefreshToken(token: string): Promise<string | null> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const session = await findSession(tokenHash);
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    await revokeSession(tokenHash);
    return null;
  }
  return session.userId;
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await revokeSession(tokenHash);
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ detail: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.substring(7).trim();
  try {
    const payload = jwt.verify(token, jwtSecret()) as { sub: string };
    const user = await findUserById(payload.sub);
    if (!user || !user.isActive) {
      res.status(401).json({ detail: 'User session invalid or inactive.' });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ detail: 'Token expired or invalid signature.' });
  }
}

export function publicUser(user: User) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    authProvider: user.googleSubject ? 'google' : 'local',
    createdAt: user.createdAt,
  };
}
