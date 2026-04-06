type LiveAssetSymbol = 'BTC' | 'ETH' | 'USDT' | 'BNB'

type LiveAssetQuote = {
    currentPrice: number
    priceChange24h: number
}

const LIVE_PRICE_TTL_MS = 60_000

const COINGECKO_IDS: Record<LiveAssetSymbol, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    USDT: 'tether',
    BNB: 'binancecoin',
}

const cache = new Map<LiveAssetSymbol, LiveAssetQuote>()
let cacheFetchedAt = 0
let inflightFetch: Promise<Map<LiveAssetSymbol, LiveAssetQuote>> | null = null

const round = (value: number, decimals = 2): number => {
    if (!Number.isFinite(value)) {
        return 0
    }

    return Number(value.toFixed(decimals))
}

async function fetchLivePrices(): Promise<Map<LiveAssetSymbol, LiveAssetQuote>> {
    try {
        const url = new URL('https://api.coingecko.com/api/v3/simple/price')
        url.searchParams.set('ids', Object.values(COINGECKO_IDS).join(','))
        url.searchParams.set('vs_currencies', 'usd')
        url.searchParams.set('include_24hr_change', 'true')

        const response = await fetch(url.toString(), {
            headers: {
                Accept: 'application/json',
            },
        })

        if (!response.ok) {
            throw new Error(`CoinGecko request failed with status ${response.status}`)
        }

        const data = await response.json()
        const quotes = new Map<LiveAssetSymbol, LiveAssetQuote>()

        ;(Object.keys(COINGECKO_IDS) as LiveAssetSymbol[]).forEach((symbol) => {
            const coingeckoId = COINGECKO_IDS[symbol]
            const raw = data?.[coingeckoId]
            const currentPrice = Number(raw?.usd)
            const priceChange24h = Number(raw?.usd_24h_change)

            quotes.set(symbol, {
                currentPrice: Number.isFinite(currentPrice) && currentPrice > 0 ? round(currentPrice, 2) : 0,
                priceChange24h: Number.isFinite(priceChange24h) ? round(priceChange24h, 2) : 0,
            })
        })

        return quotes
    } catch (error) {
        console.warn(
            'Live crypto price fetch failed in the browser, falling back to backend values:',
            error instanceof Error ? error.message : String(error)
        )

        return new Map()
    }
}

export async function getLiveAssetQuotes(forceRefresh = false): Promise<Map<LiveAssetSymbol, LiveAssetQuote>> {
    const isCacheFresh = Date.now() - cacheFetchedAt < LIVE_PRICE_TTL_MS

    if (!forceRefresh && cache.size > 0 && isCacheFresh) {
        return cache
    }

    if (inflightFetch) {
        return inflightFetch
    }

    inflightFetch = (async () => {
        const quotes = await fetchLivePrices()

        if (quotes.size > 0) {
            cache.clear()
            quotes.forEach((quote, symbol) => {
                cache.set(symbol, quote)
            })
            cacheFetchedAt = Date.now()
        }

        inflightFetch = null
        return cache
    })()

    return inflightFetch
}

export type { LiveAssetQuote, LiveAssetSymbol }
