import { getApiBase } from '@/lib/axiosInstance'

type SocketAuthType = 'admin' | 'user'

type SupportSocketAuth = {
    token?: string | null
    type?: SocketAuthType
}

type SupportSocket = {
    connect: () => SupportSocket
    connected: boolean
    disconnect: () => void
    emit: (event: string, ...args: any[]) => void
    off: (event: string, listener?: (...args: any[]) => void) => void
    on: (event: string, listener: (...args: any[]) => void) => void
}

export type SupportSocketClient = SupportSocket
export type SupportSocketFactory = NonNullable<Window['io']>

declare global {
    interface Window {
        io?: (url: string, options?: Record<string, unknown>) => SupportSocket
        __nexgenSupportSocketScriptPromise__?: Promise<void>
    }
}

const SOCKET_SERVER_URL = getApiBase(false).replace(/\/+$/, '')

function loadSocketScript() {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('Socket client can only be loaded in the browser.'))
    }

    if (window.io) {
        return Promise.resolve()
    }

    if (!window.__nexgenSupportSocketScriptPromise__) {
        window.__nexgenSupportSocketScriptPromise__ = new Promise<void>((resolve, reject) => {
            const existingScript = document.querySelector<HTMLScriptElement>('script[data-support-socket-client="true"]')
            if (existingScript) {
                existingScript.addEventListener('load', () => resolve(), { once: true })
                existingScript.addEventListener('error', () => reject(new Error('Failed to load support socket client.')), { once: true })
                return
            }

            const script = document.createElement('script')
            script.src = `${SOCKET_SERVER_URL}/socket.io/socket.io.js`
            script.async = true
            script.defer = true
            script.dataset.supportSocketClient = 'true'
            script.onload = () => resolve()
            script.onerror = () => reject(new Error('Failed to load support socket client.'))
            document.head.appendChild(script)
        })
    }

    return window.__nexgenSupportSocketScriptPromise__
}

export async function ensureSupportSocketClient(): Promise<SupportSocketFactory | null> {
    await loadSocketScript()

    return window.io || null
}

export async function createSupportSocket(auth?: SupportSocketAuth) {
    await loadSocketScript()

    if (!window.io) {
        throw new Error('Support socket client is not available.')
    }

    return window.io(SOCKET_SERVER_URL, {
        autoConnect: false,
        auth: auth?.token
            ? {
                token: auth.token,
                type: auth.type,
            }
            : undefined,
        transports: ['websocket', 'polling'],
    })
}

export type { SupportSocket }
