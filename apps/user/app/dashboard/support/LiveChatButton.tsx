"use client"

import { useSupportChat } from '@/components/support-chat/SupportChatProvider'
import { MessageCircle } from 'lucide-react'

export default function LiveChatButton() {
    const { openChat } = useSupportChat()

    return (
        <button
            type="button"
            onClick={openChat}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
            <MessageCircle className="w-4 h-4" />
            Start Chat
        </button>
    )
}
