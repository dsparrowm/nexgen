# Dashboard Integration TODO List

## 📊 Main Dashboard Page (`/dashboard`)

### Overview
The main dashboard page displays portfolio overview, stats, charts, and quick actions. Currently uses **mock/static data**. Need to integrate with backend APIs to show real user data.

---

## 🎯 Current State Analysis

### Components Structure
```
/dashboard/page.tsx
  └─ DashboardOverview.tsx (Main component with all UI)
```

### Current Issues
- ❌ Uses hardcoded mock data for all stats
- ❌ Hardcoded user name ("Welcome back, John!")
- ❌ Static chart data (not updating)
- ❌ No real-time data fetching
- ❌ Quick action buttons don't navigate/work
- ❌ No error handling
- ❌ No loading states
- ❌ No data refresh mechanism

### Available Backend Endpoints
```
GET /api/user/dashboard/overview - Dashboard overview with key statistics
GET /api/user/dashboard/stats - Detailed dashboard statistics
GET /api/user/profile - User profile data
GET /api/user/mining/stats - Mining statistics
GET /api/user/investments - User investments
GET /api/user/transactions - Transaction history
```

---

## ✅ TODO Items

### 1. **User Welcome Section Integration**
**Priority:** High  
**Component:** Welcome banner ("Welcome back, John!")

**Tasks:**
- [ ] Fetch user data from `/api/user/profile` endpoint
- [ ] Display actual user's first name or username
- [ ] Handle case when user has no first name (fallback to username)
- [ ] Add loading skeleton while fetching user data
- [ ] Handle error state if profile fetch fails

**Files to Modify:**
- `apps/user/app/dashboard/components/DashboardOverview.tsx`

**API Integration:**
```typescript
// GET /api/user/profile
Response: {
  success: true,
  data: {
    user: {
      id: string,
      firstName: string,
      lastName: string,
      username: string,
      email: string,
      ...
    }
  }
}
```

---

### 2. **Stats Cards Integration**
**Priority:** High  
**Component:** 4 stat cards (Total Balance, Active Hashpower, Gold Holdings, Monthly Earnings)

**Tasks:**
- [ ] Fetch dashboard stats from `/api/user/dashboard/stats`
- [ ] Map API response to stat cards:
  - Total Balance (wallet balance + investments)
  - Active Hashpower (from mining stats)
  - Gold Holdings (from investments)
  - Monthly Earnings (calculated from transactions)
- [ ] Display BTC value alongside USD value
- [ ] Calculate and display percentage changes
- [ ] Add loading skeletons for each stat card
- [ ] Handle error states for failed data fetches
- [ ] Add data refresh button/mechanism
- [ ] Format numbers correctly (currency, decimals)
- [ ] Update "Show/Hide Balance" toggle to work with real data

**Files to Modify:**
- `apps/user/app/dashboard/components/DashboardOverview.tsx`

**API Integration:**
```typescript
// GET /api/user/dashboard/stats
Response: {
  success: true,
  data: {
    totalBalance: {
      usd: number,
      btc: number,
      change: number // percentage
    },
    miningStats: {
      activeHashpower: number,
      unit: string,
      plan: string,
      change: number
    },
    goldHoldings: {
      ounces: number,
      usdValue: number,
      change: number
    },
    monthlyEarnings: {
      usd: number,
      btc: number,
      change: number
    }
  }
}
```

---

### 3. **Mining Performance Chart Integration**
**Priority:** High  
**Component:** Line chart showing earnings and hashpower over time

**Tasks:**
- [ ] Fetch mining performance data from `/api/user/mining/stats?period=6months`
- [ ] Transform API data to chart format
- [ ] Display actual earnings trend
- [ ] Display actual hashpower trend
- [ ] Add time period selector (1M, 3M, 6M, 1Y, All)
- [ ] Add loading state while fetching chart data
- [ ] Handle empty data state (no mining activity)
- [ ] Handle error states
- [ ] Add tooltip with detailed information
- [ ] Update chart when time period changes

**Files to Modify:**
- `apps/user/app/dashboard/components/DashboardOverview.tsx`

**API Integration:**
```typescript
// GET /api/user/mining/stats?period=6months
Response: {
  success: true,
  data: {
    performanceData: [
      {
        date: string,
        earnings: number,
        hashpower: number
      },
      ...
    ]
  }
}
```

---

### 4. **Portfolio Allocation Chart Integration**
**Priority:** Medium  
**Component:** Pie chart showing investment distribution

**Tasks:**
- [ ] Fetch investment data from `/api/user/investments`
- [ ] Calculate portfolio allocation percentages
- [ ] Group investments by type (Bitcoin Mining, Gold, etc.)
- [ ] Generate dynamic colors for each category
- [ ] Display actual investment values
- [ ] Add loading state
- [ ] Handle case when user has no investments
- [ ] Show "No investments yet" empty state
- [ ] Handle error states

**Files to Modify:**
- `apps/user/app/dashboard/components/DashboardOverview.tsx`

**API Integration:**
```typescript
// GET /api/user/investments
Response: {
  success: true,
  data: {
    investments: [
      {
        id: string,
        type: string, // "bitcoin_mining", "gold", "ethereum_mining"
        amount: number,
        status: string,
        ...
      },
      ...
    ]
  }
}
```

---

### 5. **Daily Earnings Chart Integration**
**Priority:** Medium  
**Component:** Area chart showing today's earnings

**Tasks:**
- [ ] Fetch today's earnings data from `/api/user/mining/earnings/today`
- [ ] Display hourly earnings breakdown
- [ ] Show BTC earned today
- [ ] Show USD value today
- [ ] Update chart in real-time (or periodic refresh)
- [ ] Add loading state
- [ ] Handle empty data (no earnings today)
- [ ] Show meaningful message for users with no active mining

**Files to Modify:**
- `apps/user/app/dashboard/components/DashboardOverview.tsx`

**API Integration:**
```typescript
// GET /api/user/mining/earnings/today
Response: {
  success: true,
  data: {
    totalBtc: number,
    totalUsd: number,
    hourlyData: [
      {
        hour: string, // "00:00", "04:00", etc.
        btc: number,
        usd: number
      },
      ...
    ]
  }
}
```

---

### 6. **Quick Actions Cards Integration**
**Priority:** High  
**Component:** 3 action cards (Upgrade Mining, Buy Gold, View Transactions)

**Tasks:**
- [ ] Make "Upgrade Mining" navigate to `/dashboard/mining` page
- [ ] Make "Buy Gold" navigate to `/dashboard/investments/new` page
- [ ] Make "View Transactions" navigate to `/dashboard/transactions` page
- [ ] Add proper routing with Next.js Link component
- [ ] Add hover effects and click feedback
- [ ] Add keyboard accessibility (Enter key support)
- [ ] Add loading state when navigating
- [ ] Consider adding badges (e.g., "New offers available")

**Files to Modify:**
- `apps/user/app/dashboard/components/DashboardOverview.tsx`

**Implementation:**
```typescript
import Link from 'next/link';

// Replace cursor-pointer divs with Link components
<Link href="/dashboard/mining">
  <div className="...">
    {/* Upgrade Mining content */}
  </div>
</Link>
```

---

### 7. **Real-time Data Updates**
**Priority:** Medium  
**Component:** Entire dashboard

**Tasks:**
- [ ] Implement auto-refresh mechanism (e.g., every 60 seconds)
- [ ] Add manual refresh button in header
- [ ] Use React Query or SWR for data fetching and caching
- [ ] Implement optimistic updates where appropriate
- [ ] Show "Last updated" timestamp
- [ ] Add subtle loading indicator during background refresh
- [ ] Ensure smooth transitions when data updates

**Files to Modify:**
- `apps/user/app/dashboard/components/DashboardOverview.tsx`
- Create new hook: `apps/user/hooks/useDashboardData.ts`

**Implementation:**
```typescript
// Using SWR for data fetching
import useSWR from 'swr';

const { data, error, isLoading, mutate } = useSWR(
  '/api/user/dashboard/stats',
  fetcher,
  { refreshInterval: 60000 } // Refresh every 60 seconds
);
```

---

### 8. **Loading States**
**Priority:** High  
**Component:** All data-driven components

**Tasks:**
- [ ] Create skeleton loaders for stat cards
- [ ] Create skeleton loaders for charts
- [ ] Create skeleton for welcome section
- [ ] Add smooth transitions from loading to loaded
- [ ] Ensure loading states match component dimensions
- [ ] Add shimmer effect to skeletons

**Files to Create:**
- `apps/user/app/dashboard/components/DashboardSkeleton.tsx`

**Files to Modify:**
- `apps/user/app/dashboard/components/DashboardOverview.tsx`

---

### 9. **Error Handling**
**Priority:** High  
**Component:** Entire dashboard

**Tasks:**
- [ ] Add error boundaries for component-level errors
- [ ] Display user-friendly error messages
- [ ] Add retry button for failed API calls
- [ ] Log errors to monitoring service (optional)
- [ ] Show fallback UI when critical data fails to load
- [ ] Handle network errors gracefully
- [ ] Handle 401 Unauthorized (redirect to login)
- [ ] Handle 403 Forbidden (show permission error)

**Files to Create:**
- `apps/user/components/ErrorBoundary.tsx`
- `apps/user/components/ErrorState.tsx`

**Files to Modify:**
- `apps/user/app/dashboard/components/DashboardOverview.tsx`

---

### 10. **Empty States**
**Priority:** Medium  
**Component:** Charts and data displays

**Tasks:**
- [ ] Design and implement "No data" state for charts
- [ ] Show "Start mining to see data" message when no mining activity
- [ ] Show "No investments yet" when portfolio is empty
- [ ] Add call-to-action buttons in empty states
- [ ] Make empty states visually appealing (illustrations?)

**Files to Create:**
- `apps/user/components/EmptyState.tsx`

**Files to Modify:**
- `apps/user/app/dashboard/components/DashboardOverview.tsx`

---

### 11. **Responsive Design Verification**
**Priority:** Medium  
**Component:** Entire dashboard

**Tasks:**
- [ ] Test dashboard on mobile devices
- [ ] Test dashboard on tablets
- [ ] Ensure charts are readable on small screens
- [ ] Ensure stats cards stack properly on mobile
- [ ] Test touch interactions on mobile
- [ ] Verify chart interactions work on touch devices

**Files to Review:**
- `apps/user/app/dashboard/components/DashboardOverview.tsx`

---

### 12. **Performance Optimization**
**Priority:** Low  
**Component:** Entire dashboard

**Tasks:**
- [ ] Implement code splitting for chart libraries
- [ ] Lazy load charts below the fold
- [ ] Optimize re-renders with React.memo
- [ ] Use useMemo for expensive calculations
- [ ] Optimize chart rendering performance
- [ ] Implement virtual scrolling if needed

**Files to Modify:**
- `apps/user/app/dashboard/components/DashboardOverview.tsx`

---

### 13. **Accessibility**
**Priority:** Medium  
**Component:** Entire dashboard

**Tasks:**
- [ ] Add proper ARIA labels to all interactive elements
- [ ] Ensure keyboard navigation works throughout
- [ ] Add screen reader support for charts
- [ ] Ensure color contrast meets WCAG standards
- [ ] Add alt text for icons
- [ ] Test with screen readers

**Files to Modify:**
- `apps/user/app/dashboard/components/DashboardOverview.tsx`

---

### 14. **Data Formatting & Internationalization**
**Priority:** Low  
**Component:** All number/currency displays

**Tasks:**
- [ ] Create currency formatting utility
- [ ] Format all numbers with proper separators
- [ ] Display currency symbols correctly
- [ ] Handle different locales (future enhancement)
- [ ] Format dates consistently
- [ ] Format percentages properly

**Files to Create:**
- `apps/user/utils/formatting.ts`

**Files to Modify:**
- `apps/user/app/dashboard/components/DashboardOverview.tsx`

---

## 📦 Additional Components to Create

### 1. **DashboardSkeleton.tsx**
Loading skeleton component for dashboard

### 2. **StatCard.tsx** (Optional Refactor)
Reusable stat card component

### 3. **ChartCard.tsx** (Optional Refactor)
Reusable chart container component

### 4. **useDashboardData.ts**
Custom hook for fetching all dashboard data

### 5. **ErrorState.tsx**
Reusable error display component

### 6. **EmptyState.tsx**
Reusable empty state component

---

## 🔧 Utilities to Create

### 1. **formatters.ts**
```typescript
- formatCurrency(amount: number, currency: string): string
- formatNumber(value: number, decimals: number): string
- formatPercentage(value: number): string
- formatHashrate(value: number): string
- formatDate(date: Date): string
```

### 2. **chartHelpers.ts**
```typescript
- transformMiningDataForChart(apiData): ChartData
- transformInvestmentDataForChart(apiData): ChartData
- calculatePortfolioAllocation(investments): AllocationData
```

### 3. **dashboardApi.ts**
```typescript
- fetchDashboardStats(): Promise<DashboardStats>
- fetchMiningPerformance(period): Promise<MiningData>
- fetchInvestments(): Promise<Investment[]>
- fetchTodayEarnings(): Promise<EarningsData>
```

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Dashboard loads without errors
- [ ] All API calls succeed
- [ ] Data displays correctly
- [ ] Charts render properly
- [ ] Loading states appear and disappear correctly
- [ ] Error states display when API fails
- [ ] Quick action buttons navigate correctly
- [ ] Show/Hide balance toggle works
- [ ] Responsive design works on all screen sizes
- [ ] Auto-refresh works (if implemented)

### Edge Cases
- [ ] User with no mining activity
- [ ] User with no investments
- [ ] User with no transactions
- [ ] New user with empty data
- [ ] API timeout handling
- [ ] Network offline handling

---

## 📊 Summary

**Total TODO Items:** 14 major tasks  
**Estimated Complexity:** High  
**Estimated Time:** 3-5 days of development  

**Priority Breakdown:**
- 🔴 High Priority: 6 items (User data, Stats, Charts, Quick actions, Loading, Errors)
- 🟡 Medium Priority: 5 items (Portfolio, Daily earnings, Real-time updates, Empty states, Responsive)
- 🟢 Low Priority: 3 items (Performance, Accessibility, Formatting)

**Dependency Order:**
1. Setup data fetching utilities and API integration
2. Implement loading and error states
3. Integrate user profile data
4. Integrate stats cards
5. Integrate charts
6. Implement quick actions
7. Add real-time updates
8. Polish with empty states and optimizations

---

## 🚀 Ready to Start?

Once you give the go-ahead, I'll begin implementation starting with:
1. Creating data fetching utilities and hooks
2. Implementing loading states
3. Integrating user profile data
4. Then systematically working through each TODO item

**Let me know when you're ready to proceed!** 🎯
