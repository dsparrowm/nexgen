"use client"

import { useState } from 'react'

interface LiveChatButtonProps {
    user?: { name?: string; email?: string } | null
}

export default function LiveChatButton({ user }: LiveChatButtonProps) {
    const [loading, setLoading] = useState(false)
    const TAWK_ID = process.env.NEXT_PUBLIC_TAWK_ID || '6794d8253a8427326074c1bd/1iiemolai'

    const openChat = () => {
        if (!TAWK_ID) return
        const win = window as unknown as any

        // If Tawk is already present, maximize it
        if (win.Tawk_API) {
            try { win.Tawk_API.maximize?.() } catch (e) { /* ignore */ }
            return
        }

        setLoading(true)

        win.Tawk_API = win.Tawk_API || {}
        win.Tawk_LoadStart = win.Tawk_LoadStart || new Date()

        // onLoad handler to set attributes and open when ready
        win.Tawk_API.onLoad = function () {
            try {
                if (user?.name || user?.email) {
                    win.Tawk_API.setAttributes?.({ name: user?.name, email: user?.email }, function () { })
                }
            } catch (e) { /* ignore */ }

            try { win.Tawk_API.maximize?.() } catch (e) { /* ignore */ }
            setLoading(false)
        }

        const s = document.createElement('script')
        s.async = true
        s.src = `https://embed.tawk.to/${TAWK_ID}`
        s.charset = 'UTF-8'
        s.setAttribute('crossorigin', '*')
        s.onerror = () => setLoading(false)
        document.head.appendChild(s)
    }

    return (
        <button
            onClick={openChat}
            disabled={loading}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
        >
            {loading ? 'Opening chat…' : 'Start Chat'}
        </button>
    )
}
