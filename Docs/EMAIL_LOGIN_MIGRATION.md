# Email/Username Login Migration

## Overview
This document describes the changes made to allow users to login using either their email address or username. Previously, email was stored only in role-specific tables (Elderly, Caregiver, Clinician, etc.). Now, email is stored in the User table as a unique, required field.

## Database Schema Changes

### User Model
- **Added**: `email` field (unique, required)
- Email is now stored at the User level, making it consistent across all user types

### Role Models (Elderly, Caregiver, Clinician, etc.)
- **Changed**: Email fields are now optional
- Email is still stored in role tables for backward compatibility
- Unique constraints on role-level emails are now partial (only when email is not null)

### Migration
- Migration file: `20251107103513_add_email_to_user/migration.sql`
- **Data Migration**: Existing emails from role tables were automatically migrated to User table
- **Fallback**: Users without email in role tables received placeholder emails (`username@placeholder.moveplus.local`)

## Backend Changes

### Authentication Controller (`authController.ts`)

#### Login Function
- Now accepts both email and username for login
- Automatically detects if input contains '@' to determine if it's an email
- Queries User table by email or username accordingly

```typescript
const isEmail = normalizedInput.includes('@');
const user = await prisma.user.findUnique({
  where: isEmail ? { email: normalizedInput } : { username: normalizedInput },
  omit: { password: false }
})
```

#### Profile Completion
- Updates User.email if provided during profile completion
- Still stores email in role tables for backward compatibility

#### Check Email Endpoint
- Now checks User table for email availability
- Simplified implementation (no longer checks multiple role tables)

### Registration Controller (`registerController.ts`)

#### Register User Helper
- Updated to accept and store email in User table
- Signature changed: `registerUser(tx, username, email, password, role)`

#### All Registration Functions
- Email is now required for all user types (Elderly, Caregiver, Clinician)
- Email is stored in both User table (primary) and role table (compatibility)

### Invitation Controller (`invitationController.ts`)

#### Create Invitation
- Checks User table for existing email instead of role tables
- Simplified validation logic

#### Accept Invitation
- Creates User with email field populated
- Stores invitation email in User.email during account creation

## Frontend Changes

### Login Screen (`LoginScreen.tsx`)
- Input field label changed from "Email" to "Email or Username"
- Variable renamed from `normalizedUsername` to `normalizedInput` for clarity
- Validation message updated to reflect either email or username can be used

### Translations

#### English (`en.json`)
- Added: `"emailOrUsername": "Email or Username"`
- Added: `"emailOrUsernameRequired": "Email or username is required"`

#### Portuguese (`pt.json`)
- Added: `"emailOrUsername": "Email ou Nome de Utilizador"`
- Added: `"emailOrUsernameRequired": "Email ou nome de utilizador é obrigatório"`

## Benefits

1. **Unified Login**: Users can now login with either email or username
2. **Consistency**: Email is stored in one authoritative location (User table)
3. **Better Data Integrity**: Unique constraint on User.email prevents duplicate emails
4. **Simplified Logic**: Authentication checks one table instead of multiple role tables
5. **Backward Compatibility**: Email still stored in role tables for existing integrations

## Testing Checklist

- [ ] Login with username works
- [ ] Login with email works
- [ ] Registration stores email in User table
- [ ] Invitation acceptance creates user with email
- [ ] Profile completion updates email
- [ ] Email uniqueness is enforced
- [ ] Existing users can still login after migration
- [ ] Translation keys work in both languages

## Rollback Plan

If issues arise, the migration can be rolled back by:
1. Running a reverse migration to remove User.email field
2. Reverting backend code changes
3. Reverting frontend changes
4. Restarting the server

Note: Any new users created after the migration would need to be manually cleaned up.

## Notes

- Placeholder emails (`username@placeholder.moveplus.local`) were created for users without emails
- These should be updated by users or administrators to real email addresses
- Role-level emails are maintained for compatibility but User.email is the source of truth
