import bcrypt from 'bcryptjs';
import { logger } from '@/utils/logger';
import { config } from '@/config/env';

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
    try {
        const saltRounds = config.bcryptRounds;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        logger.error('Error hashing password:', error);
        throw new Error('Failed to hash password');
    }
};

/**
 * Verify a password against its hash
 */
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    try {
        const isValid = await bcrypt.compare(password, hashedPassword);
        return isValid;
    } catch (error) {
        logger.error('Error verifying password:', error);
        return false;
    }
};

/**
 * Generate a secure random password
 */
export const generateSecurePassword = (length: number = 12): string => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }

    return password;
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): {
    isValid: boolean;
    errors: string[];
    score: number; // 0-4 (weak to very strong)
} => {
    const errors: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    } else if (password.length >= 12) {
        score += 1;
    }

    // Character variety checks
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    } else {
        score += 1;
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    } else {
        score += 1;
    }

    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    } else {
        score += 1;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    } else {
        score += 1;
    }

    // Common password check (basic)
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push('Password is too common');
        score = Math.max(0, score - 2);
    }

    return {
        isValid: errors.length === 0,
        errors,
        score: Math.min(4, score)
    };
};