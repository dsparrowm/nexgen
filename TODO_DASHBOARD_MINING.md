# Mining Page Integration TODO List

## ⛏️ Mining Management Page (`/dashboard/mining`)

### Overview
The mining page allows users to monitor and manage their mining operations, view real-time statistics, control mining rigs, and upgrade their mining plans. Currently uses **mock/static data**. Need to integrate with backend APIs for real mining management.

---

## 🎯 Current State Analysis

### Components Structure
```
/dashboard/mining/page.tsx
  └─ MiningManagement.tsx (Main component with all mining UI)
```

### Current Issues
- ❌ Uses hardcoded mock data for current plan
- ❌ Static mining status (not from backend)
- ❌ Fake mining rigs (Antminer S19 Pro #001, #002)
- ❌ Control buttons (Start/Pause/Stop) don't actually control anything
- ❌ Upgrade/Downgrade buttons don't work
- ❌ No real-time metrics updates
- ❌ Hardcoded earnings and performance data
- ❌ No purchase flow for new plans
- ❌ No error handling or loading states
- ❌ Plan selection doesn't persist

### Available Backend Endpoints
```
GET  /api/user/mining/operations        - Get available mining plans
GET  /api/user/mining/operations/:id    - Get specific plan details
GET  /api/user/mining                   - Get user's active mining operations
POST /api/user/mining/start             - Purchase/start a mining plan
PUT  /api/user/mining/:id/stop          - Stop a mining operation
GET  /api/user/dashboard/stats          - Get mining statistics
```

---

## ✅ TODO Items

### 1. **Fetch User's Active Mining Operations**
**Priority:** High  
**Component:** Current Plan Section

**Tasks:**
- [ ] Fetch user's active mining operations from `/api/user/mining`
- [ ] Display user's current plan details (name, hashpower, expiry)
- [ ] Calculate and display plan efficiency
- [ ] Show actual plan status (active/paused/stopped)
- [ ] Display correct expiration date
- [ ] Handle case when user has no active mining plan
- [ ] Add loading skeleton for current plan section
- [ ] Handle error states

**Files to Modify:**
- `apps/user/app/dashboard/components/MiningManagement.tsx`

**API Integration:**
```typescript
// GET /api/user/mining
Response: {
  success: true,
  data: {
    operations: [
      {
        id: string,
        operationId: string,
        userId: string,
        amount: number,
        status: "active" | "paused" | "stopped",
        startDate: string,
        endDate: string,
        operation: {
          name: string,
          hashPower: number,
          duration: number,
          pricePerTH: number
        },
        earnings: {
          total: number,
          daily: number,
          monthly: number
        }
      }
    ]
  }
}
```

---

### 2. **Real-Time Performance Metrics Integration**
**Priority:** High  
**Component:** Performance Metrics Grid (Temperature, Uptime, Daily, Monthly)

**Tasks:**
- [ ] Fetch mining statistics from `/api/user/dashboard/stats`
- [ ] Display actual daily earnings (not hardcoded)
- [ ] Display actual monthly earnings
- [ ] Calculate and show actual uptime percentage
- [ ] Display real-time temperature data (if available)
- [ ] Add loading states for each metric card
- [ ] Update metrics periodically (every 30-60 seconds)
- [ ] Handle missing or null data gracefully
- [ ] Format currency values correctly

**Files to Modify:**
- `apps/user/app/dashboard/components/MiningManagement.tsx`

**API Integration:**
```typescript
// GET /api/user/dashboard/stats
Response: {
  success: true,
  data: {
    miningStats: {
      activeHashpower: number,
      efficiency: number,
      uptime: number,
      temperature: number (optional),
      dailyEarnings: {
        usd: number,
        btc: number
      },
      monthlyEarnings: {
        usd: number,
        btc: number
      }
    }
  }
}
```

---

### 3. **Mining Control Buttons Integration**
**Priority:** High  
**Component:** Start/Pause/Stop Buttons

**Tasks:**
- [ ] Implement actual mining control API calls
- [ ] Connect "Start" button to backend (if mining is stopped)
- [ ] Connect "Pause" button to backend (pause mining operation)
- [ ] Connect "Stop" button to backend (stop mining completely)
- [ ] Add confirmation modal for stop action (warning about consequences)
- [ ] Show loading state during API calls
- [ ] Update mining status after successful action
- [ ] Handle errors (insufficient balance, network errors, etc.)
- [ ] Disable buttons appropriately based on current status
- [ ] Show success/error toast notifications

**Files to Modify:**
- `apps/user/app/dashboard/components/MiningManagement.tsx`

**Files to Create:**
- `apps/user/components/modals/ConfirmStopMining.tsx` (confirmation modal)

**API Integration:**
```typescript
// PUT /api/user/mining/:id/stop
Request: {}
Response: {
  success: true,
  data: {
    operation: { /* updated operation */ }
  },
  message: "Mining operation stopped successfully"
}

// Note: Pause functionality may need to be added to backend
// POST /api/user/mining/:id/pause (if not exists)
```

---

### 4. **Mining Rigs Display Integration**
**Priority:** Medium  
**Component:** Mining Rigs List

**Tasks:**
- [ ] Determine if backend provides rig-level data
- [ ] If yes: Fetch and display actual mining rigs
- [ ] If no: Remove rigs section OR show aggregated mining hardware info
- [ ] Display rig names/IDs
- [ ] Show rig-specific hashpower
- [ ] Display rig temperatures
- [ ] Show rig efficiency metrics
- [ ] Display rig status (active/inactive/maintenance)
- [ ] Add loading state for rigs section
- [ ] Handle empty state (no rigs)

**Files to Modify:**
- `apps/user/app/dashboard/components/MiningManagement.tsx`

**Decision Required:**
Does backend provide individual rig data? If not, consider:
- Option A: Remove rigs section entirely
- Option B: Show "virtual rigs" based on user's total hashpower
- Option C: Request backend to add rig-level data

---

### 5. **Available Mining Plans Integration**
**Priority:** High  
**Component:** Upgrade Plans Section

**Tasks:**
- [ ] Fetch available mining plans from `/api/user/mining/operations`
- [ ] Display all available plans dynamically
- [ ] Show plan details (name, hashpower, price, duration)
- [ ] Display plan features from backend
- [ ] Calculate estimated earnings per plan
- [ ] Highlight user's current plan
- [ ] Mark popular/recommended plans
- [ ] Add loading state for plans grid
- [ ] Handle error if plans fetch fails
- [ ] Update UI when no plans available

**Files to Modify:**
- `apps/user/app/dashboard/components/MiningManagement.tsx`

**API Integration:**
```typescript
// GET /api/user/mining/operations
Response: {
  success: true,
  data: {
    operations: [
      {
        id: string,
        name: string,
        hashPower: number,
        duration: number, // in days
        pricePerTH: number,
        minInvestment: number,
        maxInvestment: number,
        estimatedDailyReturn: number,
        status: "active" | "inactive",
        features: string[] (if available)
      }
    ]
  }
}
```

---

### 6. **Plan Purchase/Upgrade Flow**
**Priority:** High  
**Component:** Upgrade/Downgrade Buttons

**Tasks:**
- [ ] Create plan purchase modal/page
- [ ] Show plan details in modal
- [ ] Calculate total cost based on selected plan
- [ ] Check user's wallet balance before purchase
- [ ] Implement purchase API call
- [ ] Handle insufficient balance error
- [ ] Show loading state during purchase
- [ ] Redirect to payment if needed
- [ ] Update mining operations after successful purchase
- [ ] Show success message with new plan details
- [ ] Handle errors gracefully

**Files to Create:**
- `apps/user/components/modals/PurchaseMiningPlan.tsx`
- `apps/user/app/dashboard/mining/purchase/page.tsx` (optional dedicated page)

**Files to Modify:**
- `apps/user/app/dashboard/components/MiningManagement.tsx`

**API Integration:**
```typescript
// POST /api/user/mining/start
Request: {
  operationId: string,
  amount: number // Investment amount
}
Response: {
  success: true,
  data: {
    operation: {
      id: string,
      operationId: string,
      amount: number,
      status: "active",
      startDate: string,
      endDate: string
    }
  },
  message: "Mining operation started successfully"
}
```

---

### 7. **Plan Downgrade Flow**
**Priority:** Medium  
**Component:** Downgrade Button

**Tasks:**
- [ ] Determine downgrade policy from backend
- [ ] Show downgrade confirmation modal
- [ ] Explain consequences of downgrade (prorated refund? loss of features?)
- [ ] Implement downgrade API call
- [ ] Handle immediate vs. end-of-period downgrade
- [ ] Update UI after successful downgrade
- [ ] Show appropriate messaging

**Files to Create:**
- `apps/user/components/modals/ConfirmDowngrade.tsx`

**Files to Modify:**
- `apps/user/app/dashboard/components/MiningManagement.tsx`

**API Integration:**
```typescript
// May need new endpoint or use existing stop with downgrade flag
// POST /api/user/mining/:id/downgrade
// OR
// PUT /api/user/mining/:id/stop (with downgrade reason)
```

---

### 8. **Real-Time Mining Statistics**
**Priority:** Medium  
**Component:** Entire Mining Page

**Tasks:**
- [ ] Implement WebSocket connection for real-time updates (optional)
- [ ] OR implement polling every 30-60 seconds
- [ ] Update hashpower in real-time
- [ ] Update earnings as they accumulate
- [ ] Update temperature and efficiency metrics
- [ ] Show "Live" indicator when data is updating
- [ ] Add manual refresh button
- [ ] Show "Last updated" timestamp
- [ ] Optimize polling to avoid excessive API calls

**Files to Create:**
- `apps/user/hooks/useMiningStats.ts` (real-time data hook)

**Files to Modify:**
- `apps/user/app/dashboard/components/MiningManagement.tsx`

**Implementation:**
```typescript
// Using SWR with polling
import useSWR from 'swr';

const { data, error, isLoading } = useSWR(
  '/api/user/mining',
  fetcher,
  {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true
  }
);
```

---

### 9. **Mining History/Performance Chart**
**Priority:** Low  
**Component:** New Section (to be added)

**Tasks:**
- [ ] Create historical performance chart
- [ ] Show hashpower over time
- [ ] Show earnings over time
- [ ] Display efficiency trends
- [ ] Add time range selector (24h, 7d, 30d, All)
- [ ] Fetch historical data from backend
- [ ] Add loading state
- [ ] Handle empty data state

**Files to Create:**
- `apps/user/app/dashboard/components/MiningPerformanceChart.tsx`

**Files to Modify:**
- `apps/user/app/dashboard/components/MiningManagement.tsx`

**API Integration:**
```typescript
// May need new endpoint
// GET /api/user/mining/history?period=30d
Response: {
  success: true,
  data: {
    history: [
      {
        date: string,
        hashpower: number,
        earnings: number,
        efficiency: number
      }
    ]
  }
}
```

---

### 10. **Loading States**
**Priority:** High  
**Component:** All data-driven sections

**Tasks:**
- [ ] Create skeleton loader for current plan section
- [ ] Create skeleton for performance metrics
- [ ] Create skeleton for mining rigs
- [ ] Create skeleton for plans grid
- [ ] Add smooth transitions from loading to loaded
- [ ] Ensure skeletons match component dimensions
- [ ] Add shimmer effect

**Files to Create:**
- `apps/user/app/dashboard/components/MiningSkeleton.tsx`

**Files to Modify:**
- `apps/user/app/dashboard/components/MiningManagement.tsx`

---

### 11. **Error Handling**
**Priority:** High  
**Component:** Entire Mining Page

**Tasks:**
- [ ] Add error boundary for component-level errors
- [ ] Display user-friendly error messages
- [ ] Add retry button for failed API calls
- [ ] Handle network errors gracefully
- [ ] Handle insufficient balance errors
- [ ] Handle invalid plan selection errors
- [ ] Show fallback UI when critical data fails
- [ ] Log errors appropriately

**Files to Modify:**
- `apps/user/app/dashboard/components/MiningManagement.tsx`

**Files to Use:**
- `apps/user/components/ErrorState.tsx` (from main dashboard)

---

### 12. **Empty States**
**Priority:** Medium  
**Component:** Mining Operations

**Tasks:**
- [ ] Design "No active mining" empty state
- [ ] Show call-to-action to start mining
- [ ] Display available plans in empty state
- [ ] Make empty state visually appealing
- [ ] Add illustration or icon
- [ ] Link to plan purchase flow

**Files to Modify:**
- `apps/user/app/dashboard/components/MiningManagement.tsx`

**Files to Use:**
- `apps/user/components/EmptyState.tsx` (from main dashboard)

---

### 13. **Wallet Balance Check**
**Priority:** High  
**Component:** Purchase Flow

**Tasks:**
- [ ] Fetch user's wallet balance before purchase
- [ ] Display balance in purchase modal
- [ ] Check if user has sufficient funds
- [ ] Show warning if balance is insufficient
- [ ] Provide link to deposit/fund wallet
- [ ] Handle balance updates after purchase
- [ ] Show remaining balance after transaction

**Files to Create:**
- `apps/user/hooks/useWalletBalance.ts`

**Files to Modify:**
- `apps/user/components/modals/PurchaseMiningPlan.tsx`

**API Integration:**
```typescript
// GET /api/user/wallet/balance
Response: {
  success: true,
  data: {
    balance: {
      usd: number,
      btc: number,
      available: number,
      locked: number
    }
  }
}
```

---

### 14. **Plan Comparison Feature**
**Priority:** Low  
**Component:** Plans Section

**Tasks:**
- [ ] Add "Compare Plans" button
- [ ] Create comparison modal/table
- [ ] Show side-by-side comparison of features
- [ ] Highlight differences between plans
- [ ] Calculate ROI for each plan
- [ ] Show breakeven analysis
- [ ] Add "Select" button in comparison view

**Files to Create:**
- `apps/user/components/modals/CompareMiningPlans.tsx`

**Files to Modify:**
- `apps/user/app/dashboard/components/MiningManagement.tsx`

---

### 15. **Mining Notifications/Alerts**
**Priority:** Low  
**Component:** New Section (to be added)

**Tasks:**
- [ ] Display mining-related notifications
- [ ] Alert when mining plan is about to expire
- [ ] Notify when earnings reach milestones
- [ ] Alert on rig issues (if rig data available)
- [ ] Show maintenance notifications
- [ ] Add dismiss functionality
- [ ] Fetch notifications from backend

**Files to Create:**
- `apps/user/app/dashboard/components/MiningAlerts.tsx`

**Files to Modify:**
- `apps/user/app/dashboard/components/MiningManagement.tsx`

**API Integration:**
```typescript
// GET /api/user/notifications?type=mining
Response: {
  success: true,
  data: {
    notifications: [
      {
        id: string,
        type: "mining",
        title: string,
        message: string,
        severity: "info" | "warning" | "error",
        timestamp: string,
        isRead: boolean
      }
    ]
  }
}
```

---

### 16. **Mobile Responsiveness**
**Priority:** Medium  
**Component:** Entire Mining Page

**Tasks:**
- [ ] Test mining page on mobile devices
- [ ] Ensure control buttons are touch-friendly
- [ ] Test plan cards on small screens
- [ ] Verify metrics grid stacks properly
- [ ] Test modals on mobile
- [ ] Ensure all interactive elements are accessible

**Files to Review:**
- `apps/user/app/dashboard/components/MiningManagement.tsx`

---

### 17. **Accessibility**
**Priority:** Medium  
**Component:** Entire Mining Page

**Tasks:**
- [ ] Add ARIA labels to control buttons
- [ ] Ensure keyboard navigation works
- [ ] Add screen reader support
- [ ] Verify color contrast
- [ ] Add alt text for icons and status indicators
- [ ] Test with screen readers

**Files to Modify:**
- `apps/user/app/dashboard/components/MiningManagement.tsx`

---

### 18. **Performance Optimization**
**Priority:** Low  
**Component:** Entire Mining Page

**Tasks:**
- [ ] Implement code splitting for modals
- [ ] Optimize re-renders with React.memo
- [ ] Use useMemo for expensive calculations
- [ ] Lazy load non-critical components
- [ ] Optimize polling intervals

**Files to Modify:**
- `apps/user/app/dashboard/components/MiningManagement.tsx`

---

## 📦 Additional Components to Create

### 1. **MiningSkeleton.tsx**
Loading skeleton for mining page

### 2. **PurchaseMiningPlan.tsx**
Modal for purchasing mining plans

### 3. **ConfirmStopMining.tsx**
Confirmation modal for stopping mining

### 4. **ConfirmDowngrade.tsx**
Confirmation modal for plan downgrade

### 5. **CompareMiningPlans.tsx** (Optional)
Side-by-side plan comparison

### 6. **MiningPerformanceChart.tsx** (Optional)
Historical performance chart

### 7. **MiningAlerts.tsx** (Optional)
Mining-specific notifications

### 8. **useMiningStats.ts**
Custom hook for fetching mining statistics

### 9. **useWalletBalance.ts**
Custom hook for wallet balance

---

## 🔧 Utilities to Create

### 1. **miningApi.ts**
```typescript
- fetchUserMiningOperations(): Promise<Operation[]>
- fetchAvailablePlans(): Promise<MiningPlan[]>
- purchaseMiningPlan(operationId, amount): Promise<Operation>
- stopMiningOperation(operationId): Promise<void>
- pauseMiningOperation(operationId): Promise<void>
- fetchMiningStats(): Promise<MiningStats>
```

### 2. **miningFormatters.ts**
```typescript
- formatHashrate(hashpower: number): string
- formatMiningDuration(days: number): string
- calculateROI(plan: MiningPlan): number
- formatMiningStatus(status: string): string
```

### 3. **miningValidators.ts**
```typescript
- validatePurchaseAmount(amount: number, min: number, max: number): boolean
- canAffordPlan(balance: number, planCost: number): boolean
- isPlanExpiring(endDate: Date, daysThreshold: number): boolean
```

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Page loads without errors
- [ ] User's current plan displays correctly
- [ ] Control buttons work (start/pause/stop)
- [ ] Available plans load from backend
- [ ] Plan purchase flow works end-to-end
- [ ] Balance check prevents insufficient fund purchases
- [ ] Loading states appear correctly
- [ ] Error states display properly
- [ ] Empty state shows when no mining
- [ ] Real-time updates work (if implemented)
- [ ] Responsive design works on all screens

### Edge Cases
- [ ] User with no active mining plan
- [ ] User trying to purchase with insufficient balance
- [ ] API timeout handling
- [ ] Network offline handling
- [ ] Stopping mining mid-operation
- [ ] Expired mining plan
- [ ] Multiple active mining operations

---

## 🔍 Backend Verification Needed

### Questions for Backend Team
1. ❓ Does backend support **pause** functionality for mining operations?
2. ❓ Does backend provide **individual rig-level data**?
3. ❓ Is there a **mining history endpoint** for charts?
4. ❓ How does **plan downgrade** work (immediate vs. end-of-period)?
5. ❓ Is there a **wallet/balance endpoint**?
6. ❓ Do mining plans have **features** array in response?
7. ❓ Is there **temperature and uptime data** available?
8. ❓ Are **real-time WebSocket updates** available for mining stats?

### Required Backend Endpoints (if missing)
- [ ] `POST /api/user/mining/:id/pause` - Pause mining operation
- [ ] `POST /api/user/mining/:id/resume` - Resume paused operation
- [ ] `GET /api/user/mining/history` - Historical mining data
- [ ] `GET /api/user/wallet/balance` - User's wallet balance
- [ ] `GET /api/user/mining/rigs` - Individual rig data (if supported)

---

## 📊 Summary

**Total TODO Items:** 18 major tasks  
**Estimated Complexity:** High  
**Estimated Time:** 4-6 days of development  

**Priority Breakdown:**
- 🔴 High Priority: 8 items (Active operations, metrics, controls, plans, purchase, loading, errors, balance)
- 🟡 Medium Priority: 5 items (Rigs, downgrade, real-time, empty states, responsive, accessibility)
- 🟢 Low Priority: 5 items (History chart, comparison, notifications, performance)

**Dependency Order:**
1. Verify backend endpoints and capabilities
2. Setup mining API utilities
3. Implement loading and error states
4. Fetch and display user's active mining operations
5. Integrate performance metrics
6. Implement control buttons
7. Fetch and display available plans
8. Implement purchase flow
9. Add real-time updates
10. Polish with empty states and optimizations

**Blockers/Decisions Needed:**
- Backend endpoint verification
- Decision on rig-level data display
- Pause functionality availability
- Wallet balance integration approach

---

## 🚀 Ready to Start?

Once you approve this TODO and clarify backend capabilities, I'll begin implementation with:
1. Verifying backend endpoints
2. Creating mining API utilities
3. Implementing loading states
4. Integrating active mining operations
5. Building purchase flow

**Awaiting your approval to proceed!** ⛏️
