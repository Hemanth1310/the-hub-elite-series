# The Hub - Complete Setup & Working Guide

**Last Updated:** February 2026  
**Project:** Eliteserie 2026 Predictions  
**Status:** Active Development

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Database Setup](#database-setup)
5. [Authentication Setup](#authentication-setup)
6. [Email Service Setup](#email-service-setup)
7. [Environment Configuration](#environment-configuration)
8. [Running the Application](#running-the-application)
9. [Admin Workflow](#admin-workflow)
10. [Scoring System](#scoring-system)
11. [Testing Checklist](#testing-checklist)
12. [Troubleshooting](#troubleshooting)

---

## Project Overview

**The Hub** is a Premier League predictions game where:
- 8-10 players compete in weekly prediction leagues
- Players predict match results (Home/Draw/Away)
- Each round has 8 regular matches + optional standalone matches
- One match per round is designated as "Match of the Week" (MOTW)
- Players can select ONE "banker" pick per round (doubles points)
- Scoring is automated based on predictions
- Leaderboard tracks overall performance

### Technology Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Shadcn UI
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Email:** EmailJS (for notifications)
- **Deployment:** Vercel/Netlify

---

## Prerequisites

Before starting, ensure you have:

- ✅ **Node.js 18+** - Check with `node --version`
- ✅ **Git** - Check with `git --version`
- ✅ **Code editor** - VS Code recommended
- ✅ **Supabase account** - Create free at [supabase.com](https://supabase.com)
- ✅ **EmailJS account** - Create free at [emailjs.com](https://www.emailjs.com)
- ✅ **Internet connection** - For external services

### Estimated Time
- **Initial setup:** 30-45 minutes
- **Database setup:** 10-15 minutes
- **Email configuration:** 15-20 minutes
- **Total:** ~1 hour

---

## Initial Setup

### Step 1: Clone/Extract Project

```bash
cd /Users/hemanth/Documents/2.CodeDumps/freelance
cd the-hub-a161
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages including:
- React 19 & dependencies
- Supabase client
- EmailJS
- Shadcn UI components
- Tailwind CSS

### Step 3: Verify Installation

```bash
npm run dev
```

App should start on `http://localhost:5173`

---

## Database Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in:
   - **Project Name:** The Hub
   - **Database Password:** Create a strong password (save this!)
   - **Region:** Choose closest to users (e.g., Europe)
5. Wait 2-3 minutes for project creation

### Step 2: Get API Keys

1. In your Supabase dashboard, click **Settings** (gear icon)
2. Click **API** in the sidebar
3. Copy these values:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **Anon Public Key:** `eyJhbGc...` (long string)

**Save these - you'll need them next!**

### Step 3: Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Open `/docs/database-schema.sql` from your project
4. Copy the ENTIRE file contents
5. Paste into the SQL Editor query box
6. Click **"Run"** (or press `Cmd + Enter`)
7. Wait for completion

**Verify:** You should see all 12 tables created:
- `auth.users`
- `rounds`
- `matches`
- `predictions`
- `leaderboard`
- And 7 more...

### Step 4: Seed Initial Data (Teams)

The schema includes seed data for Eliteserie teams. They're automatically inserted when you run the schema.

**Verify:** In Supabase, go to **SQL Editor** → **teams** table. You should see all 20 Norwegian teams.

---

## Authentication Setup

### Step 1: Disable Email Confirmation (Optional but Recommended)

For testing with a small group, disable email confirmation:

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Click **Email**
3. Toggle **OFF** "Confirm email"
4. Click **Save**

This allows users to log in immediately without clicking a confirmation link.

### Step 2: Create User Accounts

Create accounts for all players. You have two options:

#### Option A: Via Supabase Dashboard (Easy)

1. Go to **Authentication** → **Users**
2. Click **"Add user"**
3. Fill in:
   - **Email:** player@example.com
   - **Password:** Create a temporary password
4. Click **"Create user"**

#### Option B: Via SQL (Faster for Multiple Users)

Run this SQL in **SQL Editor**:

```sql
-- Create multiple users at once
INSERT INTO auth.users (email, encrypted_password, raw_user_meta_data) VALUES
('james@example.com', 'temp_pass_123', '{"name":"James","isAdmin":true}'),
('player2@example.com', 'temp_pass_123', '{"name":"Player 2","isAdmin":false}'),
('player3@example.com', 'temp_pass_123', '{"name":"Player 3","isAdmin":false}');
```

**Note:** Replace emails and set `isAdmin: true` for 1-2 admin users only.

### Step 3: Set User Metadata (Names & Roles)

For each user, add their name and admin status:

1. Go to **Authentication** → **Users**
2. Click on a user
3. Scroll to **User Metadata** section
4. Click **Edit**
5. Add:
   ```json
   {
     "name": "James Smith",
     "isAdmin": true
   }
   ```
6. Click **Save**

**For regular players:** Set `"isAdmin": false`

### Step 4: Assign Admin Role

Only 1-2 trusted users should be admins. Set `isAdmin: true` for:
- The league organizer
- One backup admin

Everyone else gets `isAdmin: false`

---

## Email Service Setup

### Step 1: Create EmailJS Account

1. Go to [emailjs.com](https://www.emailjs.com)
2. Click **Sign Up**
3. Create free account (200 emails/month included)
4. Verify your email

### Step 2: Add Email Service

1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider:
   - **Gmail** (easiest) - Use Gmail account
   - **Outlook** - Use Outlook account
   - Or any SMTP service
4. Follow the connection steps
5. **Save the Service ID** (looks like `service_xxxxxxx`)

### Step 3: Create Email Templates

#### Template 1: Round Active Notification

1. Go to **Email Templates**
2. Click **Create New Template**
3. Name: `Round Active Notification`
4. **Save the Template ID** (looks like `template_xxxxxxx`)
5. Set template content:

```
Subject: {{subject}}

Hi {{to_name}},

🎯 {{round_type}} is now OPEN for predictions!

Deadline: {{deadline}}

Make your predictions now:
{{app_url}}

Good luck! 🍀

---
The Hub - Predictions League
```

#### Template 2: Round Final Notification

1. Create another template
2. Name: `Round Final Notification`
3. **Save the Template ID**
4. Set template content:

```
Subject: {{subject}}

Hi {{to_name}},

🏆 {{round_type}} results are now FINAL!

Check your score:
{{app_url}}

Great job! 🎉

---
The Hub - Predictions League
```

### Step 4: Get Your Public Key

1. Go to **Account** → **General**
2. Find **Public Key** section
3. Copy your public key (long string starting with numbers/letters)

### Step 5: Save EmailJS Credentials

Save these three values:
- **Service ID:** `service_xxxxxxx`
- **Template ID (Active):** `template_xxxxxxx`
- **Template ID (Final):** `template_xxxxxxx`
- **Public Key:** `xxxxxxxxx`

You'll add these to environment variables next.

---

## Environment Configuration

### Step 1: Create `.env.local` File

In your project root (`/Users/hemanth/Documents/2.CodeDumps/freelance/the-hub-a161/`):

1. Create file named `.env.local`
2. Add these variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...your-long-key...

# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ROUND_ACTIVE=template_xxxxxxx
VITE_EMAILJS_TEMPLATE_ROUND_FINAL=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxxxxx

# App Configuration
VITE_APP_URL=http://localhost:5173
```

### Step 2: Replace Placeholder Values

Replace each `xxx` with your actual values from:
- Supabase dashboard → Settings → API
- EmailJS dashboard → Account & Templates

### Step 3: Restart App

```bash
# Stop dev server (Ctrl+C)
# Start again
npm run dev
```

---

## Running the Application

### Development Mode

```bash
npm run dev
```

App runs on `http://localhost:5173`

**Features:**
- Live reload on code changes
- Fast refresh
- Debug mode enabled

### Production Build

```bash
npm run build
```

Creates optimized build in `dist/` folder

### Preview Production Build

```bash
npm run preview
```

Preview the production build locally

---

## Admin Workflow

### Creating Your First Round

1. **Login as admin user**
2. Click **Admin** in navigation
3. Click **"Create New Round"**
4. Fill in:
   - **Round Name:** e.g., "Round 1"
   - **Round Type:** Select "Regular" (8 matches) or "Standalone" (1 match)
   - **Season:** e.g., 2025/26
5. Click **"Save"**

### Adding Matches

1. Click on the round you created
2. Click **"Add Match"**
3. Fill in:
   - **Home Team:** Select from dropdown
   - **Away Team:** Select from dropdown
   - **Kickoff Time:** Click to set date/time
   - **Include in Round:** Toggle ON
4. Click **"Add"**
5. Repeat for all 8 matches

### Setting Match of the Week

1. In the round details, find the match you want as MOTW
2. Click the **MOTW** button/toggle
3. Only ONE match can be MOTW per round
4. Click **"Save"**

### Publishing Round (Making it Active)

1. In round details, click **"Publish Round"**
2. Status changes: Scheduled → Active
3. Players now see this round and can make predictions
4. **Important:** Only ONE round can be Active at a time

### Entering Match Results

After matches are played:

1. Click on the Active round
2. For each match, click **"Edit Result"**
3. Select result: **H** (Home), **U** (Draw), **A** (Away)
4. Click **"Save"**

### Finalizing Round

When all results are entered:

1. Click **"Set Final"**
2. Status changes: Active → Final
3. **Automatic:** Points calculation runs
4. Leaderboard updates automatically

---

## Scoring System

### Point Values

| Scenario | Points |
|----------|--------|
| Correct prediction (no multipliers) | 3 |
| Correct prediction + Banker | 6 |
| Correct prediction + MOTW | 6 |
| Correct prediction + Banker + MOTW | 12 |
| Wrong prediction | 0 |
| Wrong prediction + Banker | -3 |
| Wrong prediction + Banker + MOTW | -6 |
| No prediction submitted | 0 |

### Banker Rules

- ✅ ONE banker per player per round
- ✅ Doubles points (positive or negative)
- ✅ Can only be set on included matches (not postponed)
- ✅ Cannot be changed after locking

### Match of the Week (MOTW)

- ✅ ONE match per round selected by admin
- ✅ Doubles base points (3 → 6)
- ✅ Can be combined with banker for 12 points maximum
- ✅ Must be selected BEFORE publishing round

### Submission Rules

**Critical:** If a player does NOT:
- Submit predictions for all matches, OR
- Lock their predictions before admin locks the round

**Result:** Player receives 0 points for that round

---

## Testing Checklist

### Setup Verification
- [ ] App runs on localhost:5173
- [ ] Supabase connection works
- [ ] EmailJS credentials are valid
- [ ] Login page displays

### Authentication Testing
- [ ] Login with test user works
- [ ] User sees their name after login
- [ ] Admin user sees "Admin" in navigation
- [ ] Regular user does NOT see "Admin"
- [ ] Logout works
- [ ] Cannot access protected pages while logged out

### Round & Prediction Testing
- [ ] Admin can create a new round
- [ ] Admin can add 8 matches
- [ ] Admin can set MOTW
- [ ] Admin can publish round
- [ ] Players see "Active Now" page with round
- [ ] Players can submit predictions
- [ ] Players can select banker (only 1)
- [ ] Players can lock predictions

### Scoring Testing
- [ ] Enter match results
- [ ] Points calculate correctly
- [ ] Leaderboard updates
- [ ] Banker doubles points correctly
- [ ] MOTW applies correctly
- [ ] Wrong predictions show 0 points

### Email Testing
- [ ] Email sends when round is published
- [ ] Email sends when round is finalized
- [ ] Email contains correct information
- [ ] Check spam folder if not received

### Admin Panel Testing
- [ ] Can access admin pages
- [ ] Can see all rounds
- [ ] Can edit round details
- [ ] Can enter results
- [ ] Can postpone matches
- [ ] Can see all predictions (when locked/final)

---

## Troubleshooting

### Login Issues

**"Invalid login credentials"**
- Double-check email and password
- Ensure user account exists in Supabase
- Check that email confirmation is disabled (if using test accounts)

**"User not found"**
- Go to Supabase → Authentication → Users
- Create the user if it doesn't exist

### Database Issues

**"Connection refused"**
- Check Supabase project is running
- Verify URL in `.env.local` is correct
- Check internet connection

**"Permission denied" or RLS errors**
- Check Supabase → Authentication → Policies
- Ensure RLS policies are correctly set

### Email Issues

**Emails not sending**
- Check `.env.local` has correct EmailJS credentials
- Verify Service ID and Template IDs
- Check EmailJS dashboard for error logs
- Look in browser Console (F12) for errors
- Restart app after changing `.env.local`

**Emails going to spam**
- Add sender to contacts
- Check EmailJS domain reputation
- Consider using a verified email domain

### Performance Issues

**Slow loading**
- Check network tab in DevTools (F12)
- Look for slow API calls
- Verify Supabase connection quality
- Clear browser cache

**Points not updating**
- Verify Supabase trigger is enabled
- Check match has result entered
- Ensure predictions exist for that user

---

## Quick Reference

### Important Files

| File | Purpose |
|------|---------|
| `.env.local` | Environment variables (keep secret!) |
| `docs/database-schema.sql` | Database schema |
| `docs/scoring-logic.txt` | Detailed scoring rules |
| `docs/ADMIN-WORKFLOW.md` | Admin procedures |
| `src/lib/supabase.ts` | Supabase client config |
| `src/lib/emailService.ts` | EmailJS integration |

### Useful URLs

- **App:** http://localhost:5173
- **Supabase:** https://supabase.com
- **EmailJS:** https://www.emailjs.com
- **React Docs:** https://react.dev
- **Tailwind CSS:** https://tailwindcss.com

### Common Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check code style
npm install          # Install dependencies
```

---

## Support & Resources

### Documentation
- See `/docs/` folder for detailed guides
- `ADMIN-WORKFLOW.md` - Complete admin procedures
- `scoring-logic.txt` - Detailed scoring rules
- `UPDATES-FOR-DEVELOPER.md` - Recent changes

### Getting Help
1. Check the Troubleshooting section above
2. Review relevant documentation file
3. Check browser Console (F12) for error messages
4. Check Supabase dashboard for errors
5. Check EmailJS dashboard for email delivery status

### Next Steps
1. ✅ Complete all setup steps above
2. ✅ Create test account and verify login
3. ✅ Create first test round
4. ✅ Test prediction submission
5. ✅ Test email notifications
6. ✅ Invite real users when ready

---

**Happy predicting! 🎯**
