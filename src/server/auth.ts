import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { storage, User } from './storage';

const JWT_SECRET = process.env.JWT_SECRET || 'voxai_jwt_production_secret_key_9921_alpha';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export type AuthRequest = Request & {
  user?: User;
};

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateAccessToken(user: User): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

export function generateRefreshToken(userId: string): { token: string; expiresAt: Date } {
  const token = crypto.randomBytes(40).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  storage.createSession({
    id: 'sess_' + crypto.randomBytes(12).toString('hex'),
    userId,
    tokenHash,
    expiresAt: expiresAt.toISOString(),
    revokedAt: null,
    createdAt: new Date().toISOString(),
  });

  return { token, expiresAt };
}

export function verifyRefreshToken(token: string): string | null {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const session = storage.findSession(tokenHash);
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    storage.revokeSession(tokenHash);
    return null;
  }
  return session.userId;
}

export function revokeRefreshToken(token: string): void {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  storage.revokeSession(tokenHash);
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ detail: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.substring(7).trim();
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; email: string };
    const user = storage.findUserById(payload.sub);
    if (!user || !user.isActive) {
      res.status(401).json({ detail: 'User session invalid or inactive.' });
      return;
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ detail: 'Token expired or invalid signature.' });
  }
}
