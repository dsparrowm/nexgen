export const SUPPORTED_ASSET_SYMBOLS = ['BTC', 'ETH', 'USDT', 'BNB'] as const;

export type AssetSymbol = (typeof SUPPORTED_ASSET_SYMBOLS)[number];

export interface SupportedAsset {
    symbol: AssetSymbol;
    name: string;
    network: string;
    description: string;
    referencePrice: number;
    minInvestment: number;
    precision: number;
    allocationColor: string;
}

export const SUPPORTED_ASSETS: SupportedAsset[] = [
    {
        symbol: 'BTC',
        name: 'Bitcoin',
        network: 'Bitcoin Network',
        description: 'Digital gold exposure with the largest market-cap crypto asset.',
        referencePrice: 68000,
        minInvestment: 100,
        precision: 8,
        allocationColor: '#F7931A'
    },
    {
        symbol: 'ETH',
        name: 'Ethereum',
        network: 'Ethereum Network',
        description: 'Programmable blockchain exposure for smart contract infrastructure.',
        referencePrice: 3500,
        minInvestment: 75,
        precision: 8,
        allocationColor: '#627EEA'
    },
    {
        symbol: 'USDT',
        name: 'Tether',
        network: 'Stablecoin',
        description: 'Dollar-pegged stable asset for lower-volatility portfolio allocation.',
        referencePrice: 1,
        minInvestment: 50,
        precision: 2,
        allocationColor: '#26A17B'
    },
    {
        symbol: 'BNB',
        name: 'BNB',
        network: 'BNB Smart Chain',
        description: 'Exchange and ecosystem utility asset with broad platform coverage.',
        referencePrice: 600,
        minInvestment: 75,
        precision: 8,
        allocationColor: '#F0B90B'
    }
];

export const SUPPORTED_ASSET_SET = new Set<AssetSymbol>(SUPPORTED_ASSET_SYMBOLS);

export const isSupportedAssetSymbol = (value: string): value is AssetSymbol =>
    SUPPORTED_ASSET_SET.has(value.toUpperCase() as AssetSymbol);

export const getSupportedAsset = (symbol: string): SupportedAsset | undefined =>
    SUPPORTED_ASSETS.find((asset) => asset.symbol === symbol.toUpperCase());

export const getAssetCatalog = (): SupportedAsset[] => SUPPORTED_ASSETS;
