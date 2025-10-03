# Settings Page - Integration TODO

**Page:** `/dashboard/settings`  
**Component:** `Settings.tsx`  
**Last Updated:** October 3, 2025

---

## 📋 Current State Analysis

### Frontend Component Analysis
The `Settings.tsx` component currently shows:
- **Hardcoded User Data:** Name and email are static mock values ("John Doe", "john.doe@example.com")
- **Non-Functional Forms:** Profile update form doesn't connect to backend
- **Static Theme Selector:** Theme dropdown doesn't actually change theme
- **Static Notification Toggle:** Toggle doesn't save to backend
- **Static Security Section:** Change password and 2FA buttons are non-functional
- **Mock Account Status:** Member since, subscription plan, account status all hardcoded
- **No Actual Save:** Save button only console.logs, doesn't call API

### Backend API Analysis
**Available Endpoints:**

1. **PUT `/api/user/profile/profile`** - Update user profile
   - Body: `firstName`, `lastName`, `phoneNumber`, `country`, `state`, `city`, `address`, `zipCode`, `dateOfBirth`
   - Returns: Updated user object with all profile fields
   - Validation included

2. **PUT `/api/user/profile/password`** - Change password
   - Body: `currentPassword`, `newPassword`, `confirmPassword`
   - Validates current password
   - Hashes new password
   - Returns success message

3. **POST `/api/user/profile/kyc/upload`** - Upload KYC document
   - Multipart form data with file upload
   - Accepts: images and PDFs (max 5MB)
   - Body: `document` (file), `type` (document type)
   - Stores files in `uploads/kyc/` directory
   - Returns document details

4. **GET `/api/user/profile/kyc/documents`** - Get user's KYC documents
   - Returns: Array of uploaded documents with status
   - Document statuses: PENDING, APPROVED, REJECTED

5. **GET `/api/user/profile/dashboard`** - Get dashboard data (includes user profile)
   - Returns: Full user profile with stats

6. **GET `/api/user/notifications`** - Get user notifications
   - Query params: `page`, `limit`
   - Returns: Notifications with pagination

7. **GET `/api/user/notifications/stats`** - Notification statistics
   - Returns: Unread count, total notifications

8. **PUT `/api/user/notifications/:id/read`** - Mark notification as read

9. **PUT `/api/user/notifications/read-all`** - Mark all notifications as read

10. **DELETE `/api/user/notifications/:id`** - Delete notification

### User Model Fields (from Prisma Schema)
**Profile Fields:**
- `firstName`, `lastName`, `email`, `username`
- `phoneNumber`, `country`, `state`, `city`, `address`, `zipCode`
- `dateOfBirth`, `profileImage`
- `kycStatus` (PENDING, APPROVED, REJECTED, UNDER_REVIEW)
- `balance`, `totalInvested`, `totalEarnings`
- `referralCode`
- `createdAt` (member since)

**Security Fields:**
- `password` (hashed)
- `twoFactorSecret`, `twoFactorEnabled`
- `isVerified`, `isEmailVerified`

**Status Fields:**
- `isActive`, `role` (USER, ADMIN)

### KYC Document Types (Need to verify with backend)
- ID Card / Passport
- Proof of Address
- Selfie with ID
- Other documents

---

## 🎯 Integration Tasks

### **HIGH PRIORITY** 🔴

#### 1. Fetch User Profile Data
**Status:** ⏳ Not Started  
**Estimated Time:** 2 hours

**Requirements:**
- [ ] Fetch user profile on component mount from `/api/user/profile/dashboard`
- [ ] Extract user data from response
- [ ] Pre-fill all form fields with user data
- [ ] Display user's email, name, phone, address, etc.
- [ ] Show profile image/avatar if available
- [ ] Handle loading state while fetching

**Implementation:**
```typescript
useEffect(() => {
  const fetchUserProfile = async () => {
    const response = await fetch('/api/user/profile/dashboard');
    const data = await response.json();
    // Populate form fields
    setFirstName(data.user.firstName || '');
    setLastName(data.user.lastName || '');
    setEmail(data.user.email);
    // ... other fields
  };
  fetchUserProfile();
}, []);
```

**Files to Modify:**
- `/apps/user/app/dashboard/components/Settings.tsx`

**Files to Create:**
- `/apps/user/hooks/useUserProfile.ts`
- `/apps/user/utils/api/profileApi.ts`

---

#### 2. Update Profile Functionality
**Status:** ⏳ Not Started  
**Estimated Time:** 3-4 hours

**Requirements:**
- [ ] Connect "Save Changes" button to backend API
- [ ] Call `PUT /api/user/profile/profile` with form data
- [ ] Include all profile fields: firstName, lastName, phoneNumber, country, state, city, address, zipCode, dateOfBirth
- [ ] Show loading state during save
- [ ] Display success message on successful update
- [ ] Handle errors gracefully
- [ ] Update local state with new data after save
- [ ] Validate required fields before submission
- [ ] Add form dirty state (only enable save if changes made)

**Profile Fields:**
- Full Name (split into firstName, lastName)
- Email (read-only, cannot be changed)
- Phone Number
- Date of Birth (date picker)
- Country (dropdown with country list)
- State/Province
- City
- Address
- Zip/Postal Code

**Files to Modify:**
- `/apps/user/app/dashboard/components/Settings.tsx`

**Files to Create:**
- `/apps/user/components/forms/ProfileUpdateForm.tsx`
- `/apps/user/utils/validators/profileValidators.ts`
- `/apps/user/constants/countries.ts`

---

#### 3. Change Password Modal/Section
**Status:** ⏳ Not Started  
**Estimated Time:** 3-4 hours

**Requirements:**
- [ ] Create change password modal or expand section
- [ ] Form fields: Current Password, New Password, Confirm New Password
- [ ] Client-side validation:
  - Current password required
  - New password minimum 8 characters
  - Must contain uppercase, lowercase, number, special char
  - Confirm password must match new password
  - New password cannot be same as current
- [ ] Call `PUT /api/user/profile/password` API
- [ ] Show password strength indicator
- [ ] Toggle password visibility (eye icon)
- [ ] Show success message and auto-close modal
- [ ] Handle API errors (wrong current password, etc.)
- [ ] Clear form after successful change

**Implementation:**
```typescript
const handleChangePassword = async (data) => {
  const response = await fetch('/api/user/profile/password', {
    method: 'PUT',
    body: JSON.stringify({
      currentPassword: data.current,
      newPassword: data.new,
      confirmPassword: data.confirm
    })
  });
  // Handle response
};
```

**Files to Create:**
- `/apps/user/app/dashboard/components/ChangePasswordModal.tsx`
- `/apps/user/components/common/PasswordInput.tsx` (with visibility toggle)
- `/apps/user/components/common/PasswordStrengthMeter.tsx`
- `/apps/user/utils/validators/passwordValidators.ts`

---

#### 4. Profile Image Upload
**Status:** ⏳ Not Started  
**Estimated Time:** 3-4 hours

**Requirements:**
- [ ] Add profile image/avatar section
- [ ] Display current profile image or default avatar
- [ ] Add "Change Photo" button
- [ ] File upload with preview
- [ ] Accept only image files (jpg, png, gif, webp)
- [ ] Max file size: 2MB
- [ ] Crop/resize functionality (optional but recommended)
- [ ] Upload to backend (**VERIFY: Does backend support profile image upload?**)
- [ ] Update `profileImage` field in user model
- [ ] Show upload progress
- [ ] Handle upload errors

**Backend Verification Needed:**
- Is there a profile image upload endpoint?
- Or should we use the KYC upload endpoint for this?
- Where are profile images stored?

**Files to Create:**
- `/apps/user/app/dashboard/components/ProfileImageUpload.tsx`
- `/apps/user/components/common/ImageCropper.tsx` (optional)
- `/apps/user/utils/imageUtils.ts`

---

#### 5. KYC Document Upload & Management
**Status:** ⏳ Not Started  
**Estimated Time:** 4-5 hours

**Requirements:**
- [ ] Create KYC/Verification section
- [ ] Display current KYC status badge (Pending, Approved, Rejected, Under Review)
- [ ] Fetch existing documents from `/api/user/profile/kyc/documents`
- [ ] Show list of uploaded documents with:
  - Document type
  - Upload date
  - File name
  - Status (with colored badge)
  - Rejection reason (if rejected)
  - Delete option (if not approved)
- [ ] Add "Upload Document" button/section
- [ ] Document type selector:
  - ID Card / Passport
  - Proof of Address
  - Selfie with ID
  - Bank Statement
  - Other
- [ ] File upload with drag-and-drop
- [ ] Accept images (jpg, png, pdf) max 5MB
- [ ] Preview before upload
- [ ] Call `POST /api/user/profile/kyc/upload`
- [ ] Show upload progress
- [ ] Refresh document list after upload
- [ ] Display verification instructions

**Backend Endpoints:**
```typescript
POST /api/user/profile/kyc/upload
- Body: FormData with 'document' file and 'type' string
- Returns: Document object with id, status, etc.

GET /api/user/profile/kyc/documents
- Returns: Array of user's KYC documents
```

**Files to Create:**
- `/apps/user/app/dashboard/components/KycSection.tsx`
- `/apps/user/app/dashboard/components/KycDocumentUpload.tsx`
- `/apps/user/app/dashboard/components/KycDocumentList.tsx`
- `/apps/user/app/dashboard/components/KycStatusBadge.tsx`
- `/apps/user/utils/api/kycApi.ts`

---

#### 6. Notification Preferences
**Status:** ⏳ Not Started  
**Estimated Time:** 3-4 hours

**Requirements:**
- [ ] Expand notification preferences section
- [ ] Fetch current notification settings (**VERIFY: Does backend store preferences?**)
- [ ] Toggle options for:
  - Email notifications (general)
  - Mining operation alerts
  - Investment updates
  - Transaction notifications
  - Security alerts
  - Marketing emails
  - Weekly summary
- [ ] Save preferences to backend (**VERIFY: Is there a preferences endpoint?**)
- [ ] Show notification history/inbox
- [ ] Link to full notifications page (if exists)
- [ ] Show unread notification count

**Backend Verification Needed:**
- Is there a user preferences/settings table in database?
- How are notification preferences stored?
- Is there an endpoint to update preferences?
- Or should we create one?

**Files to Create:**
- `/apps/user/app/dashboard/components/NotificationPreferences.tsx`
- `/apps/user/utils/api/preferencesApi.ts`

---

#### 7. Two-Factor Authentication (2FA) Setup
**Status:** ⏳ Not Started  
**Estimated Time:** 5-6 hours

**Requirements:**
- [ ] Check if 2FA is enabled (`twoFactorEnabled` field)
- [ ] Display current 2FA status
- [ ] **If 2FA Disabled:** Show "Enable 2FA" button
- [ ] **Enable 2FA Flow:**
  - Call backend to generate 2FA secret (**VERIFY: endpoint needed**)
  - Display QR code for authenticator app
  - Show manual entry code
  - Ask user to enter verification code from app
  - Verify code with backend
  - Enable 2FA on success
  - Show recovery codes (generate and download)
- [ ] **If 2FA Enabled:** Show "Disable 2FA" button
- [ ] **Disable 2FA Flow:**
  - Require password confirmation
  - Ask for 2FA code verification
  - Call backend to disable
  - Show confirmation
- [ ] Instructions for popular 2FA apps (Google Authenticator, Authy, etc.)
- [ ] Backup codes generation and management

**Backend Implementation Needed:**
- `POST /api/user/security/2fa/enable` - Generate secret, return QR code
- `POST /api/user/security/2fa/verify` - Verify code and enable 2FA
- `POST /api/user/security/2fa/disable` - Disable 2FA
- `GET /api/user/security/2fa/backup-codes` - Get backup codes
- Update login flow to check 2FA and require code

**Libraries Needed:**
- `speakeasy` or `otpauth` - Generate TOTP secrets
- `qrcode` - Generate QR codes

**Files to Create:**
- `/apps/user/app/dashboard/components/TwoFactorSetup.tsx`
- `/apps/user/app/dashboard/components/TwoFactorQRCode.tsx`
- `/apps/user/app/dashboard/components/TwoFactorBackupCodes.tsx`
- `/apps/user/utils/api/securityApi.ts`

**⚠️ IMPORTANT:** 2FA requires significant backend work. Prioritize based on security requirements.

---

#### 8. Account Information Display
**Status:** ⏳ Not Started  
**Estimated Time:** 2 hours

**Requirements:**
- [ ] Replace mock "Account Status" section with real data
- [ ] Display:
  - Member Since (from `createdAt` field)
  - Account Status (Active/Inactive from `isActive`)
  - Email Verification Status (from `isEmailVerified`)
  - KYC Status (from `kycStatus`)
  - Account Type/Role (from `role` - User/Premium/Admin)
  - Referral Code (from `referralCode`)
  - Total Invested (from `totalInvested`)
  - Total Earnings (from `totalEarnings`)
  - Current Balance (from `balance`)
- [ ] Format currency and dates properly
- [ ] Add copy-to-clipboard for referral code
- [ ] Show appropriate status badges with colors

**Files to Modify:**
- `/apps/user/app/dashboard/components/Settings.tsx`

**Files to Create:**
- `/apps/user/components/common/CopyToClipboard.tsx`

---

#### 9. Loading States
**Status:** ⏳ Not Started  
**Estimated Time:** 2 hours

**Requirements:**
- [ ] Skeleton loader for entire settings page
- [ ] Loading state for profile data fetch
- [ ] Loading spinner on "Save Changes" button
- [ ] Loading state for password change
- [ ] Loading state for document uploads
- [ ] Disable forms during loading
- [ ] Smooth transitions between states

**Files to Create:**
- `/apps/user/app/dashboard/components/SettingsSkeleton.tsx`
- `/apps/user/components/common/FormSkeleton.tsx`

---

#### 10. Error Handling & Validation
**Status:** ⏳ Not Started  
**Estimated Time:** 2-3 hours

**Requirements:**
- [ ] Handle API errors gracefully
- [ ] Display user-friendly error messages
- [ ] Form validation errors (inline and summary)
- [ ] Handle network errors
- [ ] Handle authentication errors (redirect to login)
- [ ] Validation for all input fields:
  - Email format
  - Phone number format
  - Date of birth (must be 18+)
  - Zip code format
  - Required fields
- [ ] Show validation errors in real-time
- [ ] Prevent form submission with invalid data

**Files to Create:**
- `/apps/user/components/common/FormError.tsx`
- `/apps/user/utils/validators/formValidators.ts`

---

### **MEDIUM PRIORITY** 🟡

#### 11. Theme/Appearance Settings
**Status:** ⏳ Not Started  
**Estimated Time:** 3-4 hours

**Requirements:**
- [ ] Implement actual theme switching (Light/Dark/System)
- [ ] Save theme preference to localStorage
- [ ] Apply theme across entire dashboard
- [ ] Add theme toggle to header/navigation
- [ ] Smooth transition between themes
- [ ] Persist theme preference across sessions
- [ ] **Optional:** Save to backend user preferences

**Implementation:**
```typescript
const [theme, setTheme] = useState('dark');

useEffect(() => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem('theme', theme);
}, [theme]);
```

**Files to Create:**
- `/apps/user/hooks/useTheme.ts`
- `/apps/user/context/ThemeContext.tsx`
- `/apps/user/utils/themeUtils.ts`

---

#### 12. Email Change Functionality
**Status:** ⏳ Not Started  
**Estimated Time:** 4-5 hours

**Requirements:**
- [ ] Allow users to change email address
- [ ] Require password confirmation
- [ ] Send verification email to new address
- [ ] Verify new email with code
- [ ] Update email only after verification
- [ ] Keep old email until verified
- [ ] Show pending email change status

**Backend Implementation Needed:**
- `POST /api/user/profile/change-email/request`
- `POST /api/user/profile/change-email/verify`

**Files to Create:**
- `/apps/user/app/dashboard/components/ChangeEmailModal.tsx`

---

#### 13. Session Management
**Status:** ⏳ Not Started  
**Estimated Time:** 3-4 hours

**Requirements:**
- [ ] Display active sessions
- [ ] Show device info, location, last active
- [ ] Allow user to revoke sessions
- [ ] "Sign out all devices" option
- [ ] Highlight current session

**Backend Implementation Needed:**
- `GET /api/user/security/sessions`
- `DELETE /api/user/security/sessions/:id`
- `DELETE /api/user/security/sessions/all`

**Files to Create:**
- `/apps/user/app/dashboard/components/SessionManagement.tsx`

---

#### 14. Referral Program Section
**Status:** ⏳ Not Started  
**Estimated Time:** 2-3 hours

**Requirements:**
- [ ] Display user's referral code prominently
- [ ] Copy-to-clipboard functionality
- [ ] Generate shareable referral link
- [ ] Show referral statistics:
  - Total referrals
  - Active referrals
  - Earnings from referrals
- [ ] Link to full referral dashboard
- [ ] Social media sharing buttons

**Backend Endpoints (check if exist):**
```
GET /api/user/referrals
GET /api/user/referrals/stats
```

**Files to Create:**
- `/apps/user/app/dashboard/components/ReferralSection.tsx`

---

#### 15. Account Deletion/Deactivation
**Status:** ⏳ Not Started  
**Estimated Time:** 3-4 hours

**Requirements:**
- [ ] Add "Delete Account" or "Deactivate Account" section
- [ ] Require password confirmation
- [ ] Show warning about consequences
- [ ] Multi-step confirmation process
- [ ] Call backend to deactivate/delete
- [ ] Handle active investments (prevent deletion if active)
- [ ] Logout after deactivation

**Backend Implementation Needed:**
- `POST /api/user/account/deactivate`
- `DELETE /api/user/account/delete` (admin only?)

**Files to Create:**
- `/apps/user/app/dashboard/components/AccountDeletion.tsx`

---

#### 16. Export User Data (GDPR Compliance)
**Status:** ⏳ Not Started  
**Estimated Time:** 2-3 hours

**Requirements:**
- [ ] Allow users to download their data
- [ ] Generate comprehensive data export
- [ ] Include: profile, transactions, investments, documents
- [ ] Export in JSON or CSV format
- [ ] Comply with GDPR data portability

**Backend Implementation Needed:**
- `POST /api/user/data/export` - Trigger export
- `GET /api/user/data/export/:id/download` - Download file

**Files to Create:**
- `/apps/user/app/dashboard/components/DataExport.tsx`

---

#### 17. Mobile Responsiveness
**Status:** ⏳ Not Started  
**Estimated Time:** 2-3 hours

**Requirements:**
- [ ] Ensure all settings sections work on mobile
- [ ] Stack cards vertically on small screens
- [ ] Optimize modals for mobile view
- [ ] Touch-friendly buttons and inputs
- [ ] Test on various screen sizes

**Files to Modify:**
- `/apps/user/app/dashboard/components/Settings.tsx`
- All new settings components

---

#### 18. Accessibility (A11y)
**Status:** ⏳ Not Started  
**Estimated Time:** 2 hours

**Requirements:**
- [ ] ARIA labels for all form fields
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Focus management in modals
- [ ] Color contrast compliance
- [ ] Form error announcements

**Files to Modify:**
- All settings components

---

### **LOW PRIORITY** 🟢

#### 19. Language/Localization Preferences
**Status:** ⏳ Not Started  
**Estimated Time:** 4-5 hours

**Requirements:**
- [ ] Language selector dropdown
- [ ] Supported languages list
- [ ] Save language preference
- [ ] Apply translations across dashboard
- [ ] Currency display format preference

**Implementation:**
- Use `next-intl` or `i18next`
- Create translation files

**Files to Create:**
- `/apps/user/i18n/` directory structure
- Language translation JSON files

---

#### 20. Activity Log/Audit Trail
**Status:** ⏳ Not Started  
**Estimated Time:** 3-4 hours

**Requirements:**
- [ ] Show recent account activity
- [ ] Login history
- [ ] Profile changes log
- [ ] Security events
- [ ] Filter by activity type
- [ ] Export activity log

**Backend Endpoint:**
```
GET /api/user/activity-log
```

**Files to Create:**
- `/apps/user/app/dashboard/components/ActivityLog.tsx`

---

#### 21. Privacy Settings
**Status:** ⏳ Not Started  
**Estimated Time:** 2 hours

**Requirements:**
- [ ] Profile visibility settings
- [ ] Data sharing preferences
- [ ] Cookie preferences
- [ ] Analytics opt-out
- [ ] Marketing consent toggles

**Files to Create:**
- `/apps/user/app/dashboard/components/PrivacySettings.tsx`

---

#### 22. Connected Accounts/Integrations
**Status:** ⏳ Not Started  
**Estimated Time:** 3-4 hours

**Requirements:**
- [ ] Connect external accounts (if applicable)
- [ ] Wallet connections (crypto wallets)
- [ ] Bank account linking
- [ ] Payment method management
- [ ] Disconnect accounts

**Backend Verification Needed:**
- What third-party integrations are supported?

**Files to Create:**
- `/apps/user/app/dashboard/components/ConnectedAccounts.tsx`

---

## 🔧 Components to Create

### New Components
1. **`SettingsSkeleton.tsx`** - Loading skeleton for settings page
2. **`ProfileUpdateForm.tsx`** - Profile information form
3. **`ChangePasswordModal.tsx`** - Password change modal
4. **`ProfileImageUpload.tsx`** - Profile photo upload
5. **`KycSection.tsx`** - KYC verification section
6. **`KycDocumentUpload.tsx`** - Document upload component
7. **`KycDocumentList.tsx`** - List of uploaded documents
8. **`KycStatusBadge.tsx`** - KYC status indicator
9. **`NotificationPreferences.tsx`** - Notification settings
10. **`TwoFactorSetup.tsx`** - 2FA setup flow
11. **`TwoFactorQRCode.tsx`** - QR code display
12. **`TwoFactorBackupCodes.tsx`** - Backup codes
13. **`ReferralSection.tsx`** - Referral program info
14. **`AccountDeletion.tsx`** - Account deletion flow
15. **`DataExport.tsx`** - Data export component
16. **`SessionManagement.tsx`** - Active sessions list
17. **`ActivityLog.tsx`** - Account activity history
18. **`PrivacySettings.tsx`** - Privacy preferences
19. **`ChangeEmailModal.tsx`** - Email change modal
20. **`ConnectedAccounts.tsx`** - Third-party account links

### Reusable Components
1. **`PasswordInput.tsx`** - Password field with visibility toggle
2. **`PasswordStrengthMeter.tsx`** - Password strength indicator
3. **`CopyToClipboard.tsx`** - Copy button component
4. **`FormError.tsx`** - Form error message display
5. **`FormSkeleton.tsx`** - Form loading skeleton
6. **`ImageCropper.tsx`** - Image crop/resize tool

### Custom Hooks
1. **`useUserProfile.ts`** - Fetch and manage user profile
2. **`useTheme.ts`** - Theme management
3. **`useFormDirty.ts`** - Track form changes

### Utilities
1. **`profileApi.ts`** - Profile API calls
2. **`kycApi.ts`** - KYC API calls
3. **`securityApi.ts`** - Security/2FA API calls
4. **`preferencesApi.ts`** - User preferences API calls
5. **`profileValidators.ts`** - Profile form validation
6. **`passwordValidators.ts`** - Password validation
7. **`formValidators.ts`** - General form validation
8. **`imageUtils.ts`** - Image processing utilities
9. **`countries.ts`** - Country list constant

### Context Providers
1. **`ThemeContext.tsx`** - Global theme state

---

## 🤔 Backend Verification Questions

Before implementing all features, verify with backend:

1. **Profile Image Upload:**
   - Is there an endpoint for uploading profile images?
   - Where are profile images stored?
   - What's the file size limit?

2. **Notification Preferences:**
   - Is there a user preferences/settings table?
   - How are notification preferences stored?
   - Is there an endpoint to update preferences?

3. **Two-Factor Authentication:**
   - Are there 2FA endpoints implemented?
   - What library is used (speakeasy, otpauth)?
   - Is the login flow updated for 2FA?
   - Are backup/recovery codes implemented?

4. **Email Change:**
   - Can users change their email address?
   - Is there a verification flow for new emails?

5. **Session Management:**
   - Can users view active sessions?
   - Can they revoke sessions?
   - Is session data stored in database?

6. **Theme/Preferences:**
   - Should theme be saved to backend?
   - Or only in localStorage?

7. **Account Deletion:**
   - Can users delete their own accounts?
   - Or only deactivate?
   - What happens to their data?

8. **Data Export:**
   - Is there a data export feature?
   - What data should be included?

9. **KYC Document Types:**
   - What document types are accepted?
   - Any specific validation rules?

10. **Activity Log:**
    - Does backend track user activity?
    - Is there an audit log table?
    - What events are logged?

11. **Connected Accounts:**
    - What third-party integrations exist?
    - Wallet connections?
    - Payment methods?

12. **Subscription/Plan:**
    - Are there different user tiers (Free, Premium, etc.)?
    - How is this determined?
    - Where is it stored?

---

## 🧪 Testing Checklist

### Manual Testing

- [ ] **Profile Update:**
  - [ ] All fields pre-filled with user data
  - [ ] Save button updates profile successfully
  - [ ] Success message displayed
  - [ ] Data persists after page refresh
  - [ ] Validation works for each field

- [ ] **Password Change:**
  - [ ] Modal opens correctly
  - [ ] Current password validated
  - [ ] New password strength checked
  - [ ] Passwords match validation
  - [ ] Success message and modal closes
  - [ ] Can login with new password

- [ ] **Profile Image:**
  - [ ] Upload button works
  - [ ] Preview shows before upload
  - [ ] Image uploads successfully
  - [ ] New image displays immediately
  - [ ] File size limit enforced

- [ ] **KYC Upload:**
  - [ ] Document type selector works
  - [ ] File upload successful
  - [ ] Documents list updates
  - [ ] Status badges display correctly
  - [ ] Rejection reason shown if rejected

- [ ] **Notification Preferences:**
  - [ ] Toggles work smoothly
  - [ ] Preferences save to backend
  - [ ] Persist across sessions

- [ ] **2FA Setup:**
  - [ ] QR code generates correctly
  - [ ] Manual code displayed
  - [ ] Verification code validates
  - [ ] 2FA enabled successfully
  - [ ] Backup codes generated
  - [ ] Can disable 2FA

- [ ] **Account Information:**
  - [ ] All data displays correctly
  - [ ] Dates formatted properly
  - [ ] Currency formatted correctly
  - [ ] Referral code copy works
  - [ ] Status badges accurate

- [ ] **Loading States:**
  - [ ] Skeleton shows on initial load
  - [ ] Buttons show loading during actions
  - [ ] Forms disabled during submission

- [ ] **Error Handling:**
  - [ ] API errors show friendly messages
  - [ ] Form validation errors display
  - [ ] Network errors handled
  - [ ] Auth errors redirect to login

- [ ] **Mobile:**
  - [ ] All sections responsive
  - [ ] Modals work on mobile
  - [ ] Touch-friendly controls
  - [ ] Text readable on small screens

- [ ] **Accessibility:**
  - [ ] Keyboard navigation works
  - [ ] Screen reader announces changes
  - [ ] Focus management in modals
  - [ ] ARIA labels present

### Edge Cases

- [ ] User with no profile data
- [ ] User with incomplete profile
- [ ] Email already taken (if changing)
- [ ] Wrong current password
- [ ] File upload too large
- [ ] Invalid file type
- [ ] Network timeout during save
- [ ] Expired session during update
- [ ] KYC already approved (can't re-upload)
- [ ] 2FA already enabled/disabled

---

## 📊 Estimated Time

- **High Priority Tasks:** 33-42 hours
- **Medium Priority Tasks:** 19-27 hours
- **Low Priority Tasks:** 12-15 hours

**Total Estimated Time:** 64-84 hours (~8-10 working days)

**Recommended Approach:**
1. **Day 1-2:** Tasks 1-3 (Profile fetch, update, password change)
2. **Day 3:** Tasks 4-5 (Profile image, KYC upload)
3. **Day 4:** Tasks 6-8 (Notifications, 2FA, account info)
4. **Day 5:** Tasks 9-10 (Loading states, error handling)
5. **Day 6-7:** Medium priority tasks (Theme, email change, sessions, referral)
6. **Day 8:** More medium priority + Testing
7. **Day 9-10:** Low priority tasks + Polish + Final testing

**Note:** 2FA implementation (Task 7) is the most complex and may require additional backend development. Consider it a stretch goal if time is limited.

---

## 📝 Notes

- Settings page has the most backend dependencies of all dashboard pages
- Many features require new backend endpoints (2FA, email change, sessions, etc.)
- KYC functionality is already partially implemented in backend
- Profile and password update endpoints exist and are ready to use
- 2FA will require significant backend work (authentication flow changes)
- Consider implementing features in phases based on priority
- Some features (language, activity log, connected accounts) may not be needed initially
- Focus on core profile management, security, and KYC first
- Theme switching can be implemented client-side only (no backend needed)
- Notification preferences depend on backend implementation

---

## ✅ Success Criteria

Settings page is complete when:

1. ✅ User profile data loads from backend
2. ✅ Profile update form works and saves to backend
3. ✅ Password change modal functional
4. ✅ Profile image upload works (if endpoint exists)
5. ✅ KYC document upload and list functional
6. ✅ KYC status displays accurately
7. ✅ Notification preferences toggle and save
8. ✅ Account information displays real data
9. ✅ 2FA setup flow complete (if implemented)
10. ✅ Loading states and error handling implemented
11. ✅ Mobile responsive and accessible
12. ✅ All high-priority tests pass
13. ✅ No console errors or warnings
14. ✅ Backend questions clarified and implemented accordingly
15. ✅ Data persists across page refreshes and sessions

---

**Ready for implementation after backend verification and approval! 🚀**

**Note:** This is the most complex dashboard page due to security features and backend dependencies. Recommend phased implementation starting with profile management, then KYC, then security features.
