# BookmarkHub

A collaborative bookmark sharing platform for the ServiceNow community.

## Features

- 🔍 Search and discover curated ServiceNow bookmarks
- 👥 Group-based access control with secret codes
- ⭐ Rating and favorites system
- 💬 Comments on bookmarks
- 📊 Contributor leaderboard
- 🏷️ Tag-based filtering
- 📱 Mobile-responsive design

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sylvainservicenow/bookmarkhub1.git
cd bookmarkhub1
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
```

4. Update `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## License

MIT
