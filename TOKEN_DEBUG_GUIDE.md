# Admin Token Authentication Debug Guide

**Issue**: Getting `"Invalid or expired token"` error when trying to edit users.

---

## 🔍 Troubleshooting Steps

### Step 1: Check if Token Exists

Open browser console on the admin app and run:
```javascript
// Check if tokens exist
console.log('Access Token:', localStorage.getItem('nexgen_admin_access_token'))
console.log('Refresh Token:', localStorage.getItem('nexgen_admin_refresh_token'))
console.log('Admin User:', localStorage.getItem('nexgen_admin_user'))
```

**Expected**: Should see token strings

**If null**: Admin is not logged in - need to login first

---

### Step 2: Decode the Access Token

```javascript
// Decode token to see its contents
const token = localStorage.getItem('nexgen_admin_access_token')
if (token) {
    const payload = JSON.parse(atob(token.split('.')[1]))
    console.log('Token Payload:', payload)
    console.log('Token Type:', payload.type)
    console.log('Token Audience:', payload.aud)
    console.log('Token Role:', payload.role)
    console.log('Token Expiry:', new Date(payload.exp * 1000))
}
```

**Expected Output**:
```json
{
  "userId": "cm...",
  "email": "admin@example.com",
  "role": "ADMIN" or "SUPER_ADMIN",
  "type": "admin",
  "aud": "admin-app",
  "iss": "nexgen-backend",
  "exp": 1728123456,
  "iat": 1728119856
}
```

**Common Issues**:
- ❌ `type: "user"` instead of `"admin"` → Logged in with user credentials
- ❌ `aud: "user-app"` instead of `"admin-app"` → Wrong audience
- ❌ `role: "USER"` → Not an admin account
- ❌ Expiry date in the past → Token expired

---

### Step 3: Check Token Expiry

```javascript
const token = localStorage.getItem('nexgen_admin_access_token')
if (token) {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const now = Date.now() / 1000
    const timeLeft = payload.exp - now
    
    if (timeLeft < 0) {
        console.log('❌ Token EXPIRED', Math.abs(timeLeft / 60), 'minutes ago')
    } else {
        console.log('✅ Token valid for', (timeLeft / 60).toFixed(1), 'more minutes')
    }
}
```

---

### Step 4: Test API Call Manually

```javascript
// Test API call with current token
const token = localStorage.getItem('nexgen_admin_access_token')

fetch('http://localhost:8000/api/admin/users?limit=1', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
})
.then(r => r.json())
.then(data => console.log('API Response:', data))
.catch(err => console.error('API Error:', err))
```

**Expected**: Should return user list
**If fails**: Check the error message

---

## 🔧 Common Fixes

### Fix 1: Token Expired - Force Re-login

```javascript
// Clear all auth data and reload
localStorage.removeItem('nexgen_admin_access_token')
localStorage.removeItem('nexgen_admin_refresh_token')
localStorage.removeItem('nexgen_admin_user')
window.location.href = '/'
```

Then login again with admin credentials.

---

### Fix 2: Wrong Token Type (User token instead of Admin)

**Symptoms**:
- Token has `type: "user"` or `aud: "user-app"`
- Token role is "USER"

**Solution**:
1. Logout from admin app
2. Make sure you're logging in at `/` (admin login page)
3. Use admin credentials (not regular user credentials)
4. Check that login endpoint is `POST /api/auth/admin/login`

---

### Fix 3: Backend JWT Secret Mismatch

Check backend environment variables:
```bash
# In backend .env
ADMIN_JWT_SECRET=your-admin-secret-here
USER_JWT_SECRET=your-user-secret-here
```

These must match what was used to generate the tokens.

---

### Fix 4: Token Refresh Not Working

Test refresh token manually:
```javascript
const refreshToken = localStorage.getItem('nexgen_admin_refresh_token')

fetch('http://localhost:8000/api/auth/admin/refresh', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken })
})
.then(r => r.json())
.then(data => {
    console.log('Refresh Response:', data)
    if (data.success) {
        console.log('✅ Refresh works! New tokens received.')
        localStorage.setItem('nexgen_admin_access_token', data.data.tokens.accessToken)
        localStorage.setItem('nexgen_admin_refresh_token', data.data.tokens.refreshToken)
    }
})
```

---

## 🎯 Quick Resolution

### Most Likely Issue: Token Expired

**Quick Fix**:
1. Open browser console
2. Run: `localStorage.clear()`
3. Refresh page
4. Login again with admin credentials

---

## 🔍 Backend Verification

### Check if user is actually an admin:

```sql
-- Connect to database
SELECT id, email, username, role, "isActive" 
FROM "User" 
WHERE role IN ('ADMIN', 'SUPER_ADMIN');
```

### Check admin login endpoint:

```bash
# Test admin login
curl -X POST http://localhost:8000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-password"
  }'
```

Should return:
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": "...",
      "email": "admin@example.com",
      "role": "ADMIN"
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    }
  }
}
```

---

## 📋 Validation Checklist

Before editing users, verify:

- [ ] Logged in as admin (not regular user)
- [ ] Token type is "admin"
- [ ] Token audience is "admin-app"
- [ ] Token role is "ADMIN" or "SUPER_ADMIN"
- [ ] Token is not expired
- [ ] Backend is running
- [ ] Backend admin routes are working

---

## 🚨 If Still Not Working

1. **Check backend logs** for detailed error:
   ```bash
   tail -f apps/backend/logs/error.log
   ```

2. **Check network tab** in browser DevTools:
   - Request URL should be `/api/admin/users/:id`
   - Authorization header should be present
   - Response should show specific error

3. **Verify admin authentication middleware** is not rejecting valid tokens

4. **Check if CUID validation fix was applied** (from previous bug fix)

---

## ✅ Expected Working Flow

1. Admin logs in at `/` → Gets admin tokens
2. Token stored in localStorage
3. Every API call includes `Authorization: Bearer <token>`
4. Backend verifies token with admin JWT secret
5. Backend checks token.type === 'admin'
6. Backend checks token.aud === 'admin-app'
7. Backend checks token role is ADMIN/SUPER_ADMIN
8. Request succeeds

---

## 🔑 Key Files to Check

**Frontend**:
- `/apps/admin/lib/api.ts` - Token management
- `/apps/admin/contexts/AuthContext.tsx` - Auth state

**Backend**:
- `/apps/backend/src/middlewares/auth.ts` - Token verification
- `/apps/backend/src/utils/jwt.ts` - Token generation/validation
- `/apps/backend/src/controllers/auth/admin-auth.controller.ts` - Admin login

---

**Most common solution**: Clear localStorage and login again! 🎯
