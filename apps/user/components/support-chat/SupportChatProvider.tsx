"use client"

import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Send, Sparkles, Users, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import {
    conversationIdFrom,
    createGuestConversation,
    createUserConversation,
    getCurrentSupportSessionType,
    getGuestConversation,
    getUserConversation,
    listUserConversations,
    sendGuestMessage,
    sendUserMessage,
    type SupportChatIdentity,
    type SupportChatMessage,
    type SupportConversationListItem,
} from '@/utils/api/supportChatApi'
import { getToken, isTokenExpired } from '@/utils/auth'
import {
    createSupportSocket,
    type SupportSocket as SupportSocketClient,
} from '@/utils/api/supportSocket'

type SupportChatSessionType = 'guest' | 'user'

type SupportChatContextValue = {
    isOpen: boolean
    openChat: () => void
    closeChat: () => void
    toggleChat: () => void
}

const SupportChatContext = createContext<SupportChatContextValue | undefined>(undefined)

const STORAGE_KEYS = {
    guestIdentity: 'nexgen_support_chat_guest_identity',
    guestConversationId: 'nexgen_support_chat_guest_conversation_id',
    guestVisitorToken: 'nexgen_support_chat_guest_visitor_token',
    guestSubject: 'nexgen_support_chat_guest_subject',
    userConversationId: 'nexgen_support_chat_user_conversation_id',
}

const WELCOME_MESSAGE: SupportChatMessage = {
    id: 'welcome-message',
    role: 'agent',
    content: 'Hi, thanks for reaching out. Leave a message here and our support team will respond as soon as possible.',
    createdAt: '2026-04-01T00:00:00.000Z',
}

function isBrowser() {
    return typeof window !== 'undefined'
}

function getStoredJson<T>(key: string): T | null {
    if (!isBrowser()) {
        return null
    }

    try {
        const raw = window.localStorage.getItem(key)
        return raw ? JSON.parse(raw) as T : null
    } catch {
        return null
    }
}

function getStoredString(key: string): string | null {
    if (!isBrowser()) {
        return null
    }

    const raw = window.localStorage.getItem(key)
    if (raw === null) {
        return null
    }

    try {
        const parsed = JSON.parse(raw)
        return typeof parsed === 'string' ? parsed : raw
    } catch {
        return raw
    }
}

function setStoredJson(key: string, value: unknown) {
    if (!isBrowser()) {
        return
    }

    window.localStorage.setItem(key, JSON.stringify(value))
}

function setStoredString(key: string, value: string | null) {
    if (!isBrowser()) {
        return
    }

    if (value === null) {
        window.localStorage.removeItem(key)
        return
    }

    window.localStorage.setItem(key, value)
}

function removeStoredValue(key: string) {
    if (!isBrowser()) {
        return
    }

    window.localStorage.removeItem(key)
}

function getStoredAuthToken() {
    if (!isBrowser()) {
        return null
    }

    const token = getToken()
    if (!token || isTokenExpired()) {
        return null
    }

    return token
}

function getLatestConversationId(conversations: SupportConversationListItem[]) {
    if (conversations.length === 0) {
        return null
    }

    const sorted = [...conversations].sort((a, b) => {
        const left = new Date(b.updatedAt || b.lastMessageAt || 0).getTime()
        const right = new Date(a.updatedAt || a.lastMessageAt || 0).getTime()
        return left - right
    })

    return conversationIdFrom(sorted[0])
}

function normalizeMessages(messages: SupportChatMessage[] | undefined, fallback: SupportChatMessage[]) {
    if (messages && messages.length > 0) {
        return messages
    }

    return fallback
}

function isLikelySocketMessage(value: unknown): value is SupportChatMessage {
    return Boolean(value && typeof value === 'object' && 'content' in value)
}

function normalizeSocketMessage(message: unknown): SupportChatMessage | null {
    if (!isLikelySocketMessage(message)) {
        return null
    }

    const rawMessage = message as Partial<SupportChatMessage> & {
        senderType?: string
        message?: string
    }

    const role = rawMessage.role
        || (rawMessage.senderType === 'ADMIN' ? 'agent'
            : rawMessage.senderType === 'SYSTEM' ? 'system'
                : rawMessage.senderType === 'CUSTOMER' ? 'user'
                    : 'visitor')

    return {
        id: rawMessage.id || `socket-message-${Date.now()}`,
        role,
        content: rawMessage.content || rawMessage.message || '',
        createdAt: rawMessage.createdAt || new Date().toISOString(),
        status: rawMessage.status,
    }
}

function normalizeSocketMessages(value: unknown): SupportChatMessage[] | null {
    if (!Array.isArray(value)) {
        return null
    }

    const normalized = value
        .map((item) => normalizeSocketMessage(item))
        .filter((item): item is SupportChatMessage => Boolean(item))

    return normalized.length > 0 ? normalized : null
}

function mergeSupportMessages(current: SupportChatMessage[], incoming: SupportChatMessage[]) {
    const byId = new Map<string, SupportChatMessage>()

    for (const message of current) {
        byId.set(message.id, message)
    }

    for (const message of incoming) {
        const currentMatch = current.find((item) => (
            item.id.startsWith('temp-')
            && item.role === message.role
            && item.content === message.content
        ))

        if (currentMatch && currentMatch.id !== message.id) {
            byId.delete(currentMatch.id)
        }

        byId.set(message.id, {
            ...byId.get(message.id),
            ...message,
        })
    }

    return Array.from(byId.values()).sort((left, right) => (
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    ))
}

function normalizeSocketConversationId(payload: unknown) {
    if (!payload || typeof payload !== 'object') {
        return null
    }

    const record = payload as {
        conversationId?: string
        id?: string
        conversation?: SupportConversationListItem
    }

    return record.conversationId
        || record.id
        || record.conversation?.conversationId
        || record.conversation?.id
        || null
}

export function useSupportChat() {
    const context = useContext(SupportChatContext)

    if (!context) {
        throw new Error('useSupportChat must be used within a SupportChatProvider')
    }

    return context
}

export function SupportChatProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    const value = useMemo<SupportChatContextValue>(() => ({
        isOpen,
        openChat: () => setIsOpen(true),
        closeChat: () => setIsOpen(false),
        toggleChat: () => setIsOpen((current) => !current),
    }), [isOpen])

    const showLauncher = pathname === '/'

    return (
        <SupportChatContext.Provider value={value}>
            {children}
            {showLauncher && !isOpen && (
                <button
                    type="button"
                    onClick={value.openChat}
                    className="fixed bottom-5 right-5 z-[60] flex items-center gap-3 rounded-full border border-gold-400/40 bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-3 text-sm font-semibold text-navy-900 shadow-2xl shadow-gold-500/20 transition-transform hover:scale-105 sm:bottom-6 sm:right-6"
                    aria-label="Open live chat"
                >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-900/10">
                        <MessageCircle className="h-5 w-5" />
                    </span>
                    <span className="hidden sm:inline">Live chat</span>
                </button>
            )}
            <SupportChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </SupportChatContext.Provider>
    )
}

function SupportChatPanel({
    isOpen,
    onClose,
}: {
    isOpen: boolean
    onClose: () => void
}) {
    const [sessionType, setSessionType] = useState<SupportChatSessionType>('guest')
    const [identity, setIdentity] = useState<SupportChatIdentity>({})
    const [subject, setSubject] = useState('')
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [visitorToken, setVisitorToken] = useState<string | null>(null)
    const [messages, setMessages] = useState<SupportChatMessage[]>([WELCOME_MESSAGE])
    const [draft, setDraft] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [isHydrating, setIsHydrating] = useState(false)
    const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'offline'>('idle')
    const socketRef = useRef<SupportSocketClient | null>(null)
    const chatStateRef = useRef({
        sessionType,
        identity,
        subject,
        conversationId,
        visitorToken,
    })

    useEffect(() => {
        chatStateRef.current = {
            sessionType,
            identity,
            subject,
            conversationId,
            visitorToken,
        }
    }, [conversationId, identity, sessionType, subject, visitorToken])

    function buildJoinPayload() {
        const current = chatStateRef.current

        return {
            conversationId: current.conversationId,
            visitorToken: current.sessionType === 'guest' ? current.visitorToken : undefined,
        }
    }

    function emitJoin(socket: SupportSocketClient) {
        const payload = buildJoinPayload()

        if (!payload.conversationId) {
            return
        }

        socket.emit('support:join', payload, (response?: {
            success?: boolean
            data?: {
                conversation?: {
                    id?: string
                    conversationId?: string
                    visitorToken?: string | null
                    messages?: unknown
                }
                messages?: unknown
            }
        }) => {
            if (!response?.success) {
                setConnectionState('offline')
                return
            }

            const nextConversationId = normalizeSocketConversationId(response.data?.conversation)
            const nextMessages = normalizeSocketMessages(
                response.data?.messages || response.data?.conversation?.messages
            )
            const nextVisitorToken = response.data?.conversation?.visitorToken || null

            if (nextConversationId) {
                setConversationId(nextConversationId)
            }

            if (nextVisitorToken) {
                setVisitorToken(nextVisitorToken)
            }

            if (nextMessages) {
                setMessages((current) => mergeSupportMessages(current, nextMessages))
            }

            setConnectionState('connected')
        })
    }

    useEffect(() => {
        const detectedSessionType = getCurrentSupportSessionType()
        setSessionType(detectedSessionType)

        if (detectedSessionType === 'user') {
            const storedUserConversationId = isBrowser() ? window.localStorage.getItem(STORAGE_KEYS.userConversationId) : null
            if (storedUserConversationId) {
                setConversationId(storedUserConversationId)
            }
            return
        }

        const storedIdentity = getStoredJson<SupportChatIdentity>(STORAGE_KEYS.guestIdentity)
        const storedConversationId = getStoredString(STORAGE_KEYS.guestConversationId)
        const storedVisitorToken = getStoredString(STORAGE_KEYS.guestVisitorToken)
        const storedSubject = getStoredString(STORAGE_KEYS.guestSubject)

        if (storedIdentity) {
            setIdentity(storedIdentity)
        }

        if (storedConversationId) {
            setConversationId(storedConversationId)
        }

        if (storedVisitorToken) {
            setVisitorToken(storedVisitorToken)
        }

        if (storedSubject) {
            setSubject(storedSubject)
        }
    }, [])

    useEffect(() => {
        if (sessionType !== 'guest') {
            return
        }

        setStoredJson(STORAGE_KEYS.guestIdentity, identity)
        setStoredString(STORAGE_KEYS.guestSubject, subject || null)

        if (conversationId) {
            setStoredString(STORAGE_KEYS.guestConversationId, conversationId)
        } else {
            removeStoredValue(STORAGE_KEYS.guestConversationId)
        }

        if (visitorToken) {
            setStoredString(STORAGE_KEYS.guestVisitorToken, visitorToken)
        } else {
            removeStoredValue(STORAGE_KEYS.guestVisitorToken)
        }
    }, [conversationId, identity, sessionType, subject, visitorToken])

    useEffect(() => {
        if (sessionType !== 'user') {
            return
        }

        if (conversationId) {
            setStoredString(STORAGE_KEYS.userConversationId, conversationId)
        }
    }, [conversationId, sessionType])

    useEffect(() => {
        const socket = socketRef.current

        if (!isOpen) {
            socket?.disconnect()
            socketRef.current = null
            setConnectionState('idle')
            return
        }

        let active = true

        const attachSocket = async () => {
            setConnectionState((current) => (current === 'connected' ? current : 'connecting'))

            if (!active) {
                return
            }

            if (socketRef.current) {
                return
            }

            let socket: SupportSocketClient | null = null

            try {
                const authToken = sessionType === 'user' ? getStoredAuthToken() : null
                socket = await createSupportSocket(authToken ? { token: authToken, type: 'user' } : undefined)
            } catch {
                if (active) {
                    setConnectionState('offline')
                }
                return
            }

            if (!active || !socket) {
                socket?.disconnect()
                return
            }

            socketRef.current = socket

            const handleSnapshot = (payload: unknown) => {
                const nextConversationId = normalizeSocketConversationId(payload)
                const nextMessages = normalizeSocketMessages(
                    (payload as { messages?: unknown }).messages
                        || (payload as { conversation?: { messages?: unknown } }).conversation?.messages
                )
                const nextVisitorToken = (payload as { visitorToken?: string }).visitorToken
                    || (payload as { conversation?: { visitorToken?: string } }).conversation?.visitorToken

                if (nextConversationId) {
                    setConversationId(nextConversationId)
                }

                if (nextVisitorToken) {
                    setVisitorToken(nextVisitorToken)
                }

                if (nextMessages) {
                    setMessages((current) => mergeSupportMessages(current, nextMessages))
                }
            }

            const handleConnected = () => {
                setConnectionState('connected')
                emitJoin(socket)
            }

            const handleDisconnected = () => {
                setConnectionState('offline')
            }

            const handleConnectError = () => {
                setConnectionState('offline')
            }

            socket.on('connect', handleConnected)
            socket.on('disconnect', handleDisconnected)
            socket.on('connect_error', handleConnectError)
            socket.on('support:conversation-snapshot', handleSnapshot)
            socket.connect()
        }

        void attachSocket()

        return () => {
            active = false
        }
    }, [isOpen, sessionType])

    useEffect(() => {
        const socket = socketRef.current
        if (!socket || !socket.connected || !conversationId) {
            return
        }

        emitJoin(socket)
    }, [conversationId, identity, sessionType, subject, visitorToken])

    useEffect(() => {
        return () => {
            const socket = socketRef.current
            socket?.disconnect()
            socketRef.current = null
        }
    }, [])

    useEffect(() => {
        if (!isOpen) {
            return
        }

        let active = true

        const hydrateGuestConversation = async () => {
            if (!conversationId || !visitorToken) {
                setMessages((current) => normalizeMessages(current, [WELCOME_MESSAGE]))
                setConnectionState('idle')
                return
            }

            setIsHydrating(true)
            setConnectionState('connecting')

            const response = await getGuestConversation(conversationId, visitorToken)
            if (!active) {
                return
            }

            if (response.success) {
                setConversationId(response.data?.conversation?.conversationId || response.data?.conversation?.id || conversationId)
                setVisitorToken(response.data?.visitorToken || visitorToken)
                setMessages(normalizeMessages(response.data?.messages, [WELCOME_MESSAGE]))
                setConnectionState('connected')
            } else {
                setConnectionState('offline')
            }

            setIsHydrating(false)
        }

        const hydrateUserConversation = async () => {
            setIsHydrating(true)
            setConnectionState('connecting')

            let activeConversationId = conversationId

            if (!activeConversationId) {
                const listResponse = await listUserConversations()
                if (!active) {
                    return
                }

                const conversations = Array.isArray(listResponse.data)
                    ? listResponse.data
                    : listResponse.data?.conversations || []
                activeConversationId = getLatestConversationId(conversations)
                if (activeConversationId) {
                    setConversationId(activeConversationId)
                }
            }

            if (!activeConversationId) {
                setMessages((current) => normalizeMessages(current, [WELCOME_MESSAGE]))
                setConnectionState('idle')
                setIsHydrating(false)
                return
            }

            const response = await getUserConversation(activeConversationId)
            if (!active) {
                return
            }

            if (response.success) {
                setConversationId(response.data?.conversation?.conversationId || response.data?.conversation?.id || activeConversationId)
                setMessages(normalizeMessages(response.data?.messages, [WELCOME_MESSAGE]))
                setConnectionState('connected')
            } else {
                setConnectionState('offline')
            }

            setIsHydrating(false)
        }

        void (sessionType === 'guest' ? hydrateGuestConversation() : hydrateUserConversation())

        return () => {
            active = false
        }
    }, [conversationId, isOpen, sessionType, visitorToken])

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const trimmedDraft = draft.trim()
        if (!trimmedDraft || isSending) {
            return
        }

        const outgoingMessage: SupportChatMessage = {
            id: `temp-${Date.now()}`,
            role: sessionType === 'user' ? 'user' : 'visitor',
            content: trimmedDraft,
            createdAt: new Date().toISOString(),
            status: 'sending',
        }

        setIsSending(true)
        setMessages((current) => [...current, outgoingMessage])
        setDraft('')

        if (sessionType === 'guest') {
            let activeConversationId = conversationId
            let activeVisitorToken = visitorToken

            if (!activeConversationId || !activeVisitorToken) {
                const response = await createGuestConversation({
                    ...identity,
                    subject: subject || undefined,
                    message: trimmedDraft,
                })

                if (response.success) {
                    activeConversationId = response.data?.conversation?.conversationId || response.data?.conversation?.id || activeConversationId
                    activeVisitorToken = response.data?.visitorToken || activeVisitorToken
                    if (activeConversationId) {
                        setConversationId(activeConversationId)
                    }
                    if (activeVisitorToken) {
                        setVisitorToken(activeVisitorToken)
                    }
                    const deliveredOutgoingMessage: SupportChatMessage = {
                        ...outgoingMessage,
                        status: 'sent',
                    }
                    const createdMessages = response.data?.messages?.length
                        ? response.data.messages
                        : [WELCOME_MESSAGE, deliveredOutgoingMessage]
                    setMessages(createdMessages)
                    setConnectionState('connected')
                    setIsSending(false)
                    return
                } else {
                    setMessages((current) =>
                        current.map((message) =>
                            message.id === outgoingMessage.id
                                ? {
                                    ...message,
                                    status: 'failed',
                                }
                                : message
                        )
                    )
                    setConnectionState('offline')
                    setIsSending(false)
                    return
                }
            }

            if (activeConversationId && activeVisitorToken) {
                const sendResponse = await sendGuestMessage(activeConversationId, {
                    visitorToken: activeVisitorToken,
                    message: trimmedDraft,
                })

                if (sendResponse.success) {
                    setMessages((current) =>
                        current.map((message) =>
                            message.id === outgoingMessage.id
                                ? {
                                    ...message,
                                    status: 'sent',
                                }
                                : message
                        )
                    )
                    setConnectionState('connected')
                } else {
                    setMessages((current) =>
                        current.map((message) =>
                            message.id === outgoingMessage.id
                                ? {
                                    ...message,
                                    status: 'failed',
                                }
                                : message
                        )
                    )
                    setConnectionState('offline')
                }
            }
        } else {
            let activeConversationId = conversationId

            if (!activeConversationId) {
                const response = await createUserConversation({
                    subject: subject || undefined,
                    message: trimmedDraft,
                })

                if (response.success) {
                    activeConversationId = response.data?.conversation?.conversationId || response.data?.conversation?.id || activeConversationId
                    if (activeConversationId) {
                        setConversationId(activeConversationId)
                    }
                    const deliveredOutgoingMessage: SupportChatMessage = {
                        ...outgoingMessage,
                        status: 'sent',
                    }
                    const createdMessages = response.data?.messages?.length
                        ? response.data.messages
                        : [WELCOME_MESSAGE, deliveredOutgoingMessage]
                    setMessages(createdMessages)
                    setConnectionState('connected')
                    setIsSending(false)
                    return
                } else {
                    setMessages((current) =>
                        current.map((message) =>
                            message.id === outgoingMessage.id
                                ? {
                                    ...message,
                                    status: 'failed',
                                }
                                : message
                        )
                    )
                    setConnectionState('offline')
                    setIsSending(false)
                    return
                }
            }

            if (activeConversationId) {
                const sendResponse = await sendUserMessage(activeConversationId, {
                    message: trimmedDraft,
                })

                if (sendResponse.success) {
                    setMessages((current) =>
                        current.map((message) =>
                            message.id === outgoingMessage.id
                                ? {
                                    ...message,
                                    status: 'sent',
                                }
                                : message
                        )
                    )
                    setConnectionState('connected')
                } else {
                    setMessages((current) =>
                        current.map((message) =>
                            message.id === outgoingMessage.id
                                ? {
                                    ...message,
                                    status: 'failed',
                                }
                                : message
                        )
                    )
                    setConnectionState('offline')
                }
            }
        }

        setIsSending(false)
    }

    const helperText = sessionType === 'guest'
        ? 'Share your contact details so we can reply outside the browser if needed.'
        : 'You are signed in, so we will keep this thread attached to your account.'

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 24, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 24, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="fixed bottom-4 right-4 left-4 z-[70] mx-auto w-auto max-w-md overflow-hidden rounded-3xl border border-gold-500/20 bg-[#08111f]/95 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:left-auto sm:right-6 sm:bottom-6 sm:w-[390px]"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Support chat"
                >
                    <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-navy-950 via-navy-900 to-dark-900 px-5 py-4">
                        <div
                            className="absolute inset-0 opacity-30"
                            style={{
                                backgroundImage: 'radial-gradient(circle at top right, rgba(255,215,0,0.25), transparent 45%)',
                            }}
                        />
                        <div className="relative flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 text-navy-900 shadow-lg shadow-gold-500/20">
                                    <Sparkles className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">NexGen Support</p>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-300">
                                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
                                            <Users className="h-3.5 w-3.5" />
                                            {sessionType === 'user' ? 'Account chat' : 'Guest chat'}
                                        </span>
                                        <span>
                                            {connectionState === 'connected'
                                                ? 'Connected'
                                                : connectionState === 'offline'
                                                    ? 'Offline mode'
                                                    : 'We usually reply in a few minutes'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-full p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                                aria-label="Close support chat"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[70vh] space-y-4 overflow-y-auto px-4 py-4 sm:max-h-[72vh]">
                        <div className="rounded-2xl border border-gold-500/10 bg-white/5 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-400">
                                Chat details
                            </p>
                            <p className="mt-2 text-xs leading-relaxed text-gray-400">
                                {helperText}
                            </p>

                            <div className="mt-3 grid grid-cols-1 gap-3">
                                {sessionType === 'guest' && (
                                    <>
                                        <label className="block">
                                            <span className="mb-1 block text-xs text-gray-400">Name</span>
                                            <input
                                                value={identity.name || ''}
                                                onChange={(event) => setIdentity({ ...identity, name: event.target.value })}
                                                placeholder="Your name"
                                                className="w-full rounded-xl border border-white/10 bg-navy-900/80 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-gold-500/60"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="mb-1 block text-xs text-gray-400">Email</span>
                                            <input
                                                type="email"
                                                value={identity.email || ''}
                                                onChange={(event) => setIdentity({ ...identity, email: event.target.value })}
                                                placeholder="you@example.com"
                                                className="w-full rounded-xl border border-white/10 bg-navy-900/80 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-gold-500/60"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="mb-1 block text-xs text-gray-400">Phone</span>
                                            <input
                                                type="tel"
                                                value={identity.phone || ''}
                                                onChange={(event) => setIdentity({ ...identity, phone: event.target.value })}
                                                placeholder="+1 555 123 4567"
                                                className="w-full rounded-xl border border-white/10 bg-navy-900/80 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-gold-500/60"
                                            />
                                        </label>
                                    </>
                                )}

                                <label className="block">
                                    <span className="mb-1 block text-xs text-gray-400">Subject</span>
                                    <input
                                        value={subject}
                                        onChange={(event) => setSubject(event.target.value)}
                                        placeholder={sessionType === 'user' ? 'What do you need help with?' : 'Optional subject'}
                                        className="w-full rounded-xl border border-white/10 bg-navy-900/80 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-gold-500/60"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.role === 'visitor' || message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                            message.role === 'visitor' || message.role === 'user'
                                                ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900'
                                                : 'border border-white/10 bg-navy-900/80 text-gray-100'
                                        }`}
                                    >
                                        <p>{message.content}</p>
                                        <p className={`mt-2 text-[11px] ${message.role === 'visitor' || message.role === 'user' ? 'text-navy-900/70' : 'text-gray-400'}`}>
                                            {message.status === 'failed'
                                                ? 'Send failed'
                                                : message.status === 'sending'
                                                    ? 'Sending...'
                                                    : new Date(message.createdAt).toLocaleTimeString([], {
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                    })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {isHydrating && (
                                <div className="flex justify-start">
                                    <div className="rounded-2xl border border-white/10 bg-navy-900/80 px-4 py-3 text-sm text-gray-300">
                                        Loading conversation...
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="border-t border-white/10 bg-black/20 px-4 py-4">
                        <label className="sr-only" htmlFor="support-chat-message">
                            Message
                        </label>
                        <div className="flex items-end gap-3">
                            <textarea
                                id="support-chat-message"
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                placeholder="Tell us how we can help..."
                                rows={2}
                                className="min-h-[56px] flex-1 resize-none rounded-2xl border border-white/10 bg-navy-900/80 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-gold-500/60"
                            />
                            <button
                                type="submit"
                                disabled={isSending || !draft.trim()}
                                className="inline-flex h-[56px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold-500 to-gold-600 px-4 text-sm font-semibold text-navy-900 transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Send className="h-4 w-4" />
                                Send
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
