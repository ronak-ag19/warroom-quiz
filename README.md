# The War Room Quiz

A real-time KBC-style quiz app for Upstox intraday traders meetup.

## Game codes
- **Game code**: `1947` (share with participants)
- **Admin code**: `1234` (host only — go to `/admin`)

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Pusher (free)
1. Go to [pusher.com](https://pusher.com) and create a free account
2. Create a new **Channels** app
3. Choose cluster **ap2** (Mumbai, closest to India)
4. Copy your credentials

### 3. Create `.env.local`
```
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=ap2
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=ap2
```

### 4. Run locally
```bash
npm run dev
```

### 5. Deploy to Vercel
1. Push this folder to a GitHub repo using GitHub Desktop
2. Go to [vercel.com](https://vercel.com) → Import Project → select your repo
3. Add the same environment variables in Vercel project settings
4. Deploy

## How to run the quiz

1. Open `/admin` on your phone/laptop and enter admin code `1234`
2. Share the game URL with participants — they enter code `1947` and their name
3. When everyone has joined, press **Start Quiz**
4. 90 second timer begins — all questions are visible and players can answer at their own pace
5. After time's up (or you press End Quiz), leaderboard auto-shows
6. Use **Reveal Answer** buttons to go through each question with the group

## Scoring
- Correct answer: **100 points**
- Speed bonus: up to **50 extra points** (faster = more points)
- Wrong answer: **0 points**

## Notes
- The in-memory state resets if Vercel cold-starts a new instance. For a production-grade setup, add [Upstash Redis](https://upstash.com) (free tier) — but for a single session meetup, this works perfectly.
- Mobile-optimised for all screens.
