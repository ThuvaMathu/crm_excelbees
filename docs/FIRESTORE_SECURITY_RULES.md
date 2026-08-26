# Firestore Security Rules Documentation

## Overview
This document explains the Firestore security rules implemented for the CRM application.

## Role-Based Access Control (RBAC)

### Roles
- **admin**: Full access to all resources
- **manager**: Can read all, edit/delete most resources
- **sales**: Standard user with read access and edit own resources
- **support**: Standard user with read access and edit own resources

### Permission Levels

#### Read Access
- **All Collections**: All authenticated users can read
- **Notifications**: Users can only read their own

#### Create Access
- **Most Collections**: All authenticated users can create
- **Ownership**: Creator is automatically set as owner

#### Update Access
- **Admin**: Can update any resource
- **Manager**: Can update most resources
- **Owner**: Can update their own resources
- **Special Cases**:
  - Users cannot change their own role
  - Tasks can be updated by assigned user

#### Delete Access
- **Admin & Manager**: Can delete most resources
- **Activities**: Users can delete their own
- **Notifications**: Users can delete their own

## Collection-Specific Rules

### Users (`/users/{userId}`)
- **Read**: All authenticated users
- **Create**: Self-registration only, must include email and role
- **Update**: Self or admin, cannot change own role
- **Delete**: Admin only

### Leads (`/leads/{leadId}`)
- **Read**: All authenticated users
- **Create**: All authenticated, must set self as owner
- **Update**: Admin, manager, or owner
- **Delete**: Admin or manager only
- **Validation**: Email format, required fields

### Contacts (`/contacts/{contactId}`)
- **Read**: All authenticated users
- **Create**: All authenticated, must set self as owner
- **Update**: Admin, manager, or owner
- **Delete**: Admin or manager only
- **Validation**: Email format, required fields

### Companies (`/companies/{companyId}`)
- **Read**: All authenticated users
- **Create**: All authenticated, must set self as owner
- **Update**: Admin, manager, or owner
- **Delete**: Admin or manager only

### Deals (`/deals/{dealId}`)
- **Read**: All authenticated users
- **Create**: All authenticated, must set self as owner
- **Update**: Admin, manager, or owner
- **Delete**: Admin or manager only
- **Validation**: 
  - Value must be >= 0
  - Probability must be 0-100

### Activities (`/activities/{activityId}`)
- **Read**: All authenticated users
- **Create**: All authenticated, must set self as performer
- **Update**: Admin or activity creator
- **Delete**: Admin, manager, or activity creator

### Projects (`/projects/{projectId}`)
- **Read**: All authenticated users
- **Create**: All authenticated, must set self as owner
- **Update**: Admin, manager, or owner
- **Delete**: Admin or manager only

### Tasks (`/tasks/{taskId}`)
- **Read**: All authenticated users
- **Create**: All authenticated
- **Update**: Admin, manager, or assigned user
- **Delete**: Admin or manager only

### Invoices (`/invoices/{invoiceId}`)
- **Read**: All authenticated users
- **Create**: All authenticated, must set self as creator
- **Update**: Admin, manager, or creator
- **Delete**: Admin or manager only
- **Validation**: Total must be >= 0

### Notifications (`/notifications/{notificationId}`)
- **Read**: Own notifications only
- **Create**: Admin or self
- **Update**: Own notifications only
- **Delete**: Admin or own notifications

## Validation Rules

### Email Validation
All email fields are validated using regex pattern:
```
^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
```

### Required Fields
Each collection enforces required fields on creation:
- **Leads**: firstName, lastName, email, status, source, ownerId
- **Contacts**: firstName, lastName, email, ownerId
- **Companies**: name, ownerId
- **Deals**: title, stage, value, probability, ownerId
- **Activities**: type, content, performedBy, relatedTo
- **Projects**: name, status, ownerId
- **Tasks**: title, status, priority, assignedTo
- **Invoices**: invoiceNumber, clientName, status, total, createdBy

### Numeric Validation
- **Deal value**: Must be >= 0
- **Deal probability**: Must be 0-100
- **Invoice total**: Must be >= 0

## Security Best Practices

### 1. Authentication Required
All operations require authentication. Unauthenticated users have no access.

### 2. Ownership Enforcement
- Resources are tied to owners/creators
- Users automatically become owners of resources they create
- Ownership cannot be transferred without admin privileges

### 3. Role Immutability
- Users cannot change their own role
- Only admins can modify user roles

### 4. Field Validation
- Email format validation
- Numeric range validation
- Required field enforcement

### 5. Least Privilege
- Users have minimal necessary permissions
- Sensitive operations require elevated privileges

## Deployment

### Using Firebase CLI
```bash
firebase deploy --only firestore:rules
```

### Testing Rules
Use Firebase Emulator Suite for local testing:
```bash
firebase emulators:start
```

### Monitoring
Monitor rule usage in Firebase Console:
- Security Rules > Usage
- Check for denied requests
- Review rule evaluation metrics

## Common Scenarios

### Scenario 1: User Creates a Lead
```javascript
// ✅ Allowed
await addDoc(collection(db, 'leads'), {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  status: 'New',
  source: 'Website',
  ownerId: currentUser.uid // Must be current user
});
```

### Scenario 2: Manager Deletes Any Lead
```javascript
// ✅ Allowed if user role is 'manager' or 'admin'
await deleteDoc(doc(db, 'leads', leadId));
```

### Scenario 3: User Updates Own Lead
```javascript
// ✅ Allowed if user is owner
await updateDoc(doc(db, 'leads', leadId), {
  status: 'Qualified'
});
```

### Scenario 4: User Tries to Change Own Role
```javascript
// ❌ Denied
await updateDoc(doc(db, 'users', currentUser.uid), {
  role: 'admin' // Not allowed
});
```

## Troubleshooting

### Permission Denied Errors
1. Check user authentication status
2. Verify user role in `/users/{uid}` document
3. Confirm resource ownership
4. Review required fields
5. Check field validation rules

### Testing Checklist
- [ ] Unauthenticated access denied
- [ ] Users can create resources
- [ ] Owners can edit their resources
- [ ] Managers can edit all resources
- [ ] Admins have full access
- [ ] Users cannot escalate privileges
- [ ] Email validation works
- [ ] Numeric validation works
- [ ] Required fields enforced
