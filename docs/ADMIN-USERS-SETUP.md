# Admin Users Setup Guide

How to set up admin access for specific users in Supabase.

---

## 🎯 What This Does

- Admin users see an extra "Admin" link in navigation
- Admin users can access `/version1/admin` pages
- Admin users appear as **normal players** everywhere else:
  - ✅ Same name display
  - ✅ No special badge
  - ✅ Compete on leaderboard like everyone
  - ✅ Make predictions normally

**Only difference**: Extra "Admin" menu item appears for admins

---

## 📋 Setup Steps

### Step 1: Add isAdmin to User Metadata

When creating/updating users in Supabase:

#### Option A: Via Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click on a user
3. Scroll to **User Metadata** section
4. Click **Edit**
5. Add:
```json
{
  "isAdmin": true,
  "name": "James"
}
```
6. Click **Save**

#### Option B: Via SQL (Recommended for Multiple Users)

Run this SQL in Supabase SQL Editor:

```sql
-- Set James as admin
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"isAdmin": true}'::jsonb
WHERE email = 'james@example.com';

-- Set another admin
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"isAdmin": true}'::jsonb
WHERE email = 'otheradmin@example.com';
```

#### Option C: During Signup (Programmatically)

When creating users via code:

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'james@example.com',
  password: 'password',
  options: {
    data: {
      name: 'James',
      isAdmin: true, // Makes this user an admin
    }
  }
});
```

---

## ✅ Verification

### Check if Admin Setup Works:

1. **Login as admin user**
   - Email: james@example.com
   
2. **Look at navigation**
   - Should see: Home | Active Now | Leaderboard | Rounds | Stats | **Admin** ✅
   
3. **Login as regular player**
   - Should see: Home | Active Now | Leaderboard | Rounds | Stats (no Admin) ✅

---

## 🔐 Who Should Be Admin?

Recommended: **2 people maximum**

**Your league:**
- ✅ You (James) - Admin
- ✅ One backup admin - In case you're unavailable
- ❌ Other 6 players - Regular players only

**Why limit admins:**
- Prevents accidental round publishing
- Clearer responsibility
- Reduces confusion

---

## 👥 Admin User List Template

Keep track of admins:

```
Admin Users:
1. james@example.com - Primary admin
2. backup@example.com - Backup admin

Regular Players:
3. player1@example.com
4. player2@example.com
5. player3@example.com
6. player4@example.com
7. player5@example.com
8. player6@example.com
```

---

## 🔄 Changing Admin Status

### Remove Admin Access:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'isAdmin'
WHERE email = 'user@example.com';
```

### Grant Admin Access:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"isAdmin": true}'::jsonb
WHERE email = 'newadmin@example.com';
```

---

## 🎭 Development Mode (No Supabase)

When running without Supabase configured:

The app uses mock data from `/src/mockData.ts`:

```typescript
export const currentUser = {
  id: 'u1',
  name: 'James',
  email: 'james@example.com',
  isAdmin: true, // ← Change this to test admin/player views
};
```

**To test as regular player:**
- Set `isAdmin: false`
- Admin link disappears

**To test as admin:**
- Set `isAdmin: true`
- Admin link appears

---

## 🛡️ Security Notes

### Protected Routes

Admin pages are protected in two ways:

1. **Navigation** - Admin link only shows for admins
2. **Route Protection** - Admin routes redirect non-admins

If a regular player tries to access `/version1/admin` directly:
- They get redirected to home page
- Or see "Access Denied" message

### Database Security

Add Row Level Security (RLS) policies in Supabase:

```sql
-- Only admins can update match results
CREATE POLICY "Only admins can update matches"
ON matches FOR UPDATE
USING (
  auth.jwt() ->> 'isAdmin' = 'true'
);

-- Only admins can change round status
CREATE POLICY "Only admins can update rounds"
ON rounds FOR UPDATE
USING (
  auth.jwt() ->> 'isAdmin' = 'true'
);
```

---

## 🎯 Summary

✅ **For Admins:**
- See Admin link in navigation
- Access admin panel
- Publish rounds
- Set results
- **Still compete as regular player**

✅ **For Regular Players:**
- No Admin link
- No access to admin pages
- Can't accidentally break anything
- Normal prediction experience

✅ **Everywhere Else:**
- Admins look exactly like players
- Same name, no badge
- Compete on leaderboard
- No special treatment

---

## 📞 Need Help?

If admin link isn't showing:
1. Check user metadata has `isAdmin: true`
2. Log out and log back in
3. Check browser console for errors
4. Verify Supabase connection

If admin link shows for everyone:
1. Check auth context is working
2. Verify role checking logic
3. Clear browser cache
