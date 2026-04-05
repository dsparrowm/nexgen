'use client'

import React, { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    Filter,
    Mail,
    MessageCircle,
    Phone,
    RefreshCw,
    Search,
    Send,
    ShieldAlert,
    User,
    Users,
    XCircle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
    apiClient,
    SupportConversationDetail,
    SupportConversationStatus,
    SupportConversationSummary,
    SupportMessage,
} from '@/lib/api'
import { createSupportSocket } from '@/lib/supportSocket'

type StatusFilter = SupportConversationStatus | 'ALL'

type SupportConversationPresence = {
    conversationId: string
    adminOnline: boolean
    customerOnline: boolean
    onlineCount: number
}

type SupportConversationTyping = {
    conversationId: string
    adminTyping: boolean
    customerTyping: boolean
}

const statusMeta: Record<SupportConversationStatus, { label: string; className: string; icon: React.ReactNode }> = {
    OPEN: { label: 'Open', className: 'bg-green-500/10 text-green-300 border-green-500/20', icon: <CheckCircle2 className="w-4 h-4" /> },
    PENDING: { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20', icon: <Clock3 className="w-4 h-4" /> },
    CLOSED: { label: 'Closed', className: 'bg-slate-500/10 text-slate-300 border-slate-500/20', icon: <XCircle className="w-4 h-4" /> },
    RESOLVED: { label: 'Resolved', className: 'bg-blue-500/10 text-blue-300 border-blue-500/20', icon: <CheckCircle2 className="w-4 h-4" /> },
}

const priorityMeta = {
    HIGH: 'bg-red-500/10 text-red-300 border-red-500/20',
    NORMAL: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
    LOW: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    URGENT: 'bg-red-500/10 text-red-200 border-red-500/30',
}

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
    { value: 'ALL', label: 'All' },
    { value: 'OPEN', label: 'Open' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CLOSED', label: 'Closed' },
]

const MESSAGE_PAGE_SIZE = 20

const normalizeConversations = (data: any): SupportConversationSummary[] => {
    if (!data) return []
    if (Array.isArray(data)) return data
    return data.conversations ?? data.items ?? data.data ?? []
}

const normalizeConversation = (data: any): SupportConversationDetail | null => {
    if (!data) return null
    if (data.conversation) return data.conversation
    return data
}

const normalizeMessages = (data: any): SupportMessage[] => {
    if (!data) return []
    if (Array.isArray(data)) return data
    return data.messages ?? data.items ?? data.data ?? []
}

const mergeSupportMessages = (current: SupportMessage[], incoming: SupportMessage[]) => {
    const byId = new Map<string, SupportMessage>()

    for (const message of current) {
        byId.set(message.id, message)
    }

    for (const message of incoming) {
        byId.set(message.id, {
            ...byId.get(message.id),
            ...message,
        })
    }

    return Array.from(byId.values()).sort((left, right) => (
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    ))
}

const extractConversationId = (payload: any): string | null => {
    if (!payload) return null

    const candidates = Array.isArray(payload) ? payload : [payload]

    for (const candidate of candidates) {
        if (!candidate || typeof candidate !== 'object') continue

        const conversationId =
            candidate.conversationId
            || candidate.id
            || candidate.conversation?.conversationId
            || candidate.conversation?.id
            || candidate.data?.conversationId
            || candidate.data?.id
            || candidate.data?.conversation?.conversationId
            || candidate.data?.conversation?.id

        if (typeof conversationId === 'string' && conversationId.length > 0) {
            return conversationId
        }
    }

    return null
}

const formatRelativeTime = (value?: string) => {
    if (!value) return 'Just now'

    const date = new Date(value)
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
}

const SupportInbox: React.FC = () => {
    const { admin } = useAuth()
    const [conversations, setConversations] = useState<SupportConversationSummary[]>([])
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
    const [selectedConversation, setSelectedConversation] = useState<SupportConversationDetail | null>(null)
    const [messages, setMessages] = useState<SupportMessage[]>([])
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('OPEN')
    const [searchQuery, setSearchQuery] = useState('')
    const [replyMessage, setReplyMessage] = useState('')
    const [isLoadingList, setIsLoadingList] = useState(true)
    const [isLoadingThread, setIsLoadingThread] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [isAssigning, setIsAssigning] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [socketStatus, setSocketStatus] = useState<'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error'>('idle')
    const [error, setError] = useState<string | null>(null)
    const [selectedConversationPresence, setSelectedConversationPresence] = useState<SupportConversationPresence | null>(null)
    const [selectedConversationTyping, setSelectedConversationTyping] = useState<SupportConversationTyping | null>(null)
    const [historyPage, setHistoryPage] = useState(1)
    const [historyHasMore, setHistoryHasMore] = useState(false)
    const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false)
    const messageScrollRef = useRef<HTMLDivElement | null>(null)
    const pendingScrollAdjustmentRef = useRef<{ previousScrollHeight: number; previousScrollTop: number } | null>(null)
    const stickToBottomRef = useRef(true)
    const replyTypingTimeoutRef = useRef<number | null>(null)
    const replyTypingActiveRef = useRef(false)
    const loadConversationsRef = useRef<((background?: boolean) => Promise<void>) | null>(null)
    const loadConversationRef = useRef<((conversationId: string, background?: boolean) => Promise<void>) | null>(null)
    const selectedConversationIdRef = useRef<string | null>(null)
    const socketRef = useRef<any>(null)

    const selectedSummary = conversations.find((conversation) => conversation.id === selectedConversationId) || selectedConversation
    const openCount = conversations.filter((conversation) => conversation.status === 'OPEN').length
    const pendingCount = conversations.filter((conversation) => conversation.status === 'PENDING').length
    const closedCount = conversations.filter((conversation) => conversation.status === 'CLOSED').length

    const loadConversations = useCallback(async (background = false) => {
        if (background) {
            setIsRefreshing(true)
        } else {
            setIsLoadingList(true)
        }

        setError(null)

        try {
            const response = await apiClient.getSupportConversations({
                status: statusFilter,
                search: searchQuery.trim() || undefined,
                page: 1,
                limit: 25,
            })

            if (!response.success || !response.data) {
                throw new Error(response.error?.message || 'Failed to load support conversations')
            }

            const nextConversations = normalizeConversations(response.data)
            setConversations(nextConversations)

            setSelectedConversationId((current) => {
                if (current && nextConversations.some((conversation) => conversation.id === current)) {
                    return current
                }

                return nextConversations[0]?.id ?? null
            })

            if (!nextConversations.length) {
                setSelectedConversation(null)
                setMessages([])
            }
        } catch (loadError) {
            console.error('Error loading support conversations:', loadError)
            setError(loadError instanceof Error ? loadError.message : 'Failed to load support conversations')
        } finally {
            setIsLoadingList(false)
            setIsRefreshing(false)
        }
    }, [searchQuery, statusFilter])

    const loadConversation = useCallback(async (conversationId: string, background = false, page = 1) => {
        if (!conversationId) return

        if (!background) {
            setIsLoadingThread(true)
        }

        try {
            const detailResponse = await apiClient.getSupportConversation(conversationId, {
                page,
                limit: MESSAGE_PAGE_SIZE,
            })

            if (detailResponse.success && detailResponse.data) {
                const conversation = normalizeConversation(detailResponse.data)
                const nextMessages = normalizeMessages(detailResponse.data.messages)
                const shouldMerge = background || page > 1

                if (conversation) {
                    setMessages((current) => (
                        shouldMerge ? mergeSupportMessages(current, nextMessages) : nextMessages
                    ))
                    setSelectedConversation((current) => ({
                        ...(current || conversation),
                        ...conversation,
                        messages: shouldMerge
                            ? mergeSupportMessages(current?.messages || [], nextMessages)
                            : nextMessages,
                    }))
                    setHistoryPage(detailResponse.data.pagination?.page || page)
                    setHistoryHasMore(detailResponse.data.pagination?.hasMore || false)
                    stickToBottomRef.current = true
                    if (!background) {
                        await apiClient.markSupportConversationRead(conversationId)
                    }
                    return
                }
            }
            throw new Error(detailResponse.error?.message || 'Failed to load conversation details')
        } catch (loadError) {
            console.error('Error loading support conversation:', loadError)
            setError(loadError instanceof Error ? loadError.message : 'Failed to load support conversation')
        } finally {
            setIsLoadingThread(false)
        }
    }, [])

    useEffect(() => {
        loadConversationsRef.current = loadConversations
        loadConversationRef.current = loadConversation
        selectedConversationIdRef.current = selectedConversationId
    }, [loadConversations, loadConversation, selectedConversationId])

    useEffect(() => {
        let mounted = true
        let socket: any = null

        const syncSupportData = (event: string, payloads: any[]) => {
            const activeConversationId = selectedConversationIdRef.current
            const payloadConversationId = extractConversationId(payloads)

            if (event === 'support:typing' || event === 'support:presence') {
                return
            }

            void loadConversationsRef.current?.(true)

            if (payloadConversationId && activeConversationId && payloadConversationId === activeConversationId) {
                void loadConversationRef.current?.(payloadConversationId, true)
                return
            }

            if (!payloadConversationId && activeConversationId) {
                void loadConversationRef.current?.(activeConversationId, true)
                return
            }

        }

        const handlePresence = (payload: SupportConversationPresence) => {
            if (payload.conversationId !== selectedConversationIdRef.current) {
                return
            }

            setSelectedConversationPresence(payload)
        }

        const handleTyping = (payload: SupportConversationTyping & { conversationId: string }) => {
            if (payload.conversationId !== selectedConversationIdRef.current) {
                return
            }

            setSelectedConversationTyping(payload)
        }

        const connectSocket = async () => {
            if (!admin?.id) {
                setSocketStatus('idle')
                return
            }

            const token = apiClient.getAccessToken()
            if (!token) {
                setSocketStatus('idle')
                return
            }

            setSocketStatus('connecting')

            const nextSocket = await createSupportSocket({ token, type: 'admin' })
            if (!mounted) {
                nextSocket?.disconnect()
                return
            }

            if (!nextSocket) {
                setSocketStatus('error')
                return
            }

            socket = nextSocket
            socketRef.current = nextSocket

            socket.on('connect', () => {
                if (mounted) setSocketStatus('connected')
            })
            socket.on('disconnect', () => {
                if (mounted) setSocketStatus('idle')
            })
            socket.on('connect_error', () => {
                if (mounted) setSocketStatus('error')
            })
            socket.on('reconnect_attempt', () => {
                if (mounted) setSocketStatus('reconnecting')
            })
            socket.on('reconnect', () => {
                if (mounted) setSocketStatus('connected')
            })
            socket.on('support:presence', handlePresence)
            socket.on('support:typing', handleTyping)
            socket.onAny?.((event: string, ...payloads: any[]) => {
                if (typeof event !== 'string' || !event.startsWith('support:')) return

                syncSupportData(event, payloads)
            })
            socket.connect?.()
        }

        void connectSocket()

        return () => {
            mounted = false
            socket?.offAny?.()
            socket?.off?.('support:presence', handlePresence)
            socket?.off?.('support:typing', handleTyping)
            socket?.disconnect?.()
            if (socketRef.current === socket) {
                socketRef.current = null
            }
        }
    }, [admin?.id])

    useEffect(() => {
        loadConversations()
        // The inbox should refresh as filters change and the list remains current while agents work.
    }, [loadConversations, statusFilter, searchQuery])

    useEffect(() => {
        if (selectedConversationId) {
            setMessages([])
            setSelectedConversation(null)
            loadConversation(selectedConversationId)
        }
        setSelectedConversationPresence(null)
        setSelectedConversationTyping(null)
        setHistoryPage(1)
        setHistoryHasMore(false)
        stickToBottomRef.current = true
    }, [loadConversation, selectedConversationId])

    useEffect(() => {
        const container = messageScrollRef.current
        if (!container) {
            return
        }

        if (pendingScrollAdjustmentRef.current) {
            const { previousScrollHeight, previousScrollTop } = pendingScrollAdjustmentRef.current
            const nextScrollHeight = container.scrollHeight
            container.scrollTop = nextScrollHeight - previousScrollHeight + previousScrollTop
            pendingScrollAdjustmentRef.current = null
            return
        }

        if (stickToBottomRef.current) {
            container.scrollTop = container.scrollHeight
        }
    }, [messages, selectedConversationId])

    const loadOlderMessages = async () => {
        if (isLoadingOlderMessages || !historyHasMore || !selectedConversationId) {
            return
        }

        const nextPage = historyPage + 1
        const container = messageScrollRef.current
        if (container) {
            pendingScrollAdjustmentRef.current = {
                previousScrollHeight: container.scrollHeight,
                previousScrollTop: container.scrollTop,
            }
        }

        setIsLoadingOlderMessages(true)

        try {
            const response = await apiClient.getSupportConversation(selectedConversationId, {
                page: nextPage,
                limit: MESSAGE_PAGE_SIZE,
            })

            if (response.success && response.data?.messages) {
                const olderMessages = normalizeMessages(response.data.messages)
                if (olderMessages.length > 0) {
                    setMessages((current) => mergeSupportMessages(current, olderMessages))
                    setSelectedConversation((current) => current ? {
                        ...current,
                        messages: mergeSupportMessages(current.messages || [], olderMessages),
                    } : current)
                    setHistoryPage(response.data.pagination?.page || nextPage)
                    setHistoryHasMore(response.data.pagination?.hasMore || false)
                } else {
                    setHistoryHasMore(false)
                }
            }
        } finally {
            setIsLoadingOlderMessages(false)
        }
    }

    const handleMessageScroll = () => {
        const container = messageScrollRef.current
        if (!container) {
            return
        }

        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
        stickToBottomRef.current = distanceFromBottom < 120

        if (container.scrollTop < 140) {
            void loadOlderMessages()
        }
    }

    useEffect(() => {
        const socket = socketRef.current
        const conversationId = selectedConversationId
        const trimmedReply = replyMessage.trim()

        if (!socket?.connected || !conversationId) {
            if (replyTypingTimeoutRef.current !== null) {
                window.clearTimeout(replyTypingTimeoutRef.current)
                replyTypingTimeoutRef.current = null
            }

            if (replyTypingActiveRef.current && socket?.connected && conversationId) {
                socket.emit('support:typing', { conversationId, isTyping: false })
            }

            replyTypingActiveRef.current = false
            return
        }

        if (!trimmedReply) {
            if (replyTypingActiveRef.current) {
                socket.emit('support:typing', { conversationId, isTyping: false })
            }

            replyTypingActiveRef.current = false
            if (replyTypingTimeoutRef.current !== null) {
                window.clearTimeout(replyTypingTimeoutRef.current)
                replyTypingTimeoutRef.current = null
            }
            return
        }

        if (!replyTypingActiveRef.current) {
            socket.emit('support:typing', { conversationId, isTyping: true })
            replyTypingActiveRef.current = true
        }

        if (replyTypingTimeoutRef.current !== null) {
            window.clearTimeout(replyTypingTimeoutRef.current)
        }

        replyTypingTimeoutRef.current = window.setTimeout(() => {
            const activeSocket = socketRef.current
            const activeConversationId = selectedConversationIdRef.current

            if (activeSocket?.connected && activeConversationId && replyTypingActiveRef.current) {
                activeSocket.emit('support:typing', { conversationId: activeConversationId, isTyping: false })
                replyTypingActiveRef.current = false
            }
        }, 1200)

        return () => {
            if (replyTypingTimeoutRef.current !== null) {
                window.clearTimeout(replyTypingTimeoutRef.current)
                replyTypingTimeoutRef.current = null
            }
        }
    }, [replyMessage, selectedConversationId])

    useEffect(() => {
        const interval = window.setInterval(() => {
            loadConversations(true)
            if (selectedConversationId) {
                loadConversation(selectedConversationId, true)
            }
        }, 20000)

        return () => window.clearInterval(interval)
    }, [loadConversations, loadConversation, selectedConversationId, statusFilter, searchQuery])

    useEffect(() => {
        if (messageScrollRef.current) {
            messageScrollRef.current.scrollTop = messageScrollRef.current.scrollHeight
        }
    }, [messages, selectedConversationId])

    const handleSendReply = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!selectedConversationId || !replyMessage.trim()) return

        setIsSending(true)
        setError(null)

        try {
            const response = await apiClient.sendSupportReply(selectedConversationId, replyMessage.trim())

            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to send reply')
            }

            setReplyMessage('')
            await Promise.all([
                loadConversation(selectedConversationId, true),
                loadConversations(true),
            ])
        } catch (sendError) {
            console.error('Error sending support reply:', sendError)
            setError(sendError instanceof Error ? sendError.message : 'Failed to send reply')
        } finally {
            setIsSending(false)
        }
    }

    const handleConversationAction = async () => {
        const activeConversation = selectedConversation ?? selectedSummary
        if (!activeConversation) return

        setError(null)

        try {
            const response = activeConversation.status === 'CLOSED'
                ? await apiClient.updateSupportConversationStatus(activeConversation.id, 'OPEN')
                : await apiClient.updateSupportConversationStatus(activeConversation.id, 'CLOSED')

            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to update conversation status')
            }

            await Promise.all([
                loadConversation(activeConversation.id, true),
                loadConversations(true),
            ])
        } catch (actionError) {
            console.error('Error updating conversation status:', actionError)
            setError(actionError instanceof Error ? actionError.message : 'Failed to update conversation status')
        }
    }

    const handleAssignToMe = async () => {
        const activeConversation = selectedConversation ?? selectedSummary
        if (!activeConversation) return

        setIsAssigning(true)
        setError(null)

        try {
            const response = await apiClient.assignSupportConversation(activeConversation.id)

            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to assign conversation')
            }

            await Promise.all([
                loadConversation(activeConversation.id, true),
                loadConversations(true),
            ])
        } catch (assignError) {
            console.error('Error assigning support conversation:', assignError)
            setError(assignError instanceof Error ? assignError.message : 'Failed to assign conversation')
        } finally {
            setIsAssigning(false)
        }
    }

    const handleSearchSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        await loadConversations()
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="rounded-3xl border border-gold-500/20 bg-gradient-to-r from-gold-500/10 via-navy-800/60 to-blue-500/10 p-6"
            >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold-500/20 bg-navy-800/50 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-gold-300">
                            <MessageCircle className="h-3.5 w-3.5" />
                            Support Inbox
                        </div>
                        <h1 className="text-3xl font-bold text-white">Live customer support</h1>
                        <p className="mt-2 max-w-2xl text-sm text-gray-300">
                            Track conversations, answer customers in real time, and keep the support queue moving from one place.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-2xl border border-white/10 bg-navy-800/50 px-4 py-3">
                            <p className="text-2xl font-bold text-white">{openCount}</p>
                            <p className="text-xs uppercase tracking-wide text-gray-400">Open</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-navy-800/50 px-4 py-3">
                            <p className="text-2xl font-bold text-white">{pendingCount}</p>
                            <p className="text-xs uppercase tracking-wide text-gray-400">Pending</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-navy-800/50 px-4 py-3">
                            <p className="text-2xl font-bold text-white">{closedCount}</p>
                            <p className="text-xs uppercase tracking-wide text-gray-400">Closed</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search customer, email, subject, or message"
                            className="w-full rounded-2xl border border-gold-500/20 bg-dark-800/60 py-3 pl-11 pr-4 text-white placeholder:text-gray-500 focus:border-gold-500/40 focus:outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="rounded-2xl border border-gold-500/20 bg-navy-800/60 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-navy-800"
                    >
                        Search
                    </button>
                </form>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
                    <Filter className="h-4 w-4 text-gray-400" />
                    {statusOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setStatusFilter(option.value)}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${statusFilter === option.value
                                ? 'border-gold-500/40 bg-gold-500 text-navy-900'
                                : 'border-white/10 bg-navy-800/50 text-gray-300 hover:text-white'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => loadConversations(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-navy-800/50 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <div
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${socketStatus === 'connected'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : socketStatus === 'connecting' || socketStatus === 'reconnecting'
                                ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                                : socketStatus === 'error'
                                    ? 'border-red-500/30 bg-red-500/10 text-red-300'
                                    : 'border-white/10 bg-navy-800/50 text-gray-300'
                            }`}
                    >
                        <span
                            className={`h-2 w-2 rounded-full ${socketStatus === 'connected'
                                ? 'bg-emerald-400'
                                : socketStatus === 'connecting' || socketStatus === 'reconnecting'
                                    ? 'bg-blue-400'
                                    : socketStatus === 'error'
                                        ? 'bg-red-400'
                                        : 'bg-gray-500'
                                }`}
                        />
                        {socketStatus === 'connected'
                            ? 'Live connected'
                            : socketStatus === 'connecting'
                                ? 'Connecting'
                                : socketStatus === 'reconnecting'
                                    ? 'Reconnecting'
                                    : socketStatus === 'error'
                                        ? 'Live unavailable'
                                        : 'Polling fallback'}
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                        <div className="flex-1">
                            <p className="font-medium text-red-100">Something needs attention</p>
                            <p className="mt-1 text-red-200/80">{error}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => loadConversations()}
                            className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-100 transition-colors hover:bg-red-500/20"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                <motion.aside
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, delay: 0.05 }}
                    className="rounded-3xl border border-gold-500/20 bg-dark-800/60 backdrop-blur-sm"
                >
                    <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Conversations</h2>
                            <p className="text-sm text-gray-400">Select a thread to respond</p>
                        </div>
                        <div className="rounded-full bg-navy-800/60 px-3 py-1 text-xs font-medium text-gray-300">
                            {conversations.length} total
                        </div>
                    </div>

                    <div className="max-h-[720px] overflow-y-auto">
                        {isLoadingList && !conversations.length ? (
                            <div className="flex items-center justify-center px-6 py-12 text-gray-400">
                                <div className="flex flex-col items-center gap-3">
                                    <RefreshCw className="h-6 w-6 animate-spin text-gold-500" />
                                    <p className="text-sm">Loading conversations...</p>
                                </div>
                            </div>
                        ) : conversations.length ? (
                            conversations.map((conversation) => {
                                const selected = conversation.id === selectedConversationId
                                const priorityClass = conversation.priority ? priorityMeta[conversation.priority] : 'bg-gray-500/10 text-gray-300 border-gray-500/20'
                                const status = statusMeta[conversation.status]

                                return (
                                    <button
                                        key={conversation.id}
                                        type="button"
                                        onClick={() => setSelectedConversationId(conversation.id)}
                                        className={`w-full border-b border-white/5 px-5 py-4 text-left transition-colors hover:bg-navy-800/50 ${selected ? 'bg-navy-800/70' : ''}`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="truncate font-semibold text-white">{conversation.customerName}</h3>
                                                    {conversation.unreadCount ? (
                                                        <span className="rounded-full bg-gold-500 px-2 py-0.5 text-[11px] font-bold text-navy-900">
                                                            {conversation.unreadCount}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className="mt-1 truncate text-sm text-gray-400">
                                                    {conversation.customerEmail || 'No email provided'}
                                                </p>
                                                <p className="mt-2 line-clamp-2 text-sm text-gray-300">
                                                    {conversation.lastMessage || 'No messages yet'}
                                                </p>
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${status.className}`}>
                                                    {status.icon}
                                                    {status.label}
                                                </div>
                                                {conversation.priority ? (
                                                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${priorityClass}`}>
                                                        {conversation.priority}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </button>
                                )
                            })
                        ) : (
                            <div className="px-6 py-14 text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-navy-800/60">
                                    <Users className="h-7 w-7 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">No conversations found</h3>
                                <p className="mt-2 text-sm text-gray-400">
                                    Try a different filter or clear the search query to see more support threads.
                                </p>
                            </div>
                        )}
                    </div>
                </motion.aside>

                <motion.section
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, delay: 0.1 }}
                    className="flex min-h-[720px] flex-col overflow-hidden rounded-3xl border border-gold-500/20 bg-dark-800/60 backdrop-blur-sm"
                >
                    {isLoadingThread && !selectedConversation ? (
                        <div className="flex flex-1 items-center justify-center">
                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                <RefreshCw className="h-8 w-8 animate-spin text-gold-500" />
                                <p className="text-sm">Loading conversation thread...</p>
                            </div>
                        </div>
                    ) : selectedSummary ? (
                        <>
                            <div className="border-b border-white/5 px-6 py-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h2 className="text-2xl font-bold text-white">{selectedSummary.customerName}</h2>
                                            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${statusMeta[selectedSummary.status].className}`}>
                                                {statusMeta[selectedSummary.status].icon}
                                                {statusMeta[selectedSummary.status].label}
                                            </span>
                                        </div>

                                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-400">
                                            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-navy-800/50 px-3 py-1">
                                                <Mail className="h-4 w-4" />
                                                {selectedSummary.customerEmail || 'No email'}
                                            </span>
                                            {selectedSummary.customerPhone ? (
                                                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-navy-800/50 px-3 py-1">
                                                    <Phone className="h-4 w-4" />
                                                    {selectedSummary.customerPhone}
                                                </span>
                                            ) : null}
                                            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-navy-800/50 px-3 py-1">
                                                <Clock3 className="h-4 w-4" />
                                                Updated {formatRelativeTime(selectedSummary.updatedAt)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handleAssignToMe}
                                            disabled={isAssigning || selectedSummary.assignedAdminId === admin?.id}
                                            className="rounded-2xl border border-white/10 bg-navy-800/50 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {selectedSummary.assignedAdminId === admin?.id
                                                ? 'Assigned to you'
                                                : isAssigning
                                                    ? 'Assigning...'
                                                    : 'Assign to me'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleConversationAction}
                                            className="rounded-2xl border border-white/10 bg-navy-800/50 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-navy-800"
                                        >
                                            {selectedSummary.status === 'CLOSED' ? 'Reopen conversation' : 'Close conversation'}
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-400">
                                    {selectedSummary.assignedAdminName ? (
                                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-navy-800/50 px-3 py-1">
                                            <User className="h-4 w-4" />
                                            Assigned to {selectedSummary.assignedAdminName}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-navy-800/50 px-3 py-1">
                                            <User className="h-4 w-4" />
                                            Unassigned
                                        </span>
                                    )}
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-300">
                                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${selectedConversationPresence?.customerOnline
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                                        : 'border-white/10 bg-navy-800/50 text-gray-300'
                                        }`}>
                                        <span className={`h-2 w-2 rounded-full ${selectedConversationPresence?.customerOnline ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                                        {selectedConversationPresence?.customerOnline ? 'Customer online' : 'Customer offline'}
                                    </span>
                                    {selectedConversationTyping?.customerTyping && (
                                        <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-blue-200">
                                            <span className="h-2 w-2 rounded-full bg-blue-400" />
                                            Customer typing...
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div ref={messageScrollRef} onScroll={handleMessageScroll} className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                                {messages.length ? (
                                    messages.map((message) => {
                                        const isAdminMessage = message.senderType === 'ADMIN'
                                        const isSystemMessage = message.senderType === 'SYSTEM'
                                        const isOutgoing = isAdminMessage
                                        const deliveryLabel = message.readAt && isOutgoing
                                            ? 'Seen'
                                            : isOutgoing
                                                ? 'Delivered'
                                                : formatRelativeTime(message.createdAt)

                                        return (
                                            <div key={message.id} className={`flex ${isAdminMessage ? 'justify-end' : 'justify-start'}`}>
                                                <div
                                                    className={`max-w-[80%] rounded-3xl border px-4 py-3 shadow-lg ${isAdminMessage
                                                        ? 'border-gold-500/20 bg-gold-500/10'
                                                        : isSystemMessage
                                                            ? 'border-blue-500/20 bg-blue-500/10'
                                                            : 'border-white/10 bg-navy-800/70'
                                                        }`}
                                                >
                                                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-800/70">
                                                                {isAdminMessage ? (
                                                                    <ShieldAlert className="h-4 w-4 text-gold-400" />
                                                                ) : isSystemMessage ? (
                                                                    <CheckCircle2 className="h-4 w-4 text-blue-300" />
                                                                ) : (
                                                                    <User className="h-4 w-4 text-gray-300" />
                                                                )}
                                                            </div>
                                                            <span className="text-sm font-semibold text-white">{message.senderName}</span>
                                                            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-300">
                                                                {message.senderType}
                                                            </span>
                                                            {message.isInternal ? (
                                                                <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-[11px] font-medium text-yellow-200">
                                                                    Internal note
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <span className="text-xs text-gray-400">{formatRelativeTime(message.createdAt)}</span>
                                                    </div>

                                                    <p className="whitespace-pre-wrap text-sm leading-6 text-gray-100">{message.message}</p>
                                                    <p className={`mt-2 text-[11px] ${isAdminMessage ? 'text-gold-200/80' : 'text-gray-400'}`}>
                                                        {deliveryLabel}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="flex h-full items-center justify-center">
                                        <div className="max-w-sm text-center">
                                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-navy-800/60">
                                                <MessageCircle className="h-7 w-7 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-white">No messages yet</h3>
                                            <p className="mt-2 text-sm text-gray-400">
                                                This conversation is ready for the first reply from your team.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-white/5 px-6 py-5">
                                <form onSubmit={handleSendReply} className="space-y-3">
                                    <p className="text-xs text-gray-400">
                                        {selectedConversationTyping?.customerTyping
                                            ? 'The customer is actively typing a reply.'
                                            : selectedConversationPresence?.customerOnline
                                                ? 'The customer is currently online.'
                                                : 'The customer is offline right now.'}
                                    </p>
                                    <textarea
                                        value={replyMessage}
                                        onChange={(event) => setReplyMessage(event.target.value)}
                                        placeholder="Type your reply to the customer..."
                                        rows={4}
                                        className="w-full resize-none rounded-3xl border border-gold-500/20 bg-navy-800/60 px-4 py-4 text-white placeholder:text-gray-500 focus:border-gold-500/40 focus:outline-none"
                                    />

                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs text-gray-400">
                                            Replies will be added to the live support thread and synced to the customer view.
                                        </p>

                                        <button
                                            type="submit"
                                            disabled={isSending || !replyMessage.trim()}
                                            className="inline-flex items-center gap-2 rounded-2xl bg-gold-500 px-5 py-3 text-sm font-semibold text-navy-900 transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {isSending ? (
                                                <>
                                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                                    Sending
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="h-4 w-4" />
                                                    Send Reply
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-1 items-center justify-center px-6 py-14 text-center">
                            <div className="max-w-md">
                                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-navy-800/60">
                                    <MessageCircle className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Select a conversation</h3>
                                <p className="mt-3 text-sm leading-6 text-gray-400">
                                    Open any customer thread from the left panel to view their history and send a reply from the admin inbox.
                                </p>
                            </div>
                        </div>
                    )}
                </motion.section>
            </div>
        </div>
    )
}

export default SupportInbox
