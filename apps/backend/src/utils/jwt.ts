import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '@/config/env';
import { logger } from '@/utils/logger';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  type: 'user' | 'admin';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate JWT token for user authentication
 */
export const generateUserToken = (payload: Omit<JWTPayload, 'type'>): string => {
  const jwtPayload: JWTPayload = {
    ...payload,
    type: 'user'
  };

  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as any,
    issuer: 'nexgen-backend',
    audience: 'user-app'
  };

  return jwt.sign(jwtPayload, config.userJwtSecret, options);
};

/**
 * Generate JWT token for admin authentication
 */
export const generateAdminToken = (payload: Omit<JWTPayload, 'type'>): string => {
  const jwtPayload: JWTPayload = {
    ...payload,
    type: 'admin'
  };

  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as any,
    issuer: 'nexgen-backend',
    audience: 'admin-app'
  };

  return jwt.sign(jwtPayload, config.adminJwtSecret, options);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: Omit<JWTPayload, 'type'>): string => {
  const jwtPayload: JWTPayload = {
    ...payload,
    type: payload.role === 'SUPER_ADMIN' || payload.role === 'ADMIN' ? 'admin' : 'user'
  };

  const options: SignOptions = {
    expiresIn: config.refreshTokenExpiresIn as any,
    issuer: 'nexgen-backend',
    audience: 'refresh-token'
  };

  return jwt.sign(jwtPayload, config.adminJwtSecret, options); // Use admin secret for refresh tokens
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = (payload: Omit<JWTPayload, 'type'>): TokenPair => {
  const isAdmin = payload.role === 'SUPER_ADMIN' || payload.role === 'ADMIN';

  const accessToken = isAdmin
    ? generateAdminToken(payload)
    : generateUserToken(payload);

  const refreshToken = generateRefreshToken(payload);

  return { accessToken, refreshToken };
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string, type: 'user' | 'admin' = 'user'): JWTPayload => {
  try {
    const secret = type === 'admin' ? config.adminJwtSecret : config.userJwtSecret;

    const decoded = jwt.verify(token, secret, {
      issuer: 'nexgen-backend',
      audience: type === 'admin' ? 'admin-app' : 'user-app'
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    logger.error('JWT verification failed:', error);
    throw new Error('Invalid or expired token');
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, config.adminJwtSecret, {
      issuer: 'nexgen-backend',
      audience: 'refresh-token'
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    logger.error('Refresh token verification failed:', error);
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
};

/**
 * Extract token from cookies
 */
export const extractTokenFromCookies = (cookies: any, type: 'user' | 'admin' = 'user'): string | null => {
  const cookieName = type === 'admin' ? 'admin_token' : 'user_token';
  return cookies?.[cookieName] || null;
};