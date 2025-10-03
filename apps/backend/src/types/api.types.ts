export interface ApiResponse<T = any> {
    success: boolean
    message?: string
    data?: T
    error?: string
    timestamp?: string
}

export interface PaginationQuery {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNext: boolean
        hasPrev: boolean
    }
}

export interface RequestWithUser extends Request {
    user?: {
        id: string
        email: string
        role: string
        [key: string]: any
    }
}

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN'
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | 'BANNED'
export type KycStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'
export type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED'
export type TransactionType =
    | 'DEPOSIT'
    | 'WITHDRAWAL'
    | 'MINING_REWARD'
    | 'INVESTMENT_PURCHASE'
    | 'INVESTMENT_SALE'
    | 'REFERRAL_COMMISSION'
    | 'FEE'
    | 'CREDIT'
    | 'DEBIT'