# Authentication Flow Documentation

## Overview
Role-Based Access Control (RBAC) system with approval workflow for Admin, Manager, and Team roles.

---

## 🔑 Core Principles

1. **No Public Registration** - Only Admin can create users
2. **Role Hierarchy** - Admin > Manager > Team
3. **Single Login Page** - Unified authentication entry point
4. **First-Time Password Change** - Security enforcement for new users

---

## 👥 User Roles & Permissions

### Admin
- Create new users (all roles)
- Manage all users (Admin, Manager, Team)
- Assign/change roles
- Full system access
- Reset passwords via "Forgot Password"

### Manager
- View and manage Team members only
- Cannot create or modify Admin/Manager accounts
- Limited dashboard access

### Team
- Basic access to assigned features
- Cannot manage other users
- View-only permissions for most data

---

## 🔄 Authentication Flows

### Flow 1: Admin Creates New User

```
1. Admin logs in → Dashboard
2. Admin navigates to "Users" page
3. Admin clicks "Create New User"
4. Admin fills form:
   - Full Name
   - Email
   - Phone Number
   - Role (Admin/Manager/Team)
   - Initial Password (auto-generated)
5. System creates user in Firebase Auth
6. System saves user profile in Firestore:
   {
     uid: string
     email: string
     displayName: string
     phoneNumber: string
     role: "admin" | "manager" | "team"
     isApproved: true (automatically approved)
     isFirstLogin: true
     createdAt: timestamp
     createdBy: adminUid
   }
7. System sends welcome email with:
   - Temporary password
   - Login URL
   - Instructions to change password
8. Success notification to Admin
9. User can immediately log in (no waiting for approval)
```

### Flow 2: New User First Login

```
1. User receives welcome email
2. User opens login page
3. User enters email + temporary password
4. System authenticates with Firebase Auth
5. System checks Firestore user profile
6. System detects `isFirstLogin: true`
7. System redirects to "/change-password"
8. User must change password:
   - Enter current password
   - Enter new password
   - Confirm new password
9. System updates password in Firebase Auth
10. System updates Firestore:
    - isFirstLogin: false
    - passwordChangedAt: timestamp
11. System redirects to appropriate dashboard based on role
```

### Flow 3: Regular Login

```
1. User opens login page
2. User enters email + password
3. System authenticates with Firebase Auth
4. System fetches user profile from Firestore
5. System checks:
   a. isFirstLogin === true?
      - Yes → Redirect to "/change-password"
      - No → Continue
6. System loads role-based dashboard:
   - Admin → Full dashboard
   - Manager → Limited dashboard
   - Team → Basic dashboard
```

### Flow 4: Forgot Password (Admin Only)

```
1. Admin clicks "Forgot Password" on login page
2. Admin enters email
3. System verifies:
   - User exists
   - User has Admin role
4. System sends password reset email via Firebase
5. Admin clicks reset link in email
6. Admin enters new password
7. System updates password
8. Admin redirects to login page
9. Admin logs in with new password
```

### Flow 5: Role Management

```
1. Admin logs in
2. Admin navigates to "Users" page
3. Admin sees list of all users with:
   - Name, Email, Role
   - Last login date
   - Status indicators
4. Admin actions available:
   a. Edit User:
      - Change name, phone, role
      - Reset password (send reset email)
   b. Delete User:
      - Soft delete (set active: false)
      - Or hard delete from system
   c. View Activity:
      - Login history
      - Actions performed
5. Manager sees only Team members
6. Team members cannot access Users page
```

---

## 🗄️ Firestore Data Structure

### users/{uid}
```typescript
{
  uid: string                    // Firebase Auth UID
  email: string                  // Primary email
  displayName: string            // Full name
  phoneNumber?: string           // Contact number
  photoURL?: string              // Profile picture (from Google)
  role: "admin" | "manager" | "team"
  isApproved: boolean            // Always true for admin-created users
  isFirstLogin: boolean          // Password change required
  createdAt: Timestamp           // Account creation
  createdBy: string              // Admin UID who created (required)
  updatedAt: Timestamp           // Last profile update
  lastLoginAt?: Timestamp        // Last successful login
  passwordChangedAt?: Timestamp  // Last password change
  provider: "password" | "google.com"  // Auth method
  isActive: boolean              // Account status (for soft delete)
}
```

---

## 🛡️ Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function isApproved() {
      return isAuthenticated() && 
             getUserData().isApproved == true &&
             getUserData().isActive == true;
    }
    
    function isAdmin() {
      return isApproved() && getUserData().role == 'admin';
    }
    
    function isManager() {
      return isApproved() && getUserData().role == 'manager';
    }
    
    // Users collection
    match /users/{userId} {
      // Read own profile or Admin/Manager can read all
      allow read: if isAuthenticated() && 
                     (request.auth.uid == userId || 
                      isAdmin() || 
                      isManager());
      
      // Create: Only by Admin or during initial system setup
      allow create: if isAdmin();
      
      // Update own basic info
      allow update: if isAuthenticated() && 
                       request.auth.uid == userId &&
                       // Cannot change critical fields
                       !request.resource.data.diff(resource.data)
                         .affectedKeys()
                         .hasAny(['role', 'isApproved', 'uid']);
      
      // Admin can update any user
      allow update: if isAdmin();
      
      // Admin can delete users
      allow delete: if isAdmin();
    }
    
    // Other collections - require approval
    match /{document=**} {
      allow read, write: if isApproved();
    }
  }
}
```

---

## 🚧 Route Protection (Next.js Middleware)

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const user = getUserFromSession(); // Your auth method
  const path = request.nextUrl.pathname;
  
  // Public routes
  if (['/login', '/change-password'].includes(path)) {
    return NextResponse.next();
  }
  
  // Require authentication
  if (!user) {
    return NextResponse.redirect('/login');
  }
  
  // Check if account is active
  if (!user.isActive) {
    // Account deactivated - sign out
    return NextResponse.redirect('/login?error=account_deactivated');
  }
  
  // First login - force password change
  if (user.isFirstLogin && path !== '/change-password') {
    return NextResponse.redirect('/change-password');
  }
  
  // Role-based access
  if (path.startsWith('/users')) {
    if (!['admin', 'manager'].includes(user.role)) {
      return NextResponse.redirect('/dashboard');
    }
  }
  
  return NextResponse.next();
}
```

---

## 📧 Email Templates

### Welcome Email (Admin Created User)
```
Subject: Welcome to [App Name] - Account Created

Hi [User Name],

Your account has been created by an administrator and is ready to use.

Login Credentials:
Email: [email]
Temporary Password: [password]

Login URL: [app-url]/login

IMPORTANT: You must change your password on first login for security.

Your assigned role: [role]

If you have questions, contact your administrator.
```

### Approval Notification
```
Subject: Password Changed Successfully

Hi [User Name],

Your password has been changed successfully.

If you did not make this change, please contact your administrator immediately.

Login: [app-url]/login
```

---

## 🔒 Security Best Practices

1. **Password Complexity**: Enforce strong passwords (8+ chars, mixed case, numbers)
2. **Session Management**: Auto-logout after inactivity
3. **Rate Limiting**: Prevent brute force attacks on login
4. **Audit Logging**: Track all role changes and approvals
5. **Two-Factor Authentication**: Optional for Admin accounts
6. **Email Verification**: Verify email before account activation
7. **Password Reset**: Secure token-based reset flow
8. **HTTPS Only**: Enforce secure connections

---

## 📊 User States

| State | isApproved | isFirstLogin | isActive | Access |
|-------|-----------|--------------|----------|--------|
| New (Admin Created) | true | true | true | Redirect to /change-password |
| Active User | true | false | true | Full access (role-based) |
| Deactivated | true | false | false | No access, account disabled |
| Deleted | N/A | N/A | N/A | Account removed |

---

## 🔄 Migration from Old Flow

### Old Flow (BEING REMOVED)
```
❌ Public sign-up page
❌ Email/password registration without approval
❌ Direct Google sign-in with auto-registration
❌ No role assignment on creation
❌ Manual approval workflow after registration
```

### New Flow (IMPLEMENTING)
```
✅ Admin-only user creation
✅ Pre-approved accounts (no waiting)
✅ Role assigned at creation by Admin
✅ First-time password change enforcement
✅ Unified login page (no sign-up)
✅ Google sign-in only for pre-created accounts
✅ Instant access after password change
```

---

## 📝 Implementation Checklist

- [ ] Remove public sign-up page
- [ ] Create Admin user creation form
- [ ] Add `isApproved`, `isFirstLogin`, and `isActive` to User schema
- [ ] Implement `/change-password` page
- [ ] Remove `/pending-approval` page (not needed)
- [ ] Add user management UI in Admin dashboard
- [ ] Update Firestore security rules
- [ ] Setup email service (SendGrid/AWS SES)
- [ ] Create email templates
- [ ] Add forgot password flow (Admin only)
- [ ] Implement middleware for route protection
- [ ] Add real-time user profile sync
- [ ] Create audit log for role changes
- [ ] Block unauthorized Google sign-in attempts
- [ ] Test all user flows
- [ ] Update documentation

---

## 🧪 Testing Scenarios

1. **Admin creates user** → User receives email → First login → Password change → Dashboard access ✅
2. **Google sign-in (pre-created account)** → User logs in → First login check → Dashboard access ✅
3. **Google sign-in (no account)** → Error message → Contact administrator ✅
4. **Manager logs in** → Can only see Team members → Cannot create Manager/Admin ✅
5. **First login** → Forced to change password → Cannot skip ✅
6. **Forgot password** → Only works for Admin → Regular reset flow ✅
7. **Deactivated account** → Cannot log in → Error message ✅

---

## 📞 Support & Maintenance

- **User Locked Out**: Admin resets password via Users management
- **Password Issues**: Admin resets via forgot password or Firebase console
- **Role Changes**: Admin updates via Users management page
- **Account Deactivation**: Admin sets isActive: false (soft delete)
- **Account Deletion**: Admin hard-deletes from Firebase Auth + Firestore
- **Google Sign-in Issues**: Verify account exists before allowing Google auth

---

**Version**: 1.0  
**Last Updated**: 2026-01-03  
**Status**: Implementation Ready