# Eliteserie 2026 Predictions - Developer Documentation

## Quick Start

This folder contains all the documentation your developer needs to build the backend for the Eliteserie 2026 Predictions platform.

## Files Overview

### 1. `database-schema.sql`
Complete Supabase database schema with:
- All tables and relationships
- Constraints and indexes
- Automatic scoring functions
- Database triggers
- Seed data (Eliteserie teams)

**How to use:** Copy and paste entire file into Supabase SQL Editor and run.

### 2. `api-functions-guide.txt`
All 18 API functions that need to be implemented:
- Admin functions (create rounds, matches, invitations, etc.)
- Player functions (predictions, locking, leaderboard, etc.)
- Realtime subscriptions
- Error handling patterns

**How to use:** Reference when building the API layer in `src/api/`

### 3. `scoring-logic.txt`
Complete scoring rules and calculations:
- Point values for all scenarios
- Conviction rules
- Match of the Week rules
- Examples of every scoring scenario
- Explanation of automated calculation

**How to use:** Reference to understand how points work and verify calculations

### 4. `setup-instructions.txt`
Step-by-step 3-week implementation plan:
- Week 1: Setup and database
- Week 2: Core features
- Week 3: Polish and deploy
- Testing checklists
- Troubleshooting guide

**How to use:** Follow this as your roadmap from start to finish

## Technology Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS (already built)
- **Backend:** Supabase (PostgreSQL, Auth, Realtime)
- **Email:** Resend or SendGrid (your choice)
- **Deployment:** Vercel or Netlify
- **League:** Eliteserie (Norwegian top division)

## Key Features to Implement

### Must Have (Week 1-2)
- [x] Database setup with all tables
- [ ] User authentication (invitation-based)
- [ ] Prediction submission and locking
- [ ] Admin panel (rounds, matches, results)
- [ ] Match of the Week designation
- [ ] Automatic scoring calculation

### Should Have (Week 3)
- [ ] Email invitations
- [ ] Realtime updates
- [ ] Round history
- [ ] Player comparison
- [ ] Leaderboard

### Nice to Have (Later)
- [ ] Email notifications for deadlines
- [ ] Push notifications
- [ ] Mobile app
- [ ] Multiple competitions

## Important Rules

### Banker
- ONE banker pick per round per player
- Doubles the points (positive or negative)
- Can only be set on included matches (not postponed)

### Match of the Week (MOTW)
- ONE match per round designated by admin
- Doubles base points to 6
- Can be combined with banker for 12 points

### Scoring
- Regular correct: 3 pts
- Banker correct: 6 pts
- MOTW correct: 6 pts
- MOTW + Banker correct: 12 pts (MAX)
- Wrong predictions: 0 pts (except banker: -3 or -6)

## Database Schema Overview

```
competitions
  └── rounds
       └── matches
            └── predictions

users
  └── invitations
  └── predictions
  └── leaderboard
  └── round_stats

teams (shared across all matches)
```

## Environment Variables Needed

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_APP_URL=http://localhost:5173 (or production URL)
RESEND_API_KEY=your_email_service_key (optional for MVP)
```

## Timeline

- **Week 1:** Database + Replace mock data with real queries
- **Week 2:** Authentication + Player features + Admin panel
- **Week 3:** Email system + Testing + Deploy

**Total:** 3 weeks to production-ready app

## Testing Checklist

Before deploying, verify:

- [ ] Users can register via invitation email
- [ ] Users can submit predictions for all matches
- [ ] Users can set one conviction per round
- [ ] Users can lock/unlock predictions before deadline
- [ ] Admin can create rounds and add matches
- [ ] Admin can designate Match of the Week
- [ ] Admin can enter results
- [ ] Points calculate automatically when results entered
- [ ] Round stats update when round finalized
- [ ] Leaderboard updates correctly
- [ ] All 8-10 initial users can play simultaneously

## Getting Help

### Documentation
- Supabase: https://supabase.com/docs
- React Query: https://tanstack.com/query/latest
- Tailwind CSS: https://tailwindcss.com/docs

### Common Issues
See `setup-instructions.txt` → Troubleshooting section

### Contact
If you run into issues, contact the project owner with:
1. Error messages (screenshots)
2. What you were trying to do
3. Steps to reproduce the issue

## Project Structure

```
eliteserie-predictions/
├── src/
│   ├── api/              # CREATE THIS - Supabase functions
│   ├── pages/            # EXISTS - UI pages (already built)
│   ├── components/       # EXISTS - UI components (already built)
│   ├── mockData.ts       # REPLACE - Use real data instead
│   └── types.ts          # EXISTS - TypeScript types
├── docs/                 # THIS FOLDER - Your reference
└── public/              # EXISTS - Static assets
```

## What's Already Done

✅ Complete UI design (all pages and components)
✅ Full user flows and interactions
✅ Responsive design (mobile + desktop)
✅ Component library (shadcn/ui)
✅ Routing setup (wouter)
✅ TypeScript types

## What You Need to Build

🔨 Supabase database setup
🔨 API layer to replace mock data
🔨 User authentication
🔨 Invitation system
🔨 Admin backend functions
🔨 Email service integration
🔨 Deployment

## Success Criteria

The app is ready when:
1. 8-10 people can register and play
2. Admin can manage rounds and matches
3. Predictions submit successfully
4. Scoring calculates automatically
5. Leaderboard updates in real-time
6. Everything works on mobile and desktop

---

**Good luck! The hard work (frontend) is done. You're connecting it to a real database. You've got this! 🚀**
