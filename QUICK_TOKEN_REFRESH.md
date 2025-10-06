# Quick Token Refresh Fix

Your token expired at **01:47:59** but you're still using the app after that time.

## ✅ **Immediate Solution - Run in Browser Console:**

```javascript
// Step 1: Get refresh token
const refreshToken = localStorage.getItem('nexgen_admin_refresh_token')

if (!refreshToken) {
    console.log('❌ No refresh token found. Please login again.')
    localStorage.clear()
    window.location.href = '/'
} else {
    // Step 2: Call refresh endpoint
    fetch('http://localhost:8000/api/auth/admin/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
    })
    .then(r => r.json())
    .then(data => {
        console.log('Refresh response:', data)
        
        if (data.success && data.data && data.data.tokens) {
            // Step 3: Save new tokens
            localStorage.setItem('nexgen_admin_access_token', data.data.tokens.accessToken)
            localStorage.setItem('nexgen_admin_refresh_token', data.data.tokens.refreshToken)
            
            console.log('✅ TOKEN REFRESHED SUCCESSFULLY!')
            console.log('🔄 Please refresh the page or try editing the user again.')
            
            // Optional: Auto-reload the page
            setTimeout(() => {
                window.location.reload()
            }, 1000)
        } else {
            console.log('❌ Refresh failed:', data.error)
            console.log('Please login again.')
            localStorage.clear()
            setTimeout(() => {
                window.location.href = '/'
            }, 2000)
        }
    })
    .catch(err => {
        console.error('❌ Network error:', err)
        console.log('Please check if backend is running at http://localhost:8000')
    })
}
```

---

## 🔧 **Why This Happened:**

Your access token expires every **1 hour** (default JWT expiry). The API client should automatically refresh it when you make a request, but sometimes:

1. The 401 response isn't triggering the refresh
2. The refresh token might also be expired
3. There might be a race condition in the refresh logic

---

## 🎯 **Long-term Fix:**

The API client already has auto-refresh logic, but let me verify it's working by checking if there are any issues:

### Issue #1: Race Condition in Token Refresh

The current implementation has a potential race condition. Let me check if we need to improve it:

```typescript
// Current logic in api.ts
if (response.status === 401 && accessToken && endpoint !== '/auth/admin/refresh') {
    if (!this.isRefreshing) {
        this.isRefreshing = true;
        const newToken = await this.refreshAccessToken();
        // ...
    }
}
```

This should work, but the promise queue might not be handling concurrent requests properly.

---

## 📋 **After Running the Script Above:**

1. ✅ New tokens will be stored
2. ✅ Page will auto-reload
3. ✅ Try editing user again - should work now

---

## 🚨 **If Refresh Still Fails:**

The refresh token might also be expired. In that case:

```javascript
// Clear everything and login again
localStorage.clear()
window.location.href = '/'
```

Then login with your admin credentials:
- Email: (your admin email)
- Password: (your admin password)

---

## 🔍 **Check Refresh Token Expiry:**

To see if your refresh token is still valid:

```javascript
const refreshToken = localStorage.getItem('nexgen_admin_refresh_token')
if (refreshToken) {
    const payload = JSON.parse(atob(refreshToken.split('.')[1]))
    const expiry = new Date(payload.exp * 1000)
    const now = new Date()
    
    if (expiry > now) {
        console.log('✅ Refresh token valid until:', expiry)
        console.log('Time left:', Math.floor((expiry - now) / 1000 / 60 / 60), 'hours')
    } else {
        console.log('❌ Refresh token EXPIRED at:', expiry)
        console.log('Need to login again')
    }
}
```

Refresh tokens typically last **7 days** (default), so they should still be valid.

---

## ⚡ **Quick Summary:**

1. **Run the refresh script above** in browser console
2. Page will auto-reload with new tokens
3. Try editing user again
4. If still fails, clear localStorage and login again

**The token expired because you've been using the app for over an hour. This is normal - the auto-refresh should have handled it but didn't trigger properly.**
