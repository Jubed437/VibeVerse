# VibeVerse 🌟

An AI-powered emotional wellness companion that helps you reflect, track moods, chat with AI, journal your feelings, and receive personalized recommendations for mental well-being.

## 📖 Solution Overview

VibeVerse addresses the growing need for accessible mental health support by combining AI technology with personalized wellness tools.

**What We Offer:**
- 🎯 **Personalized Experience** - Intelligent onboarding adapts to your demographics, stress levels, and communication style
- 🤖 **AI Companion** - Empathetic conversations powered by Groq API that understand your emotional context
- 📊 **Mood Analytics** - Visual tracking of emotional patterns to identify triggers and trends
- ✍️ **Reflective Tools** - Smart journaling with AI insights and mood-based music recommendations
- 👥 **Community Support** - Anonymous platform for sharing wellness experiences
- 🔒 **Privacy-First** - Secure authentication with Row Level Security protecting your data

**Target Users:** Working professionals, students, and anyone seeking accessible emotional wellness support.

## 🚀 Features

- **AI Chat Companion** - Talk with an empathetic AI that understands your emotions
- **Mood Tracking** - Log and visualize your emotional patterns over time
- **Smart Journal** - Write reflections with AI-powered insights
- **Music Recommendations** - Get personalized playlists based on your mood
- **Community Stories** - Share and read anonymous wellness experiences
- **Personalized Dashboard** - Tailored content based on your profile and preferences

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first styling
- **Radix UI + shadcn/ui** - Accessible component library
- **Lucide React** - Icon library

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (email/password + anonymous)
  - Row Level Security (RLS)
  - Real-time subscriptions

### AI Integration
- **Groq API** - AI chat functionality

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **bun**
- **Supabase Account** (free tier works)
- **Groq API Key** (for AI chat)

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd VibeVerse
```

### 2. Install Dependencies
```bash
npm install
# or
bun install
```

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Project Settings → API**
3. Copy your **Project URL** and **anon public key**
4. Go to **SQL Editor** and run the schema from `supabase-schema.sql`
5. Enable anonymous sign-ins:
   - Go to **Authentication → Providers**
   - Toggle ON "Anonymous sign-ins"
6. (Optional) Disable email confirmation for testing:
   - Go to **Authentication → Providers → Email**
   - Toggle OFF "Confirm email"

### 4. Configure Environment Variables

Create two files in the root directory:

#### `.env.local` (Supabase credentials)
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### `.env` (API keys)
```env
VITE_GROQ_API_KEY=your_groq_api_key
```

**Important**: Never commit `.env.local` to version control. It's already in `.gitignore`.

### 5. Run the Development Server
```bash
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:8080`

## 🗄️ Database Schema

The project uses 6 main tables:
- `profiles` - User basic information
- `user_profiles` - Onboarding data and preferences
- `mood_entries` - Mood tracking history
- `chat_messages` - AI conversation history
- `journal_entries` - Personal journal posts
- `community_stories` - Anonymous community posts

All tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

## 🔐 Authentication

- **Email/Password** - Standard authentication
- **Guest Mode** - Anonymous authentication for quick access
- **Protected Routes** - Automatic redirect to login if not authenticated

## 📁 Project Structure

```
VibeVerse/
├── src/
│   ├── components/      # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities (Supabase client, helpers)
│   ├── pages/          # Route pages
│   ├── App.jsx         # Main app component
│   └── main.jsx        # Entry point
├── public/             # Static assets
├── .env                # API keys (not committed)
├── .env.local          # Supabase credentials (not committed)
└── supabase-schema.sql # Database schema
```

## 🚀 Build for Production

```bash
npm run build
# or
bun run build
```

The production build will be in the `dist/` folder.

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Troubleshooting

### "Invalid API key" error
- Verify `.env.local` has correct Supabase credentials
- Restart the dev server after changing environment variables

### Can't login after signup
- Check if email confirmation is disabled in Supabase
- Verify the user exists in **Authentication → Users**

### Profile data not showing
- Ensure onboarding was completed
- Check **Table Editor → user_profiles** in Supabase
- Check browser console for errors

### Database connection issues
- Verify Supabase project is active
- Check if RLS policies are enabled
- Review Supabase logs in **Project Settings → Logs**

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ for emotional wellness
