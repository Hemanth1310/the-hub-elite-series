# Supabase Authentication Setup Guide

## Step 1: Create Supabase Project (5 minutes)

1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click "New Project"
4. Fill in:
   - **Project Name**: The Hub
   - **Database Password**: (create a strong password - save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project" and wait ~2 minutes

## Step 2: Get Your API Keys (2 minutes)

1. In your Supabase project dashboard, click "Settings" (gear icon) in sidebar
2. Click "API" 
3. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (long string)
4. **Copy both of these** - you'll need them next

## Step 3: Add Keys to Your Applet (2 minutes)

1. In Applet, click the **Environment Variables** button (or settings)
2. Add these two variables:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...your-long-key...
   ```
3. Save changes

## Step 4: Create User Accounts (10 minutes)

1. In Supabase dashboard, go to **Authentication** → **Users**
2. Click "**Add user**" (or "Invite user")
3. For each person, fill in:
   - **Email**: their email address
   - **Password**: create a temporary password (e.g., "TempPass123!")
   - Click "Create user"

4. **Set user metadata** (name and admin role):
   - Click on the user you just created
   - Scroll to "**User Metadata**" section
   - Click "Edit"
   - Add this JSON:
   ```json
   {
     "name": "James Smith",
     "isAdmin": true
   }
   ```
   - Click "Save"
   - Set `isAdmin: false` for regular users

5. Repeat for all 8-10 users

## Step 5: Send Login Details to Users

Send each person an email with:
```
Hi [Name],

Welcome to The Hub! Here are your login details:

🔗 URL: [your-app-url]
📧 Email: [their-email]
🔑 Password: TempPass123!

You can change your password after logging in.

See you on the leaderboard!
```

## Step 6: Test Everything

1. Open your app
2. You should see the login page
3. Log in with one of the accounts you created
4. You should be redirected to the Home dashboard
5. Check the top right - you should see the user's name
6. Test logging out

---

## User List Template

| Name | Email | Password | Admin |
|------|-------|----------|-------|
| James | james@example.com | TempPass123! | ✅ Yes |
| User 2 | user2@example.com | TempPass123! | ❌ No |
| User 3 | user3@example.com | TempPass123! | ❌ No |
| ... | ... | ... | ... |

---

## Troubleshooting

### "Invalid login credentials"
- Double check email and password
- Make sure the account is created in Supabase
- Check that email confirmation is disabled (see below)

### Users not seeing their name
- Check user metadata in Supabase
- Make sure you added the `name` field

### Admin badge not showing
- Check user metadata has `"isAdmin": true`
- Make sure it's a boolean, not a string

### Need to disable email confirmation? (Recommended for small groups)
1. Go to **Authentication** → **Providers** → **Email**
2. Toggle OFF "**Confirm email**"
3. Click Save
4. This way users can log in immediately without clicking a confirmation link

---

## Managing Users Later

### Change someone's password:
1. Go to Authentication → Users
2. Click the user
3. Click "Reset password"
4. Send them the reset link

### Make someone an admin:
1. Go to Authentication → Users
2. Click the user
3. Edit User Metadata
4. Set `"isAdmin": true`

### Remove someone's access:
1. Go to Authentication → Users
2. Click the user
3. Click "Delete user"

---

## Security Notes

✅ **What's protected:**
- All routes require login
- Only you can create accounts
- Passwords are encrypted
- API keys are safe (anon key is meant to be public)

✅ **Best practices:**
- Use strong temporary passwords
- Tell users to change their password
- Only give admin to people you trust (2-3 people max)
- Regular users can't access Admin pages

---

## Need Help?

If something's not working:
1. Check the browser console for errors (F12)
2. Verify environment variables are set correctly
3. Make sure Supabase project is active
4. Check that email confirmation is disabled
