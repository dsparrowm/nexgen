import axios from 'axios';
import { config } from '@/config/env';
import logger from '@/utils/logger';
import { getAssetCatalog, type AssetSymbol, type SupportedAsset } from '@/constants/assets';

type LivePriceQuote = {
    currentPrice: number;
    priceChange24h: number;
    source: 'coingecko' | 'fallback';
    updatedAt: string;
};

type CoinGeckoQuote = {
    usd?: number;
    usd_24h_change?: number;
};

const LIVE_PRICE_TTL_MS = 60_000;

const COINGECKO_IDS: Record<AssetSymbol, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    USDT: 'tether',
    BNB: 'binancecoin',
};

const cache = new Map<AssetSymbol, LivePriceQuote>();
let cacheFetchedAt = 0;
let inflightFetch: Promise<Map<AssetSymbol, LivePriceQuote>> | null = null;

const round = (value: number, decimals = 2): number => {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Number(value.toFixed(decimals));
};

const buildPriceUrl = (): string => {
    const baseUrl = config.cryptoPriceApi.replace(/\/$/, '');
    const url = new URL('simple/price', `${baseUrl}/`);

    url.searchParams.set('ids', Object.values(COINGECKO_IDS).join(','));
    url.searchParams.set('vs_currencies', 'usd');
    url.searchParams.set('include_24hr_change', 'true');

    return url.toString();
};

const buildFallbackQuotes = (): Map<AssetSymbol, LivePriceQuote> => {
    const now = new Date().toISOString();
    const quotes = new Map<AssetSymbol, LivePriceQuote>();

    getAssetCatalog().forEach((asset) => {
        quotes.set(asset.symbol, {
            currentPrice: round(asset.referencePrice, 2),
            priceChange24h: 0,
            source: 'fallback',
            updatedAt: now,
        });
    });

    return quotes;
};

const normalizeQuote = (symbol: AssetSymbol, raw: CoinGeckoQuote | undefined): LivePriceQuote => {
    const now = new Date().toISOString();
    const fallbackAsset = getAssetCatalog().find((asset) => asset.symbol === symbol);

    const currentPrice = Number(raw?.usd);
    const priceChange24h = Number(raw?.usd_24h_change);

    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
        return {
            currentPrice: round(fallbackAsset?.referencePrice ?? 0, 2),
            priceChange24h: 0,
            source: 'fallback',
            updatedAt: now,
        };
    }

    return {
        currentPrice: round(currentPrice, 2),
        priceChange24h: Number.isFinite(priceChange24h) ? round(priceChange24h, 2) : 0,
        source: 'coingecko',
        updatedAt: now,
    };
};

async function fetchLiveQuotes(): Promise<Map<AssetSymbol, LivePriceQuote>> {
    const fallbackQuotes = buildFallbackQuotes();

    try {
        const response = await axios.get<Record<string, CoinGeckoQuote>>(buildPriceUrl(), {
            timeout: 10_000,
            headers: {
                Accept: 'application/json',
            },
        });

        const data = response.data || {};
        const quotes = new Map<AssetSymbol, LivePriceQuote>();

        (Object.keys(COINGECKO_IDS) as AssetSymbol[]).forEach((symbol) => {
            const coingeckoId = COINGECKO_IDS[symbol];
            quotes.set(symbol, normalizeQuote(symbol, data[coingeckoId]));
        });

        return quotes;
    } catch (error) {
        logger.warn(
            `Failed to fetch live crypto prices, falling back to catalog values: ${
                error instanceof Error ? error.message : String(error)
            }`
        );

        return fallbackQuotes;
    }
}

export async function getLiveAssetQuotes(forceRefresh = false): Promise<Map<AssetSymbol, LivePriceQuote>> {
    const isCacheFresh = Date.now() - cacheFetchedAt < LIVE_PRICE_TTL_MS;

    if (!forceRefresh && cache.size > 0 && isCacheFresh) {
        return cache;
    }

    if (inflightFetch) {
        return inflightFetch;
    }

    inflightFetch = (async () => {
        const quotes = await fetchLiveQuotes();
        cache.clear();
        quotes.forEach((quote, symbol) => {
            cache.set(symbol, quote);
        });
        cacheFetchedAt = Date.now();
        inflightFetch = null;
        return cache;
    })();

    return inflightFetch;
}

export async function getLiveSupportedAssets(forceRefresh = false): Promise<SupportedAsset[]> {
    const quotes = await getLiveAssetQuotes(forceRefresh);

    return getAssetCatalog().map((asset) => {
        const quote = quotes.get(asset.symbol);

        return {
            ...asset,
            currentPrice: quote?.currentPrice ?? asset.referencePrice,
            priceChange24h: quote?.priceChange24h ?? 0,
        };
    });
}

export async function getLiveAssetQuote(symbol: AssetSymbol, forceRefresh = false): Promise<LivePriceQuote> {
    const quotes = await getLiveAssetQuotes(forceRefresh);

    return (
        quotes.get(symbol) || {
            currentPrice: 0,
            priceChange24h: 0,
            source: 'fallback',
            updatedAt: new Date().toISOString(),
        }
    );
}
