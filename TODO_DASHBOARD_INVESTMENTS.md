# Investments Page Integration TODO List

## 💰 Investment Management Page (`/dashboard/investments`)

### Overview
The investments page allows users to view their investment portfolio, track asset performance, buy/sell assets (gold, bitcoin, ethereum), view price charts, and manage their investment transactions. Currently uses **mock/static data**. Need to integrate with backend APIs for real investment management.

---

## 🎯 Current State Analysis

### Components Structure
```
/dashboard/investments/page.tsx
  └─ InvestmentManagement.tsx (Main component with all investment UI)
```

### Current Issues
- ❌ All investment data is hardcoded/mock
- ❌ Portfolio values are static (not from backend)
- ❌ Holdings data is fake (12.5 oz gold, 0.185 BTC, 2.04 ETH)
- ❌ Buy/Sell buttons only console.log (no actual transactions)
- ❌ Price charts use mock data (not real market prices)
- ❌ Transaction history is static (not from database)
- ❌ No wallet balance integration
- ❌ No real-time price updates
- ❌ No transaction confirmation modals
- ❌ No error handling or loading states
- ❌ Asset selection doesn't validate available balance

### Available Backend Endpoints
```
GET  /api/user/investments              - Get user's investments
GET  /api/user/investments/:id          - Get specific investment details
POST /api/user/investments              - Create new investment
POST /api/user/investments/:id/withdraw - Withdraw from investment
GET  /api/user/transactions             - Get investment transactions
```

---

## ✅ TODO Items

### 1. **Fetch User's Investment Portfolio**
**Priority:** High  
**Component:** Portfolio Overview Section

**Tasks:**
- [ ] Fetch user's investments from `/api/user/investments`
- [ ] Calculate total portfolio value from investments
- [ ] Display actual gold holdings (ounces, value, allocation)
- [ ] Display actual bitcoin holdings (BTC, value, allocation)
- [ ] Display actual ethereum holdings (ETH, value, allocation)
- [ ] Calculate percentage allocation per asset
- [ ] Show/hide balance toggle functionality
- [ ] Add loading skeleton for portfolio cards
- [ ] Handle case when user has no investments
- [ ] Handle error states

**Files to Modify:**
- `apps/user/app/dashboard/components/InvestmentManagement.tsx`

**API Integration:**
```typescript
// GET /api/user/investments
Response: {
  success: true,
  data: {
    investments: [
      {
        id: string,
        type: "gold" | "bitcoin" | "ethereum",
        amount: number, // Amount in asset units (oz for gold, BTC, ETH)
        usdValue: number,
        purchasePrice: number,
        currentPrice: number,
        profitLoss: number,
        profitLossPercentage: number,
        purchaseDate: string,
        status: "active" | "withdrawn"
      }
    ],
    totalValue: number,
    totalProfitLoss: number
  }
}
```

---

### 2. **Real-Time Asset Prices Integration**
**Priority:** High  
**Component:** Current Prices Display & Price Chart

**Tasks:**
- [ ] Fetch current market prices (gold, bitcoin, ethereum)
- [ ] Display live prices for each asset
- [ ] Show price change percentage (24h)
- [ ] Update prices periodically (every 30-60 seconds)
- [ ] Add "Live" indicator when prices are updating
- [ ] Handle price fetch errors
- [ ] Format prices correctly (decimals, commas)
- [ ] Show loading state while fetching prices

**Files to Create:**
- `apps/user/hooks/useAssetPrices.ts`
- `apps/user/utils/priceApi.ts`

**Files to Modify:**
- `apps/user/app/dashboard/components/InvestmentManagement.tsx`

**API Integration:**
```typescript
// May need external API or backend endpoint
// GET /api/public/prices or use CoinGecko/GoldAPI
Response: {
  success: true,
  data: {
    gold: {
      price: number, // USD per oz
      change24h: number,
      changePercentage24h: number
    },
    bitcoin: {
      price: number,
      change24h: number,
      changePercentage24h: number
    },
    ethereum: {
      price: number,
      change24h: number,
      changePercentage24h: number
    }
  }
}
```

---

### 3. **Historical Price Chart Integration**
**Priority:** Medium  
**Component:** Gold/Bitcoin/Ethereum Price Chart

**Tasks:**
- [ ] Fetch historical price data for selected asset
- [ ] Display price chart for selected time range (1M, 3M, 6M, 1Y)
- [ ] Allow switching between assets (gold, bitcoin, ethereum)
- [ ] Update chart when time range changes
- [ ] Show current price and change prominently
- [ ] Add loading state for chart
- [ ] Handle empty data state
- [ ] Format Y-axis with proper currency values

**Files to Create:**
- `apps/user/components/charts/AssetPriceChart.tsx`

**Files to Modify:**
- `apps/user/app/dashboard/components/InvestmentManagement.tsx`

**API Integration:**
```typescript
// GET /api/public/prices/history?asset=gold&period=6M
Response: {
  success: true,
  data: {
    history: [
      {
        date: string,
        price: number,
        volume: number (optional)
      }
    ]
  }
}
```

---

### 4. **Portfolio Allocation Pie Chart Integration**
**Priority:** Medium  
**Component:** Portfolio Allocation Chart

**Tasks:**
- [ ] Calculate actual portfolio allocation from investments
- [ ] Display dynamic pie chart based on real holdings
- [ ] Show percentage and USD value per asset
- [ ] Update chart when investments change
- [ ] Handle empty portfolio state
- [ ] Add loading state
- [ ] Generate colors dynamically if more assets added

**Files to Modify:**
- `apps/user/app/dashboard/components/InvestmentManagement.tsx`

**Implementation:**
```typescript
// Calculate allocation from fetched investments
const calculateAllocation = (investments: Investment[]) => {
  const totalValue = investments.reduce((sum, inv) => sum + inv.usdValue, 0);
  
  return investments.map(inv => ({
    name: inv.type,
    value: (inv.usdValue / totalValue) * 100,
    amount: inv.usdValue,
    color: getAssetColor(inv.type)
  }));
};
```

---

### 5. **Buy Asset Flow Implementation**
**Priority:** High  
**Component:** Buy Assets Form

**Tasks:**
- [ ] Fetch user's wallet balance before purchase
- [ ] Validate sufficient balance for purchase
- [ ] Show current asset price
- [ ] Calculate estimated asset amount based on USD input
- [ ] Create purchase confirmation modal
- [ ] Call `/api/user/investments` POST endpoint
- [ ] Handle purchase success (update portfolio, show success message)
- [ ] Handle purchase errors (insufficient balance, API errors)
- [ ] Add loading state during purchase
- [ ] Clear form after successful purchase
- [ ] Refresh portfolio data after purchase

**Files to Create:**
- `apps/user/components/modals/ConfirmInvestment.tsx`
- `apps/user/hooks/useWalletBalance.ts` (if not created in mining)

**Files to Modify:**
- `apps/user/app/dashboard/components/InvestmentManagement.tsx`

**API Integration:**
```typescript
// POST /api/user/investments
Request: {
  type: "gold" | "bitcoin" | "ethereum",
  amount: number, // USD amount to invest
  purchasePrice: number // Current market price
}
Response: {
  success: true,
  data: {
    investment: {
      id: string,
      type: string,
      amount: number,
      usdValue: number,
      purchasePrice: number,
      purchaseDate: string
    }
  },
  message: "Investment created successfully"
}
```

---

### 6. **Sell Asset Flow Implementation**
**Priority:** High  
**Component:** Sell Assets Form

**Tasks:**
- [ ] Show available balance for selected asset
- [ ] Validate sell amount doesn't exceed holdings
- [ ] Calculate estimated USD value for sale
- [ ] Create sell confirmation modal
- [ ] Show profit/loss calculation in modal
- [ ] Call withdraw investment endpoint
- [ ] Handle successful sale (update portfolio, credit wallet)
- [ ] Handle sale errors
- [ ] Add loading state during sale
- [ ] Clear form after successful sale
- [ ] Refresh portfolio and balance after sale

**Files to Create:**
- `apps/user/components/modals/ConfirmSale.tsx`

**Files to Modify:**
- `apps/user/app/dashboard/components/InvestmentManagement.tsx`

**API Integration:**
```typescript
// POST /api/user/investments/:investmentId/withdraw
Request: {
  amount: number // Amount to withdraw (in asset units)
}
Response: {
  success: true,
  data: {
    withdrawnAmount: number,
    currentValue: number,
    profitLoss: number
  },
  message: "Withdrawal successful"
}
```

---

### 7. **Transaction History Integration**
**Priority:** High  
**Component:** Recent Transactions Section

**Tasks:**
- [ ] Fetch investment transactions from `/api/user/transactions`
- [ ] Display actual transaction history
- [ ] Show transaction type (buy/sell)
- [ ] Display asset name, amount, and value
- [ ] Show transaction date and time
- [ ] Add pagination or "Load More" for many transactions
- [ ] Filter transactions by asset type (optional)
- [ ] Add loading state
- [ ] Handle empty state (no transactions)
- [ ] Link to detailed transactions page

**Files to Modify:**
- `apps/user/app/dashboard/components/InvestmentManagement.tsx`

**API Integration:**
```typescript
// GET /api/user/transactions?type=investment&limit=10
Response: {
  success: true,
  data: {
    transactions: [
      {
        id: string,
        type: "buy" | "sell",
        asset: string,
        amount: number,
        usdValue: number,
        price: number,
        profitLoss: number (for sells),
        date: string,
        status: "completed" | "pending" | "failed"
      }
    ],
    total: number,
    page: number,
    limit: number
  }
}
```

---

### 8. **Wallet Balance Display & Check**
**Priority:** High  
**Component:** Buy/Sell Forms

**Tasks:**
- [ ] Fetch user's wallet balance
- [ ] Display available balance in buy section
- [ ] Check balance before allowing purchase
- [ ] Show warning if insufficient funds
- [ ] Provide link to deposit/fund wallet
- [ ] Update balance after successful transactions
- [ ] Format balance with proper decimals

**Files to Create/Use:**
- `apps/user/hooks/useWalletBalance.ts` (shared with mining)

**Files to Modify:**
- `apps/user/app/dashboard/components/InvestmentManagement.tsx`

**API Integration:**
```typescript
// GET /api/user/wallet/balance
Response: {
  success: true,
  data: {
    balance: {
      usd: number,
      available: number,
      locked: number
    }
  }
}
```

---

### 9. **Investment Profit/Loss Tracking**
**Priority:** Medium  
**Component:** Portfolio Cards & Summary

**Tasks:**
- [ ] Calculate profit/loss for each investment
- [ ] Display profit/loss amount and percentage
- [ ] Show overall portfolio profit/loss
- [ ] Use green for gains, red for losses
- [ ] Add profit/loss indicators (arrows)
- [ ] Calculate unrealized vs. realized gains
- [ ] Show total return on investment (ROI)

**Files to Modify:**
- `apps/user/app/dashboard/components/InvestmentManagement.tsx`

**Implementation:**
```typescript
const calculateProfitLoss = (investment: Investment, currentPrice: number) => {
  const currentValue = investment.amount * currentPrice;
  const costBasis = investment.amount * investment.purchasePrice;
  const profitLoss = currentValue - costBasis;
  const profitLossPercentage = ((profitLoss / costBasis) * 100).toFixed(2);
  
  return { profitLoss, profitLossPercentage };
};
```

---

### 10. **Loading States**
**Priority:** High  
**Component:** All data-driven sections

**Tasks:**
- [ ] Create skeleton loader for portfolio cards
- [ ] Create skeleton for price chart
- [ ] Create skeleton for allocation chart
- [ ] Create skeleton for transaction history
- [ ] Add loading spinner for buy/sell buttons
- [ ] Smooth transitions from loading to loaded
- [ ] Add shimmer effect to skeletons

**Files to Create:**
- `apps/user/app/dashboard/components/InvestmentSkeleton.tsx`

**Files to Modify:**
- `apps/user/app/dashboard/components/InvestmentManagement.tsx`

---

### 11. **Error Handling**
**Priority:** High  
**Component:** Entire Investments Page

**Tasks:**
- [ ] Add error boundary
- [ ] Display user-friendly error messages
- [ ] Handle API failures gracefully
- [ ] Handle insufficient balance errors
- [ ] Handle network errors
- [ ] Add retry buttons for failed requests
- [ ] Show fallback UI for critical errors
- [ ] Toast notifications for errors

**Files to Modify:**
- `apps/user/app/dashboard/components/InvestmentManagement.tsx`

**Files to Use:**
- `apps/user/components/ErrorState.tsx`

---

### 12. **Empty States**
**Priority:** Medium  
**Component:** Portfolio & Transactions

**Tasks:**
- [ ] Design "No investments yet" empty state
- [ ] Show call-to-action to start investing
- [ ] Display available assets in empty state
- [ ] Create "No transactions" empty state
- [ ] Make empty states visually appealing
- [ ] Add illustrations or icons

**Files to Modify:**
- `apps/user/app/dashboard/components/InvestmentManagement.tsx`

**Files to Use:**
- `apps/user/components/EmptyState.tsx`

---

### 13. **Input Validation**
**Priority:** High  
**Component:** Buy/Sell Forms

**Tasks:**
- [ ] Validate buy amount is positive number
- [ ] Validate buy amount doesn't exceed wallet balance
- [ ] Validate sell amount is positive number
- [ ] Validate sell amount doesn't exceed holdings
- [ ] Show validation errors inline
- [ ] Disable submit button when invalid
- [ ] Add min/max investment limits
- [ ] Format input with proper decimals

**Files to Create:**
- `apps/user/utils/investmentValidators.ts`

**Files to Modify:**
- `apps/user/app/dashboard/components/InvestmentManagement.tsx`

---

### 14. **Quick Investment Actions**
**Priority:** Low  
**Component:** New Section (Optional)

**Tasks:**
- [ ] Add quick action buttons (Invest $100, $500, $1000)
- [ ] Pre-fill amount with quick action value
- [ ] Add "Buy More" button on each portfolio card
- [ ] Add "Sell All" option with confirmation
- [ ] Implement dollar-cost averaging calculator
- [ ] Show suggested investment amounts

**Files to Modify:**
- `apps/user/app/dashboard/components/InvestmentManagement.tsx`

---

### 15. **Investment Performance Analytics**
**Priority:** Low  
**Component:** New Section (to be added)

**Tasks:**
- [ ] Show investment performance over time
- [ ] Display ROI percentage
- [ ] Calculate total returns
- [ ] Show best/worst performing assets
- [ ] Add performance comparison chart
- [ ] Display investment timeline

**Files to Create:**
- `apps/user/app/dashboard/components/InvestmentPerformance.tsx`

**Files to Modify:**
- `apps/user/app/dashboard/components/InvestmentManagement.tsx`

---

### 16. **Asset Details Modal/Page**
**Priority:** Low  
**Component:** New Modal (Optional)

**Tasks:**
- [ ] Create detailed asset view modal
- [ ] Show comprehensive price chart
- [ ] Display asset statistics
- [ ] Show market cap, volume, etc.
- [ ] Add buy/sell actions in modal
- [ ] Link from portfolio cards

**Files to Create:**
- `apps/user/components/modals/AssetDetails.tsx`

**Files to Modify:**
- `apps/user/app/dashboard/components/InvestmentManagement.tsx`

---

### 17. **Real-Time Updates**
**Priority:** Medium  
**Component:** Entire Investments Page

**Tasks:**
- [ ] Implement polling for price updates (every 30-60 seconds)
- [ ] Update portfolio values in real-time
- [ ] Update profit/loss automatically
- [ ] Show "Live" or "Updating" indicator
- [ ] Add manual refresh button
- [ ] Show "Last updated" timestamp
- [ ] Consider WebSocket for real-time prices (optional)

**Files to Create:**
- `apps/user/hooks/useInvestmentData.ts`

**Files to Modify:**
- `apps/user/app/dashboard/components/InvestmentManagement.tsx`

**Implementation:**
```typescript
import useSWR from 'swr';

const { data, error, isLoading, mutate } = useSWR(
  '/api/user/investments',
  fetcher,
  {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true
  }
);
```

---

### 18. **Transaction Confirmation Modals**
**Priority:** High  
**Component:** Buy/Sell Actions

**Tasks:**
- [ ] Create buy confirmation modal
- [ ] Show transaction summary (asset, amount, total cost)
- [ ] Display current price and estimated amount
- [ ] Show wallet balance and remaining after purchase
- [ ] Create sell confirmation modal
- [ ] Show profit/loss in sell confirmation
- [ ] Add final "Confirm" button
- [ ] Add "Cancel" option
- [ ] Show loading state during transaction

**Files to Create:**
- `apps/user/components/modals/ConfirmInvestment.tsx`
- `apps/user/components/modals/ConfirmSale.tsx`

**Files to Modify:**
- `apps/user/app/dashboard/components/InvestmentManagement.tsx`

---

### 19. **Mobile Responsiveness**
**Priority:** Medium  
**Component:** Entire Investments Page

**Tasks:**
- [ ] Test investments page on mobile devices
- [ ] Ensure buy/sell forms are usable on mobile
- [ ] Test charts on small screens
- [ ] Verify portfolio cards stack properly
- [ ] Test modals on mobile
- [ ] Ensure touch interactions work

**Files to Review:**
- `apps/user/app/dashboard/components/InvestmentManagement.tsx`

---

### 20. **Accessibility**
**Priority:** Medium  
**Component:** Entire Investments Page

**Tasks:**
- [ ] Add ARIA labels to form inputs
- [ ] Ensure keyboard navigation works
- [ ] Add screen reader support
- [ ] Verify color contrast
- [ ] Add alt text for icons
- [ ] Test with screen readers

**Files to Modify:**
- `apps/user/app/dashboard/components/InvestmentManagement.tsx`

---

## 📦 Additional Components to Create

### 1. **InvestmentSkeleton.tsx**
Loading skeleton for investments page

### 2. **ConfirmInvestment.tsx**
Modal for confirming investment purchases

### 3. **ConfirmSale.tsx**
Modal for confirming asset sales

### 4. **AssetPriceChart.tsx**
Reusable price chart component

### 5. **AssetDetails.tsx** (Optional)
Detailed asset information modal

### 6. **InvestmentPerformance.tsx** (Optional)
Performance analytics component

### 7. **useInvestmentData.ts**
Custom hook for fetching investment data

### 8. **useAssetPrices.ts**
Custom hook for real-time asset prices

### 9. **useWalletBalance.ts** (Shared)
Custom hook for wallet balance (shared with mining)

---

## 🔧 Utilities to Create

### 1. **investmentApi.ts**
```typescript
- fetchInvestments(): Promise<Investment[]>
- fetchAssetPrices(): Promise<AssetPrices>
- fetchPriceHistory(asset, period): Promise<PriceData[]>
- createInvestment(data): Promise<Investment>
- withdrawInvestment(id, amount): Promise<WithdrawResult>
- fetchTransactions(filters): Promise<Transaction[]>
```

### 2. **priceApi.ts**
```typescript
- fetchCurrentPrices(): Promise<Prices>
- fetchHistoricalPrices(asset, period): Promise<History[]>
- subscribeToPriceUpdates(callback): Subscription
```

### 3. **investmentFormatters.ts**
```typescript
- formatCurrency(amount: number): string
- formatAssetAmount(amount: number, asset: string): string
- formatProfitLoss(amount: number): string
- formatPercentage(value: number): string
- formatROI(investment: Investment, currentPrice: number): string
```

### 4. **investmentValidators.ts**
```typescript
- validateBuyAmount(amount: number, balance: number): ValidationResult
- validateSellAmount(amount: number, holdings: number): ValidationResult
- isValidInvestmentAmount(amount: number, min: number, max: number): boolean
- canAffordInvestment(balance: number, cost: number): boolean
```

### 5. **investmentCalculators.ts**
```typescript
- calculateProfitLoss(investment, currentPrice): ProfitLoss
- calculatePortfolioValue(investments, prices): number
- calculateAllocation(investments): Allocation[]
- calculateROI(investment, currentPrice): number
- calculateAveragePrice(investments): number
```

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Page loads without errors
- [ ] Portfolio displays real user investments
- [ ] Asset prices load and display correctly
- [ ] Price charts render properly
- [ ] Buy flow works end-to-end
- [ ] Sell flow works end-to-end
- [ ] Wallet balance check prevents overdraft
- [ ] Transaction history displays correctly
- [ ] Confirmation modals work properly
- [ ] Loading states appear correctly
- [ ] Error states display properly
- [ ] Empty states show when no data
- [ ] Real-time updates work
- [ ] Responsive design works on all screens

### Edge Cases
- [ ] User with no investments
- [ ] User trying to buy with insufficient balance
- [ ] User trying to sell more than holdings
- [ ] API timeout handling
- [ ] Network offline handling
- [ ] Price API failure handling
- [ ] Multiple simultaneous transactions
- [ ] Large portfolio (many investments)
- [ ] Zero balance scenarios

---

## 🔍 Backend Verification Needed

### Questions for Backend Team
1. ❓ Does backend track individual investments or aggregate by type?
2. ❓ Is there a **price API endpoint** or should we use external APIs?
3. ❓ Does backend provide **historical price data**?
4. ❓ How does **withdrawal work** - partial or full only?
5. ❓ Is there a **wallet/balance endpoint**?
6. ❓ Does backend calculate **profit/loss** or should frontend do it?
7. ❓ Are there **investment limits** (min/max amounts)?
8. ❓ Does backend support **real-time price updates** via WebSocket?

### Required Backend Endpoints (if missing)
- [ ] `GET /api/user/wallet/balance` - User's wallet balance
- [ ] `GET /api/public/prices` - Current asset prices
- [ ] `GET /api/public/prices/history` - Historical price data
- [ ] `GET /api/user/investments/summary` - Portfolio summary

### Backend Enhancements Needed
- [ ] Add profit/loss calculation to investment response
- [ ] Add current market price to investment response
- [ ] Support partial withdrawals (not just full)
- [ ] Add investment analytics endpoint

---

## 📊 Summary

**Total TODO Items:** 20 major tasks  
**Estimated Complexity:** High  
**Estimated Time:** 4-6 days of development  

**Priority Breakdown:**
- 🔴 High Priority: 9 items (Portfolio, prices, buy/sell flows, transactions, wallet, validation, loading, errors, confirmations)
- 🟡 Medium Priority: 6 items (Price chart, allocation, profit/loss, empty states, real-time, responsive, accessibility)
- 🟢 Low Priority: 5 items (Quick actions, performance analytics, asset details, mobile polish)

**Dependency Order:**
1. Verify backend endpoints and price API source
2. Setup investment API utilities and price fetching
3. Implement loading and error states
4. Fetch and display user's investment portfolio
5. Integrate real-time asset prices
6. Implement buy flow with wallet check
7. Implement sell flow with validation
8. Integrate transaction history
9. Add confirmation modals
10. Add real-time updates
11. Polish with analytics and optimizations

**Blockers/Decisions Needed:**
- Price data source (backend endpoint or external API?)
- Investment model (aggregate by type or individual records?)
- Withdrawal mechanism (partial vs. full)
- Wallet balance endpoint availability
- Profit/loss calculation (backend or frontend?)

---

## 🚀 Ready to Start?

Once you approve this TODO and clarify backend capabilities, I'll begin implementation with:
1. Verifying price data source
2. Creating investment API utilities
3. Implementing loading states
4. Integrating portfolio display
5. Building buy/sell flows with validations

**Awaiting your approval to proceed!** 💰
