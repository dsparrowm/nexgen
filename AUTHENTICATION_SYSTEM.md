# Authentication System Documentation

## Overview
Complete authentication protection system for the NexGen application with JWT token validation, automatic redirects, and session expiration handling.

## Features
- ✅ JWT-based authentication with access and refresh tokens
- ✅ Protected dashboard routes with automatic redirect to login
- ✅ Session expiration detection with user-friendly messaging
- ✅ Return URL preservation (users redirected back after login)
- ✅ Token validation with 5-second buffer to prevent race conditions
- ✅ Loading states during authentication verification
- ✅ Secure localStorage token storage

## Architecture

### Authentication Flow

#### New User Registration
1. User fills signup form at `/signup`
2. Backend creates user with `isEmailVerified: false`
3. Backend generates 6-digit verification code
4. Verification email sent to user
5. User redirected to `/verification?email=user@example.com`

#### Email Verification
1. User enters 6-digit code
2. Frontend sends code to `POST /api/auth/verify-email`
3. Backend validates code and marks email as verified
4. Backend sends welcome email
5. User redirected to `/verification/success`
6. User clicks "Login" button

#### Login
1. User enters credentials at `/login`
2. Backend validates and returns:
   ```json
   {
     "success": true,
     "data": {
       "tokens": {
         "accessToken": "jwt-token",
         "refreshToken": "refresh-token"
       },
       "user": {
         "id": "user-id",
         "email": "user@example.com",
         "firstName": "John",
         ...
       }
     }
   }
   ```
3. Frontend stores tokens using `saveAuthData()` utility
4. User redirected to intended page (or `/dashboard` default)

#### Protected Route Access
1. User navigates to protected route (e.g., `/dashboard/mining`)
2. `AuthGuard` component checks authentication:
   - Calls `isAuthenticated()` to verify token exists
   - Calls `isTokenExpired()` to validate token expiration
3. If authenticated: Page renders normally
4. If token expired: Redirect to `/login?redirect=/dashboard/mining&expired=true`
5. If not authenticated: Redirect to `/login?redirect=/dashboard/mining`

#### Session Expired Flow
1. User lands on login with `expired=true` parameter
2. Toast message shown: "Your session has expired. Please log in again."
3. After successful login, user redirected back to original page

## Components

### AuthGuard Component
**Location:** `/apps/user/components/auth/AuthGuard.tsx`

Wrapper component that protects routes requiring authentication.

**Usage:**
```tsx
import AuthGuard from '@/components/auth/AuthGuard';

export default function ProtectedPage() {
  return (
    <AuthGuard>
      {/* Your protected content here */}
    </AuthGuard>
  );
}
```

**Features:**
- Checks authentication on component mount
- Shows loading spinner during verification
- Redirects unauthenticated users to login
- Preserves intended destination URL
- Detects expired tokens and adds `expired=true` parameter

**Implementation:**
```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, isTokenExpired } from '@/utils/auth';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            if (!isAuthenticated()) {
                router.push(`/login?redirect=${pathname}`);
                return;
            }

            if (isTokenExpired()) {
                router.push(`/login?redirect=${pathname}&expired=true`);
                return;
            }

            setIsLoading(false);
        };

        checkAuth();
    }, [router, pathname]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto"></div>
                    <p className="mt-4 text-gray-400">Verifying authentication...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
```

## Utility Functions

### Authentication Utilities
**Location:** `/apps/user/utils/auth.ts`

#### `isAuthenticated(): boolean`
Checks if user has a valid auth token in localStorage.

```typescript
export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('authToken');
    return !!token;
};
```

#### `isTokenExpired(): boolean`
Decodes JWT token and checks expiration time.

```typescript
export const isTokenExpired = (): boolean => {
    const token = getToken();
    if (!token) return true;

    try {
        // Decode JWT payload
        const parts = token.split('.');
        if (parts.length !== 3) return true;
        
        const base64Url = parts[1];
        if (!base64Url) return true;
        
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        const payload = JSON.parse(jsonPayload);
        
        if (!payload.exp) return false;

        // Check expiration with 5-second buffer
        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp < currentTime + 5;
    } catch (error) {
        return true;
    }
};
```

#### `getToken(): string | null`
Retrieves auth token from localStorage.

```typescript
export const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
};
```

#### `getRefreshToken(): string | null`
Retrieves refresh token from localStorage.

```typescript
export const getRefreshToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
};
```

#### `getUser(): any | null`
Retrieves user object from localStorage.

```typescript
export const getUser = (): any | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
};
```

#### `saveAuthData(accessToken, refreshToken, user): void`
Stores authentication data in localStorage.

```typescript
export const saveAuthData = (
    accessToken: string, 
    refreshToken: string, 
    user: any
): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('authToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
};
```

#### `logout(): void`
Clears all authentication data and redirects to login.

```typescript
export const logout = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
};
```

## Protected Routes

All dashboard routes are protected with `AuthGuard`:

1. **Dashboard Home** - `/dashboard`
2. **Mining** - `/dashboard/mining`
3. **Investments** - `/dashboard/investments`
4. **Transactions** - `/dashboard/transactions`
5. **Settings** - `/dashboard/settings`

### Example Protected Page

```tsx
import AuthGuard from '@/components/auth/AuthGuard';
import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function MiningPage() {
    return (
        <AuthGuard>
            <DashboardLayout>
                {/* Your page content */}
            </DashboardLayout>
        </AuthGuard>
    );
}
```

## Login Page Enhancements

### Redirect Parameter Handling
The login page now handles query parameters:

- `?redirect=/path` - Redirects user to this path after successful login
- `?expired=true` - Shows "Session expired" message

**Implementation:**
```tsx
const Login = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Get redirect URL and expired status
    const redirect = searchParams.get('redirect') || '/dashboard';
    const isExpired = searchParams.get('expired') === 'true';

    // Show session expired message on mount
    useEffect(() => {
        if (isExpired) {
            toast.error('Your session has expired. Please log in again.');
        }
    }, [isExpired]);

    const handleSubmit = async (e: React.FormEvent) => {
        // ... login logic
        
        if (response.data.success) {
            // Store tokens
            saveAuthData(
                response.data.data.tokens.accessToken,
                response.data.data.tokens.refreshToken,
                response.data.data.user
            );
            
            // Validate redirect URL is internal (security)
            const redirectUrl = redirect.startsWith('/') ? redirect : '/dashboard';
            router.push(redirectUrl);
        }
    };
};
```

## Security Features

### Token Expiration Buffer
5-second buffer prevents race conditions when token expires during page load:

```typescript
const currentTime = Math.floor(Date.now() / 1000);
return payload.exp < currentTime + 5; // 5 second buffer
```

### Open Redirect Prevention
Login page validates redirect URLs must be internal:

```typescript
const redirectUrl = redirect.startsWith('/') ? redirect : '/dashboard';
router.push(redirectUrl);
```

### Server-Side Rendering Safe
All localStorage operations check for window object:

```typescript
if (typeof window === 'undefined') return null;
```

## Token Storage

Authentication data stored in localStorage:

| Key | Value | Purpose |
|-----|-------|---------|
| `authToken` | JWT access token | Used for API authentication |
| `refreshToken` | Refresh token | Used to obtain new access token |
| `user` | JSON user object | Cached user information |

**Token Format:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJleHAiOjE3MDk0ODAwMDB9.signature
```

**Payload Example:**
```json
{
  "userId": "user-id-here",
  "email": "user@example.com",
  "exp": 1709480000,  // Unix timestamp
  "iat": 1709479100
}
```

## API Integration

### Axios Interceptor
**Location:** `/apps/user/lib/axiosInstance.ts`

Should include token in request headers:

```typescript
axiosInstance.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

### Response Interceptor (Future Enhancement)
Automatically refresh expired tokens:

```typescript
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired, try refresh
            const refreshToken = getRefreshToken();
            if (refreshToken) {
                // Call refresh endpoint
                // Update tokens
                // Retry original request
            } else {
                logout();
            }
        }
        return Promise.reject(error);
    }
);
```

## Testing

### Manual Testing Checklist

#### Test 1: Access Protected Route Without Login
1. Open browser in incognito mode
2. Navigate to `http://localhost:3000/dashboard`
3. ✅ Should redirect to `/login?redirect=/dashboard`

#### Test 2: Login and Redirect
1. At login page with redirect parameter
2. Enter valid credentials and submit
3. ✅ Should redirect to dashboard after successful login

#### Test 3: Session Expiration
1. Login successfully
2. Manually expire token (wait 15 minutes or modify localStorage)
3. Try to access `/dashboard/mining`
4. ✅ Should redirect to `/login?redirect=/dashboard/mining&expired=true`
5. ✅ Should show "Session expired" toast message

#### Test 4: Protected Pages
Test each protected route:
- `/dashboard` ✅
- `/dashboard/mining` ✅
- `/dashboard/investments` ✅
- `/dashboard/transactions` ✅
- `/dashboard/settings` ✅

Each should:
- Show loading spinner briefly
- Redirect to login if not authenticated
- Render content if authenticated

#### Test 5: Logout
1. Login successfully
2. Navigate to dashboard
3. Click logout
4. ✅ Should clear localStorage
5. ✅ Should redirect to login page
6. ✅ Dashboard should be inaccessible

## Future Enhancements

### 1. Token Refresh Mechanism
Automatically refresh tokens before expiration:
```typescript
// In AuthGuard or App wrapper
useEffect(() => {
    const checkTokenRefresh = setInterval(() => {
        if (isTokenExpired()) {
            refreshAccessToken();
        }
    }, 60000); // Check every minute
    
    return () => clearInterval(checkTokenRefresh);
}, []);
```

### 2. Remember Me Functionality
Store refresh token in secure cookie:
```typescript
const handleLogin = async (rememberMe: boolean) => {
    // ... login logic
    if (rememberMe) {
        // Store refresh token in secure HTTP-only cookie
        document.cookie = `refreshToken=${refreshToken}; secure; httponly; max-age=604800`;
    }
};
```

### 3. Middleware Protection
Add Next.js middleware for additional security:

**File:** `/apps/user/middleware.ts`
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('authToken');
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard');
    
    if (isProtectedRoute && !token) {
        return NextResponse.redirect(
            new URL(`/login?redirect=${request.nextUrl.pathname}`, request.url)
        );
    }
    
    return NextResponse.next();
}

export const config = {
    matcher: '/dashboard/:path*',
};
```

### 4. Role-Based Access Control
Extend AuthGuard for role-based protection:
```typescript
interface AuthGuardProps {
    children: React.ReactNode;
    requiredRole?: 'admin' | 'user' | 'moderator';
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
    const user = getUser();
    
    // Check role
    if (requiredRole && user?.role !== requiredRole) {
        router.push('/unauthorized');
        return null;
    }
    
    // ... existing auth checks
}
```

### 5. Session Activity Tracking
Track user activity and extend session:
```typescript
useEffect(() => {
    const activity = () => {
        // Update last activity timestamp
        localStorage.setItem('lastActivity', Date.now().toString());
    };
    
    window.addEventListener('mousemove', activity);
    window.addEventListener('keypress', activity);
    
    return () => {
        window.removeEventListener('mousemove', activity);
        window.removeEventListener('keypress', activity);
    };
}, []);
```

## Troubleshooting

### Issue: Infinite Redirect Loop
**Symptom:** Page keeps redirecting between login and dashboard

**Solution:**
1. Check if `isAuthenticated()` correctly reads localStorage
2. Verify token format is valid JWT
3. Check for typos in localStorage key names

### Issue: "Session Expired" Message on Every Login
**Symptom:** Expired toast shows even with fresh login

**Solution:**
1. Clear localStorage completely
2. Check token expiration time in JWT payload
3. Verify server clock is synchronized

### Issue: Protected Page Briefly Visible Before Redirect
**Symptom:** Flash of protected content before redirect

**Solution:**
- This is expected behavior with client-side protection
- Add loading state to prevent flash
- Consider server-side protection with middleware

### Issue: localStorage Not Working
**Symptom:** Tokens not persisting

**Solution:**
1. Check browser settings allow localStorage
2. Verify not in private/incognito mode with strict settings
3. Check for browser extensions blocking storage

## Summary

The authentication system provides:
- ✅ Complete JWT-based authentication
- ✅ Protected routes with automatic redirects
- ✅ Session expiration handling
- ✅ User-friendly error messages
- ✅ Return URL preservation
- ✅ Security best practices (open redirect prevention, token validation)
- ✅ Loading states for better UX
- ✅ Reusable components and utilities

All dashboard routes are now secure and only accessible to authenticated users with valid tokens.
