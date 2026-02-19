# EmailJS Setup Guide

Automatic email notifications for players when rounds are published or finalized.

## 📧 What Gets Sent

### 1. **Round Active Notification**
- Sent when admin clicks "Publish Round"
- Notifies all players that predictions are now open
- Includes deadline and link to make predictions

### 2. **Round Final Notification**
- Sent when admin clicks "Set Final"
- Notifies all players that results are published
- Includes link to view results

---

## 🚀 Setup Instructions

### Step 1: Create EmailJS Account

1. Go to [https://www.emailjs.com](https://www.emailjs.com)
2. Click "Sign Up" (free account - 200 emails/month)
3. Verify your email address

### Step 2: Add Email Service

1. In EmailJS dashboard, go to **"Email Services"**
2. Click **"Add New Service"**
3. Choose your email provider:
   - **Gmail** (easiest)
   - Outlook
   - Yahoo
   - Or any SMTP service
4. Follow the connection steps
5. **Save the Service ID** (looks like `service_xxxxxxx`)

### Step 3: Create Email Templates

#### Template 1: Round Active

1. Go to **"Email Templates"**
2. Click **"Create New Template"**
3. Name it: `Round Active Notification`
4. **Save the Template ID** (looks like `template_xxxxxxx`)
5. Use this template:

```
Subject: {{subject}}

Hi {{to_name}},

🎯 {{round_type}} is now OPEN for predictions!

Deadline: {{deadline}}

Make your predictions now:
{{app_url}}

Good luck! 🍀

---
The Hub - Premier League Predictions
```

#### Template 2: Round Final

1. Create another template
2. Name it: `Round Final Notification`
3. **Save the Template ID**
4. Use this template:

```
Subject: {{subject}}

Hi {{to_name}},

🏆 {{round_type}} results are now FINAL!

Check your score and see how you did:
{{app_url}}

Great job! 🎉

---
The Hub - Premier League Predictions
```

### Step 4: Get Your Public Key

1. Go to **"Account"** → **"General"**
2. Find **"Public Key"** section
3. Copy your public key (looks like `xxxxxxxxxxxxxxxxxx`)

### Step 5: Configure Environment Variables

Create a `.env` file in your project root (if it doesn't exist) and add:

```env
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ROUND_ACTIVE=template_xxxxxxx
VITE_EMAILJS_TEMPLATE_ROUND_FINAL=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxxxxx
```

**Replace the `xxxxxxx` with your actual IDs from EmailJS!**

### Step 6: Restart Your App

```bash
# Stop the dev server (Ctrl+C)
# Start it again
npm run dev
# or
bun run dev
```

---

## ✅ Testing

### Test Notifications:

1. Go to **Admin Panel** → **Create/Edit Round**
2. Click **"Publish Round"**
   - You should see toast: "📧 Notifications sent to X player(s)"
   - Check your email inbox
3. Add some results and click **"Set Final"**
   - You should see toast: "📧 Results sent to X player(s)"
   - Check your email inbox again

### If emails don't arrive:

1. **Check spam folder**
2. **Verify environment variables** are set correctly
3. **Check EmailJS dashboard** for error logs
4. **Check browser console** for any errors
5. Make sure you restarted the app after adding `.env` variables

---

## 🎯 Adding Real Player Emails

Currently using mock emails. To use real player emails:

### Option 1: Update Mock Data (Quick Test)

Edit `/src/pages/v1/AdminRound.tsx` and update the `mockPlayers` array:

```typescript
const mockPlayers = [
  { email: 'james@example.com', name: 'James' },
  { email: 'player2@example.com', name: 'Player 2' },
  // ... add your 8 players
];
```

### Option 2: Store in Database (Production)

1. Add email field to users table in Supabase
2. Fetch users from database instead of mock data
3. Example:

```typescript
// Fetch from Supabase
const { data: players } = await supabase
  .from('users')
  .select('email, name');

notifyAllPlayers(players, 'active', {...});
```

---

## 💰 Pricing

### Free Tier (More than enough!)
- **200 emails/month** FREE
- For 8 players:
  - 2 notifications per round (active + final)
  - 8 players × 2 = 16 emails per round
  - Can handle ~12 rounds/month for free
  - ~160 emails for full 38-round season

### Paid Plans (if needed)
- $7/month for 1,000 emails
- $15/month for 3,000 emails

---

## 🔧 Troubleshooting

### "Email notifications not configured"
- Environment variables not set or incorrect
- Check `.env` file exists and has correct values
- Restart dev server

### Emails not arriving
- Check EmailJS dashboard for send logs
- Verify email service is connected
- Check spam folder
- Test with EmailJS "Test" button in dashboard

### "Failed to notify X players"
- Check browser console for errors
- Verify template IDs are correct
- Check EmailJS quota (free: 200/month)

---

## 🎨 Customizing Email Templates

You can customize the email templates in EmailJS dashboard:

1. Add your logo
2. Change colors
3. Add more information
4. Include league table position
5. Add round statistics

Available variables in templates:
- `{{to_name}}` - Player name
- `{{to_email}}` - Player email
- `{{round_number}}` - Round number
- `{{round_type}}` - "Round X" or "Postponed Game"
- `{{deadline}}` - Deadline date/time
- `{{app_url}}` - Link to app
- `{{subject}}` - Email subject

---

## 📱 Future: WhatsApp Integration

Want WhatsApp notifications instead? See `docs/WHATSAPP-SETUP.md` (coming soon)

Or contact me for Twilio WhatsApp API setup guide!

---

## ✨ Benefits

✅ Players never miss a round
✅ Automatic notifications - set and forget
✅ Professional communication
✅ Free for your league size
✅ Easy to set up (10 minutes)
