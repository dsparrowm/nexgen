import { getApiBase } from '@/lib/axiosInstance'
import { getToken, isTokenExpired } from '@/utils/auth'

const API_BASE_URL = getApiBase(true)

export type SupportChatRole = 'visitor' | 'user' | 'agent' | 'system'

export interface SupportChatMessage {
    id: string
    role: SupportChatRole
    content: string
    createdAt: string
    status?: 'sending' | 'sent' | 'failed'
}

export interface SupportChatIdentity {
    name?: string
    email?: string
    phone?: string
}

export interface SupportConversation {
    id?: string
    conversationId?: string
    subject?: string | null
    status?: string | null
    assignedAgent?: string | null
    visitorToken?: string | null
    unreadCount?: number | null
}

export interface SupportConversationListItem extends SupportConversation {
    lastMessageAt?: string | null
    updatedAt?: string | null
}

export interface SupportChatResponse<T> {
    success: boolean
    data?: T
    error?: {
        message: string
        code: string
    }
    message?: string
}

export interface SupportGuestConversationResponse {
    conversation?: SupportConversation
    visitorToken?: string
    messages?: SupportChatMessage[]
}

export interface SupportUserConversationResponse {
    conversation?: SupportConversation
    messages?: SupportChatMessage[]
}

export interface SupportConversationListResponse {
    conversations?: SupportConversationListItem[]
}

type RawSupportMessage = {
    id?: string
    content?: string
    message?: string
    senderType?: string
    createdAt?: string
}

function normalizeMessageRole(senderType?: string): SupportChatRole {
    switch (senderType) {
        case 'ADMIN':
            return 'agent'
        case 'SYSTEM':
            return 'system'
        case 'CUSTOMER':
            return 'user'
        case 'VISITOR':
        default:
            return 'visitor'
    }
}

function normalizeSupportMessage(message: RawSupportMessage): SupportChatMessage {
    return {
        id: message.id || `message-${Date.now()}`,
        role: normalizeMessageRole(message.senderType),
        content: message.content || message.message || '',
        createdAt: message.createdAt || new Date().toISOString(),
    }
}

function normalizeSupportMessages(messages: unknown): SupportChatMessage[] | undefined {
    if (!Array.isArray(messages)) {
        return undefined
    }

    return messages.map((message) => normalizeSupportMessage((message || {}) as RawSupportMessage))
}

function normalizeConversation(payload: any): SupportConversation | undefined {
    if (!payload || typeof payload !== 'object') {
        return undefined
    }

    return {
        id: payload.id || payload.conversationId,
        conversationId: payload.conversationId || payload.id,
        subject: payload.subject ?? null,
        status: payload.status ?? null,
        assignedAgent: payload.assignedAdminName || payload.assignedAgent || payload.assignedAdmin?.displayName || null,
        visitorToken: payload.visitorToken ?? null,
        unreadCount: payload.unreadCount ?? null,
    }
}

function normalizeConversationList(payload: any): SupportConversationListItem[] | undefined {
    if (!Array.isArray(payload)) {
        return undefined
    }

    return payload.map((conversation) => ({
        ...normalizeConversation(conversation),
        lastMessageAt: conversation?.lastMessageAt ?? null,
        updatedAt: conversation?.updatedAt ?? null,
    }))
}

function normalizeResponseData<T>(endpoint: string, data: any): T {
    if (!data || typeof data !== 'object') {
        return data as T
    }

    if (endpoint.includes('/support/conversations') && 'messages' in data) {
        return {
            ...data,
            conversation: normalizeConversation(data.conversation),
            messages: normalizeSupportMessages(data.messages),
        } as T
    }

    if (endpoint.endsWith('user/support/conversations') || endpoint.includes('user/support/conversations?')) {
        return {
            ...data,
            conversations: normalizeConversationList(data.conversations) || [],
        } as T
    }

    return data as T
}

function getAuthToken(): string | null {
    if (typeof window === 'undefined') {
        return null
    }

    const token = getToken()
    if (!token || isTokenExpired()) {
        return null
    }

    return token
}

function getSupportHeaders(): HeadersInit {
    const token = getAuthToken()

    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

async function readJsonResponse(response: Response): Promise<unknown> {
    const raw = await response.text()

    if (!raw) {
        return null
    }

    try {
        return JSON.parse(raw)
    } catch {
        return raw
    }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<SupportChatResponse<T>> {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                ...getSupportHeaders(),
                ...(options.headers || {}),
            },
        })

        const parsed = await readJsonResponse(response)

        if (!response.ok) {
            const parsedError = parsed && typeof parsed === 'object' && 'error' in parsed
                ? (parsed as SupportChatResponse<T>).error
                : undefined

            return {
                success: false,
                error: parsedError || {
                    message: 'Unable to reach support chat service.',
                    code: `HTTP_${response.status}`,
                },
            }
        }

        if (parsed && typeof parsed === 'object' && 'success' in parsed) {
            const parsedResponse = parsed as SupportChatResponse<T>
            return {
                ...parsedResponse,
                data: normalizeResponseData<T>(endpoint, parsedResponse.data),
            }
        }

        return {
            success: true,
            data: normalizeResponseData<T>(endpoint, parsed),
        }
    } catch (error) {
        return {
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Network error while contacting support chat.',
                code: 'NETWORK_ERROR',
            },
        }
    }
}

export function getCurrentSupportSessionType() {
    return getAuthToken() ? 'user' : 'guest'
}

export function conversationIdFrom(payload: SupportConversation | null | undefined) {
    return payload?.conversationId || payload?.id || null
}

export function createGuestConversation(payload: {
    name?: string
    email?: string
    phone?: string
    subject?: string
    message: string
}) {
    return apiRequest<SupportGuestConversationResponse>('public/support/conversations', {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export function getGuestConversation(conversationId: string, visitorToken: string) {
    const query = new URLSearchParams({ visitorToken })

    return apiRequest<SupportGuestConversationResponse>(
        `public/support/conversations/${conversationId}?${query.toString()}`,
        { method: 'GET' }
    )
}

export function sendGuestMessage(
    conversationId: string,
    payload: {
        visitorToken: string
        message: string
    }
) {
    return apiRequest<SupportGuestConversationResponse>(`public/support/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export function listUserConversations() {
    return apiRequest<SupportConversationListResponse>('user/support/conversations', {
        method: 'GET',
    })
}

export function createUserConversation(payload: {
    subject?: string
    message: string
}) {
    return apiRequest<SupportUserConversationResponse>('user/support/conversations', {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}

export function getUserConversation(conversationId: string) {
    return apiRequest<SupportUserConversationResponse>(`user/support/conversations/${conversationId}`, {
        method: 'GET',
    })
}

export function sendUserMessage(
    conversationId: string,
    payload: {
        message: string
    }
) {
    return apiRequest<SupportUserConversationResponse>(`user/support/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify(payload),
    })
}
