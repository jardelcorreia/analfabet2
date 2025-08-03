# AnalfaBet

A betting system for friends for the Brazilian Championship.

## 🚀 Features

- **Authentication**: Complete login, registration, and email confirmation system.
- **Private Leagues**: Create leagues among friends with unique codes.
- **Real-Time Betting**: Bet on the scores of the Brasileirão games.
- **Scoring System**:
  - 3 points for the exact score.
  - 1 point for the correct result (win/draw/loss).
- **Dynamic Ranking**: Track your position with tie-breaking by exact scores.
- **Complete History**: View all your bets and results.
- **Landing Page**: An informative and appealing landing page for new users.

## 🛠️ Technologies

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Serverless functions deployed on Netlify
- **Database**: Neon (Serverless PostgreSQL)
- **API for game data**: TheSportsDB.com
- **Key Libraries**:
  - `react-router-dom` for routing
  - `lucide-react` for icons
  - `axios` for HTTP requests
  - `date-fns` for date manipulation
  - `jsonwebtoken` & `bcryptjs` for authentication
  - `nodemailer` for email confirmations

## ⚙️ Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd analfa-bet
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Neon Database
1. Go to [neon.tech](https://neon.tech) and create a new project.
2. In the Neon SQL editor, run the migration files located in the `supabase/migrations` directory in chronological order.
3. Get the connection string for your database.

### 4. Set up environment variables
Create a `.env` file in the root of the project and add the following variables:

```env
VITE_DATABASE_URL=<your-neon-connection-string>
VITE_JWT_SECRET=<your-secure-jwt-secret>
VITE_SPORTSDB_API_KEY=<your-thesportsdb-api-key>
# Add your email provider credentials for nodemailer
EMAIL_HOST=<your-email-host>
EMAIL_PORT=<your-email-port>
EMAIL_USER=<your-email-user>
EMAIL_PASS=<your-email-password>
```

### 5. Run the project
To start the development server, run:
```bash
npm run dev
```

## 📜 Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run lint`: Lints the code using ESLint.
- `npm run preview`: Previews the production build locally.
- `npm run populate-matches`: A script to populate the database with match data from TheSportsDB.

## 🏆 Scoring System

- **Exact Score**: 3 points (e.g., you bet 2x1, the result was 2x1).
- **Correct Result**: 1 point (e.g., you bet 2x1, the result was 3x0 - both are home team wins).
- **Wrong Result**: 0 points.

## 📊 Ranking

The ranking is sorted by:
1. **Total points** (highest to lowest).
2. **Number of exact scores** (tie-breaker).
3. **Date of entry into the league** (oldest first).

## 🤝 Contribution

This is a demonstration project. To contribute:
1. Fork the project.
2. Create a branch for your feature.
3. Commit your changes.
4. Push to the branch.
5. Open a Pull Request.

## 📄 License

MIT License - see the LICENSE file for details.
