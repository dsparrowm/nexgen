// Common API Response Types
export interface ApiResponse<T = any> {
    success: boolean
    message?: string
    data?: T
    error?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number
        limit: number
        total: number
        pages: number
    }
}

// Request Types
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string
        email: string
        role: UserRole
        [key: string]: any
    }
}

// User Types
export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    INACTIVE = 'INACTIVE',
    BANNED = 'BANNED'
}

export enum KYCStatus {
    PENDING = 'PENDING',
    IN_REVIEW = 'IN_REVIEW',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

// Mining Types
export enum MiningPlan {
    BASIC = 'BASIC',
    PRO = 'PRO',
    ELITE = 'ELITE',
    CUSTOM = 'CUSTOM'
}

export enum MiningStatus {
    ACTIVE = 'ACTIVE',
    PAUSED = 'PAUSED',
    STOPPED = 'STOPPED',
    EXPIRED = 'EXPIRED',
    MAINTENANCE = 'MAINTENANCE'
}

// Investment Types
export enum InvestmentType {
    CRYPTOCURRENCY = 'CRYPTOCURRENCY',
    GOLD = 'GOLD',
    MIXED_PORTFOLIO = 'MIXED_PORTFOLIO'
}

export enum InvestmentStatus {
    ACTIVE = 'ACTIVE',
    SOLD = 'SOLD',
    PARTIAL_SOLD = 'PARTIAL_SOLD'
}

// Transaction Types
export enum TransactionType {
    DEPOSIT = 'DEPOSIT',
    WITHDRAWAL = 'WITHDRAWAL',
    MINING_REWARD = 'MINING_REWARD',
    INVESTMENT_PURCHASE = 'INVESTMENT_PURCHASE',
    INVESTMENT_SALE = 'INVESTMENT_SALE',
    REFERRAL_COMMISSION = 'REFERRAL_COMMISSION',
    FEE = 'FEE',
    CREDIT = 'CREDIT',
    DEBIT = 'DEBIT'
}

export enum TransactionCategory {
    MINING = 'MINING',
    INVESTMENT = 'INVESTMENT',
    WALLET = 'WALLET',
    REFERRAL = 'REFERRAL',
    ADMIN = 'ADMIN'
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED'
}

// Notification Types
export enum NotificationType {
    MINING_ALERT = 'MINING_ALERT',
    PAYMENT_CONFIRMATION = 'PAYMENT_CONFIRMATION',
    MARKET_UPDATE = 'MARKET_UPDATE',
    SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION',
    KYC_UPDATE = 'KYC_UPDATE',
    SECURITY_ALERT = 'SECURITY_ALERT'
}