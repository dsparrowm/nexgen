# Activity-Based Token Refresh

## Overview
Automatic token refresh system that extends user sessions based on activity, preventing unexpected logouts while users are actively working.

## ✨ How It Works

### Before (Without Activity Refresh)
```
2:00 PM - User logs in (token expires at 2:15 PM)
2:20 PM - User clicks "Mining" link
         ❌ Token expired 5 minutes ago
         → Redirected to login
         → User must log in again
```

### After (With Activity Refresh)
```
2:00 PM - User logs in (token expires at 2:15 PM)
2:10 PM - User moves mouse (activity detected)
2:10 PM - System checks: Token expires in 5 minutes
         ✅ User is active → Refresh token automatically
         → New token issued (expires at 2:25 PM)
2:20 PM - User clicks "Mining" link
         ✅ Token still valid
         → Page loads normally
```

## 🎯 Key Features

### 1. **Activity Detection**
Tracks multiple types of user activity:
- Mouse movements
- Mouse clicks
- Keyboard input
- Scrolling
- Touch events (mobile)

### 2. **Smart Refresh Logic**
Only refreshes when:
- ✅ Token expires in < 5 minutes
- ✅ User was active in last 2 minutes
- ✅ Not already refreshing (prevents duplicate requests)
- ✅ User is authenticated

### 3. **Efficient Checking**
- Checks token expiration every 60 seconds
- Lightweight activity tracking (passive event listeners)
- Debounces refresh requests
- No performance impact

### 4. **Silent Background Operation**
- Refreshes happen automatically in the background
- No user interruption
- Console logs for debugging (can be disabled in production)

## 📁 Implementation Files

### 1. **useActivityRefresh Hook** (`/apps/user/hooks/useActivityRefresh.ts`)
Custom React hook that manages activity tracking and token refresh logic.

```typescript
import { useActivityRefresh } from '@/hooks/useActivityRefresh';

// In your component
useActivityRefresh({
    enabled: true,
    refreshThreshold: 300,  // Refresh when < 5 minutes remaining
    checkInterval: 60000,   // Check every minute
});
```

### 2. **Auth Utilities** (`/apps/user/utils/auth.ts`)
Enhanced with new functions:

#### `getTokenExpirationTime(): number`
Returns seconds until token expires (0 if expired/invalid).

```typescript
const timeLeft = getTokenExpirationTime();
console.log(`Token expires in ${timeLeft} seconds`);
```

#### `refreshAuthToken(): Promise<boolean>`
Calls backend refresh endpoint and updates stored tokens.

```typescript
const success = await refreshAuthToken();
if (success) {
    console.log('Token refreshed!');
}
```

### 3. **AuthGuard Component** (`/apps/user/components/auth/AuthGuard.tsx`)
Integrated activity refresh for all protected routes.

```typescript
export default function AuthGuard({ children, fallback }: AuthGuardProps) {
    // Enable activity-based token refresh
    useActivityRefresh({
        enabled: true,
        refreshThreshold: 300,
        checkInterval: 60000,
    });
    
    // ... rest of auth checking logic
}
```

## 🔧 Configuration Options

### Hook Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable activity tracking |
| `refreshThreshold` | number | `300` | Seconds before expiry to trigger refresh |
| `checkInterval` | number | `60000` | Milliseconds between expiration checks |

### Example Configurations

#### Conservative (Refresh Earlier)
```typescript
useActivityRefresh({
    refreshThreshold: 600, // Refresh when < 10 minutes remaining
    checkInterval: 30000,  // Check every 30 seconds
});
```

#### Aggressive (Refresh Later)
```typescript
useActivityRefresh({
    refreshThreshold: 120, // Refresh when < 2 minutes remaining
    checkInterval: 120000, // Check every 2 minutes
});
```

#### Disabled (Manual Refresh Only)
```typescript
useActivityRefresh({
    enabled: false, // No automatic refresh
});
```

## 🔄 Refresh Flow Diagram

```
┌─────────────────────────────────────────────────┐
│  User Activity (mouse, keyboard, scroll, etc.)  │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  Update Last Activity Timestamp                  │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  Periodic Check (every 60 seconds)              │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  Get Token Expiration Time                      │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
         ┌────────────┴────────────┐
         │                          │
         ▼                          ▼
   Expires in                 Expires in
   > 5 minutes               < 5 minutes
         │                          │
         ▼                          ▼
   Do Nothing              Was user active
                           in last 2 minutes?
                                   │
                      ┌────────────┴────────────┐
                      │                          │
                      ▼                          ▼
                    Yes                         No
                      │                          │
                      ▼                          ▼
              Call Refresh API              Do Nothing
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  Backend: Validate Refresh Token                │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  Backend: Generate New Access Token             │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  Frontend: Update localStorage with New Tokens  │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  Session Extended Successfully! ✅               │
└─────────────────────────────────────────────────┘
```

## 🧪 Testing

### Manual Testing

#### Test 1: Normal Activity Refresh
1. Login to dashboard
2. Open browser DevTools → Console
3. Wait 10 minutes (with occasional activity)
4. Watch for: `"Token expires in Xs, refreshing..."`
5. Then: `"Token refreshed successfully via activity tracking"`
6. ✅ No logout, session continues

#### Test 2: Inactive User (No Refresh)
1. Login to dashboard
2. Don't move mouse or interact for 15+ minutes
3. Token expires
4. Click any dashboard link
5. ✅ Redirect to login (as expected - user was inactive)

#### Test 3: Active User Session Extension
1. Login at 2:00 PM
2. Keep working (moving mouse, clicking, typing)
3. Work continuously until 2:30 PM (30 minutes)
4. ✅ Never logged out (token refreshed automatically)
5. Console shows multiple refresh logs

### Automated Testing

```typescript
// Test: getTokenExpirationTime
describe('getTokenExpirationTime', () => {
    it('should return seconds until expiration', () => {
        // Mock localStorage with valid token
        const mockToken = createMockJWT({ exp: Math.floor(Date.now() / 1000) + 300 });
        localStorage.setItem('authToken', mockToken);
        
        const timeLeft = getTokenExpirationTime();
        expect(timeLeft).toBeGreaterThan(295);
        expect(timeLeft).toBeLessThanOrEqual(300);
    });
});

// Test: refreshAuthToken
describe('refreshAuthToken', () => {
    it('should call refresh endpoint and update tokens', async () => {
        // Mock API response
        mockAxios.post.mockResolvedValue({
            data: {
                success: true,
                data: {
                    tokens: {
                        accessToken: 'new-token',
                        refreshToken: 'new-refresh-token'
                    }
                }
            }
        });
        
        const success = await refreshAuthToken();
        expect(success).toBe(true);
        expect(localStorage.getItem('authToken')).toBe('new-token');
    });
});
```

## 📊 Monitoring & Debugging

### Console Logs

The system logs important events:

```javascript
// Activity detected
"Token expires in 280s, refreshing..."

// Successful refresh
"Token refreshed successfully via activity tracking"

// Refresh failure
"Token refresh failed"

// Error handling
"Error during token refresh: [error details]"
```

### Check Token Status in Console

```javascript
// Check if token is about to expire
import { getTokenExpirationTime } from '@/utils/auth';
console.log('Time until expiry:', getTokenExpirationTime(), 'seconds');

// Check last activity timestamp
console.log('Last activity:', new Date(activityTimestampRef.current));

// Manually trigger refresh
import { refreshAuthToken } from '@/utils/auth';
refreshAuthToken().then(success => console.log('Refresh:', success));
```

### Disable for Testing

To test the old behavior (no auto-refresh):

```typescript
// In AuthGuard.tsx
useActivityRefresh({
    enabled: false, // Disable activity refresh
});
```

## ⚠️ Important Notes

### 1. **Refresh Token Expiration**
- Access token: 15 minutes
- Refresh token: 7 days
- After 7 days of inactivity, user must log in again
- Activity refresh extends access token only, not refresh token

### 2. **Activity Definition**
User is considered "active" if they:
- Moved mouse in last 2 minutes
- Pressed a key in last 2 minutes
- Clicked anywhere in last 2 minutes
- Scrolled the page in last 2 minutes
- Touched screen (mobile) in last 2 minutes

### 3. **Network Failures**
If refresh API call fails:
- Error logged to console
- User continues with existing token
- Next check (in 60s) will retry
- If token fully expires, user redirected to login

### 4. **Multiple Tabs**
Each tab has its own activity tracker:
- Active tab refreshes token
- Other tabs benefit from the new token (shared localStorage)
- All tabs stay authenticated as long as one is active

### 5. **Performance Impact**
- Minimal: Passive event listeners (no performance penalty)
- Check interval: Once per minute (very lightweight)
- Refresh API call: Only when needed (< 5 mins remaining + active user)

## 🚀 Production Considerations

### 1. **Remove Debug Logs**
```typescript
// In production, remove console.logs
if (process.env.NODE_ENV === 'development') {
    console.log('Token refreshed successfully');
}
```

### 2. **Error Handling**
Already implemented:
- Try-catch blocks
- Graceful fallbacks
- User remains authenticated on refresh failure until token fully expires

### 3. **Security**
- Refresh token stored in localStorage (consider httpOnly cookies for enhanced security)
- Tokens transmitted over HTTPS only
- Backend validates refresh tokens against database

### 4. **Monitoring**
Consider adding analytics:
```typescript
// Track refresh events
analytics.track('token_refresh', {
    timeUntilExpiry: getTokenExpirationTime(),
    wasActive: timeSinceActivity < 120000,
});
```

## 📈 Benefits

### User Experience
- ✅ No unexpected logouts during active sessions
- ✅ Seamless experience (silent background refresh)
- ✅ Can work for hours without re-authentication
- ✅ Only logs out truly inactive users

### Security
- ✅ Short-lived access tokens (15 minutes)
- ✅ Inactive users logged out automatically
- ✅ Refresh tokens validated server-side
- ✅ Session invalidation on suspicious activity

### Performance
- ✅ Lightweight passive listeners
- ✅ Efficient 60-second check interval
- ✅ Debounced refresh requests
- ✅ No impact on page load or rendering

## 🔮 Future Enhancements

### 1. **Idle Detection Warning**
Warn user before logging out:
```typescript
// Show modal at 13 minutes of inactivity
if (timeSinceActivity > 780000) {
    showIdleWarning(); // "You'll be logged out in 2 minutes"
}
```

### 2. **Smart Refresh Scheduling**
Refresh at optimal times:
```typescript
// Refresh during idle moments (no active API calls)
if (!isApiCallInProgress && tokenExpiringsoon) {
    refreshToken();
}
```

### 3. **Cross-Tab Coordination**
Coordinate refresh across tabs:
```typescript
// Use BroadcastChannel API
const channel = new BroadcastChannel('auth');
channel.postMessage({ type: 'token_refreshed', newToken });
```

### 4. **Refresh Token Rotation**
Backend improvement:
- Issue new refresh token on each refresh
- Invalidate old refresh token
- Prevents refresh token reuse attacks

## 📝 Summary

**Activity-based token refresh is now enabled!**

Your users can now:
- ✅ Work for hours without interruption
- ✅ Never see unexpected "session expired" messages
- ✅ Only log in once per day (or longer if active)
- ✅ Enjoy seamless authentication experience

**The system automatically:**
- ✅ Tracks user activity in real-time
- ✅ Refreshes tokens before they expire
- ✅ Extends sessions for active users
- ✅ Logs out inactive users for security

**Test it now:** Login and work for 20+ minutes - you'll never be logged out! 🎉
