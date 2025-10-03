# Mining Page - Manual Testing Checklist

**Status:** Ready for manual testing  
**Tester:** _______________  
**Date:** _______________

---

## 🧪 Pre-Test Setup

- [ ] Backend server running on `http://localhost:8000`
- [ ] Frontend app running on `http://localhost:3000`
- [ ] User account logged in
- [ ] Test user has sufficient balance for investments

---

## 1️⃣ Initial Page Load

### When page loads:
- [ ] URL is `/dashboard/mining`
- [ ] Page title shows "Mining Operations"
- [ ] Refresh button visible in top-right
- [ ] Summary cards section displays (4 cards)
- [ ] Active Investments section displays
- [ ] Available Operations section displays

### Loading States:
- [ ] Summary cards show skeleton loaders initially
- [ ] Active investments show 3 skeleton items
- [ ] Available operations show 3 skeleton cards
- [ ] Skeletons animate smoothly
- [ ] Transition to real data is smooth (no flash)

---

## 2️⃣ Investment Summary Cards

### Verify Data Display:
- [ ] **Total Invested** card shows dollar amount
- [ ] Shows count: "X active operations"
- [ ] **Total Earnings** card shows dollar amount
- [ ] Shows "Total earned" subtitle
- [ ] **ROI** card shows percentage
- [ ] Shows "Return on investment" subtitle
- [ ] **Avg Return** card shows percentage
- [ ] Shows "Daily average" subtitle

### With No Investments:
- [ ] All cards show $0.00 or 0%
- [ ] Count shows "0 operations"
- [ ] No errors displayed

### With Active Investments:
- [ ] Numbers match backend data
- [ ] ROI calculated correctly: (earnings / invested) × 100
- [ ] Active count matches number of investments shown

---

## 3️⃣ Active Investments Section

### With No Investments:
- [ ] Empty state displays with ⚡ icon
- [ ] Text: "No active investments"
- [ ] Subtext: "Start investing in mining operations below"
- [ ] No error messages

### With Active Investments:
Each investment card should show:
- [ ] Operation name (bold, large)
- [ ] Operation description (gray, small)
- [ ] Status badge (ACTIVE/COMPLETED/CANCELLED)
- [ ] Badge has correct color (green/blue/red)

Investment Details (4 columns):
- [ ] **Invested:** Shows correct amount
- [ ] **Current Earnings:** Shows total earned (green)
- [ ] **Daily Return:** Shows percentage (gold)
- [ ] **Performance:** Shows calculated percentage

Bottom Row:
- [ ] Shows days remaining or "Completed"
- [ ] Clock icon displayed
- [ ] "Stop Operation" button visible (for ACTIVE only)
- [ ] Button is red color
- [ ] Button disabled when loading

---

## 4️⃣ Available Mining Operations

### With No Operations:
- [ ] Empty state displays with 🎯 icon
- [ ] Text: "No operations available"
- [ ] Subtext: "Check back later for new opportunities"

### With Available Operations:
Each operation card should display:
- [ ] Operation name (bold)
- [ ] Risk level badge (LOW/MEDIUM/HIGH)
- [ ] Badge color matches risk (green/yellow/red)
- [ ] Shield icon in risk badge
- [ ] Operation description

Details Section (4 rows):
- [ ] **Daily Return:** Shows percentage (green)
- [ ] **Duration:** Shows days
- [ ] **Min Investment:** Shows dollar amount
- [ ] **Max Investment:** Shows dollar amount

Capacity Bar:
- [ ] Progress bar visible
- [ ] Shows percentage (e.g., "65.3%")
- [ ] Bar fills from left to right
- [ ] Gold gradient color
- [ ] Bar width matches percentage

Action Button:
- [ ] "Start Investment" button visible
- [ ] Button has gold gradient (primary style)
- [ ] Plus icon displayed
- [ ] Hover effect works (scale 1.05)
- [ ] If capacity full: shows "Capacity Full" (gray, disabled)

---

## 5️⃣ Start Investment Flow

### Click "Start Investment" on any operation:
- [ ] Modal opens with fade-in animation
- [ ] Modal is centered on screen
- [ ] Backdrop is dark/blurred
- [ ] X button visible in top-right

### Modal Content:
- [ ] Shows selected operation name
- [ ] Shows operation description
- [ ] **Daily Return** displayed
- [ ] **Duration** displayed
- [ ] **Range** shows min-max amounts

### Investment Amount Input:
- [ ] Input field focused automatically
- [ ] Placeholder shows minimum amount
- [ ] Can type numbers
- [ ] Input has gold border on focus

### Validation Tests:

**Empty amount:**
- [ ] Click "Confirm Investment"
- [ ] Error shows: "Please enter an investment amount"
- [ ] Error has red background
- [ ] Error persists until valid input

**Amount below minimum:**
- [ ] Enter amount less than minimum
- [ ] Click "Confirm Investment"
- [ ] Error shows: "Amount must be between $X and $Y"
- [ ] Specific amounts displayed

**Amount above maximum:**
- [ ] Enter amount greater than maximum
- [ ] Click "Confirm Investment"
- [ ] Error shows: "Amount must be between $X and $Y"

**Valid amount:**
- [ ] Enter amount within range
- [ ] Error message clears
- [ ] Can submit

### Submit Investment:
- [ ] Click "Confirm Investment"
- [ ] Button shows loading spinner
- [ ] Button text changes to "Processing..."
- [ ] Button is disabled during loading
- [ ] Cancel button also disabled

**On Success:**
- [ ] Modal closes automatically
- [ ] Investment appears in Active Investments section
- [ ] Summary cards update with new values
- [ ] Available operation capacity decreases
- [ ] No error messages

**On Failure:**
- [ ] Error message displays in modal
- [ ] Error is specific (e.g., "Insufficient balance")
- [ ] Modal stays open
- [ ] Can retry or cancel

### Cancel:
- [ ] Click "Cancel" button
- [ ] Modal closes without submitting
- [ ] No data changes
- [ ] No errors

---

## 6️⃣ Stop Investment Flow

### Click "Stop Operation" button:
- [ ] Browser confirmation dialog appears
- [ ] Dialog text: "Are you sure you want to stop this mining operation?"

### Confirm Stop:
- [ ] Click "OK" in dialog
- [ ] Button shows loading state
- [ ] Button text or spinner visible
- [ ] Investment status changes to COMPLETED
- [ ] Investment moves to completed (if filtering)
- [ ] Summary cards update
- [ ] Success feedback shown

### Cancel Stop:
- [ ] Click "Cancel" in dialog
- [ ] Nothing changes
- [ ] Investment stays active

### Error Handling:
- [ ] If stop fails, alert box appears
- [ ] Alert shows specific error message
- [ ] Investment remains in current state

---

## 7️⃣ Refresh Functionality

### Main Refresh Button (top-right):
- [ ] Click refresh button
- [ ] Button icon spins during load
- [ ] All sections reload simultaneously
- [ ] Loading skeletons don't show (data stays visible)
- [ ] Data updates after fetch completes

### Section-Specific Refresh:
- [ ] Operations section has small refresh icon
- [ ] Click it to reload only operations
- [ ] Icon spins during load
- [ ] Only that section reloads

---

## 8️⃣ Error Handling

### Network Error Test:
1. [ ] Stop backend server
2. [ ] Reload page or click refresh
3. [ ] Error banner appears at top
4. [ ] Banner is red with warning icon
5. [ ] Shows error message
6. [ ] "Try Again" button visible
7. [ ] Click "Try Again"
8. [ ] Start backend
9. [ ] Error clears and data loads

### Individual Section Errors:
- [ ] If one section fails, others still work
- [ ] Error message is section-specific
- [ ] Can retry failed section independently

### 401 Authentication Error:
- [ ] If token expires, should redirect to login
- [ ] Or show "Please log in again" message

---

## 9️⃣ Responsive Design

### Desktop (1920px+):
- [ ] 4 summary cards per row
- [ ] 3 operations cards per row
- [ ] Investment cards full width
- [ ] Modal is medium width, centered

### Tablet (768px - 1024px):
- [ ] 2 summary cards per row
- [ ] 2 operations cards per row
- [ ] All content readable
- [ ] Touch targets large enough

### Mobile (< 768px):
- [ ] 1 summary card per row
- [ ] 1 operation card per row
- [ ] Investment details stack vertically
- [ ] Modal is full width with padding
- [ ] All buttons easily tappable
- [ ] Text is readable (not too small)
- [ ] No horizontal scrolling

---

## 🔟 Performance & UX

### Page Load Speed:
- [ ] Initial load < 2 seconds
- [ ] Skeletons appear immediately
- [ ] Data loads progressively
- [ ] No long blank screens

### Interactions:
- [ ] Buttons respond immediately
- [ ] Hover effects smooth
- [ ] Click animations work
- [ ] No laggy scrolling
- [ ] Modal animations smooth

### Data Freshness:
- [ ] Data updates after investment
- [ ] Data updates after stopping
- [ ] Refresh gets latest data
- [ ] No stale data displayed

---

## 🎨 Visual Quality

### Colors & Contrast:
- [ ] Text is readable on all backgrounds
- [ ] Gold accents visible
- [ ] Status colors distinct (green/yellow/red/blue)
- [ ] Links/buttons have good contrast

### Spacing & Layout:
- [ ] Cards have consistent spacing
- [ ] Text not cramped
- [ ] Sections clearly separated
- [ ] Proper padding throughout

### Icons & Images:
- [ ] All icons render correctly
- [ ] Icons are the right size
- [ ] Icons match their meaning
- [ ] No broken images

---

## 📊 Data Accuracy

### Cross-Check with Backend:
- [ ] Open browser DevTools Network tab
- [ ] Check API responses
- [ ] Verify displayed data matches API data
- [ ] Check calculations are correct

### Summary Calculations:
- [ ] Total Invested = sum of all investments
- [ ] Total Earnings = sum of all earnings
- [ ] ROI = (earnings / invested) × 100
- [ ] Avg Return = average of all dailyReturn values

### Investment Calculations:
- [ ] Current Earnings matches API
- [ ] Performance = (actual / expected) × 100
- [ ] Days remaining calculated correctly

---

## ✅ Final Checklist

- [ ] All features working as expected
- [ ] No console errors in browser
- [ ] No TypeScript errors in editor
- [ ] Responsive on all screen sizes
- [ ] Accessible (can tab through elements)
- [ ] Loading states clear
- [ ] Error states helpful
- [ ] Empty states friendly
- [ ] Data accurate
- [ ] Performance acceptable

---

## 🐛 Issues Found

**Issue #1:**
- Description: _______________
- Severity: □ Critical  □ High  □ Medium  □ Low
- Steps to Reproduce: _______________
- Expected: _______________
- Actual: _______________

**Issue #2:**
- Description: _______________
- Severity: □ Critical  □ High  □ Medium  □ Low
- Steps to Reproduce: _______________
- Expected: _______________
- Actual: _______________

---

## 📝 Tester Notes

_______________________________________________
_______________________________________________
_______________________________________________

---

## ✅ Sign-Off

**Tested By:** _______________  
**Date:** _______________  
**Result:** □ Pass  □ Pass with Issues  □ Fail  
**Ready for Production:** □ Yes  □ No
