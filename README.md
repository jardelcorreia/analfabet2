# AnalfaBet

A betting system for friends for the Brazilian Championship.

## 🚀 Features

- **Authentication**: Complete login and registration system
- **Private Leagues**: Create leagues among friends with unique codes
- **Real-Time Betting**: Bet on the scores of the Brasileirão games
- **Scoring System**:
  - 3 points for the exact score
  - 1 point for the correct result (win/draw/loss)
- **Dynamic Ranking**: Track your position with tie-breaking by exact scores
- **Complete History**: View all your bets and results

## 🛠️ Technologies

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Database**: Neon (PostgreSQL)
- **API**: TheSportsDB.com for game data
- **Deployment**: Netlify
- **Icons**: Lucide React

## ⚙️ Setup

### 1. Clone and install dependencies
```bash
git clone <repository-url>
cd analfa-bet
npm install
```

### 2. Configure Neon Database
1. Go to [neon.tech](https://neon.tech) and create an account.
2. Create a new PostgreSQL project.
3. Apply the database migrations located in the `supabase/migrations` directory. You can do this by running the SQL files manually in the Neon SQL editor.
4. Copy the connection string.

### 3. Configure environment variables
Create a `.env` file in the root of the project and add the following variables:

```env
VITE_DATABASE_URL=<your-neon-connection-string>
VITE_JWT_SECRET=<your-secure-jwt-secret>
VITE_SPORTSDB_API_KEY=<your-thesportsdb-api-key>
```

### 4. Run the project
```bash
npm run dev
```

## 🎯 How to Use

1. **Register** or log in to the platform
2. **Create a league** or join an existing one using the code
3. **Place your bets** on the scheduled Brasileirão games
4. **Track the ranking** and see your results in real time

## 🏆 Scoring System

- **Exact Score**: 3 points (e.g., you bet 2x1, the result was 2x1)
- **Correct Result**: 1 point (e.g., you bet 2x1, the result was 3x0 - both are home team wins)
- **Wrong Result**: 0 points

## 📊 Ranking

The ranking is sorted by:
1. **Total points** (highest to lowest)
2. **Exact scores** (tie-breaker - highest to lowest)
3. **Date of entry into the league** (oldest first)

## 🗄️ Database Structure

- `users`: User data
- `leagues`: Created leagues
- `league_members`: League members
- `matches`: Brasileirão matches
- `bets`: User bets
- `user_stats`: Automatically calculated statistics

## 🔧 Deployment

The project is configured for automatic deployment on Netlify:

1. Connect your repository to Netlify
2. Configure the environment variables in the Netlify panel
3. Deployment will be automatic with every push to the main branch

## 📱 Responsive

Fully responsive interface, optimized for:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🎨 Design

- Modern design with green/yellow gradients (colors of Brazil)
- Smooth micro-interactions and animations
- Real-time visual feedback
- Intuitive and accessible interface

## 🔒 Security

- Passwords encrypted with bcrypt
- JWT authentication with expiration
- Data validation on the frontend and backend
- Protection against SQL injection

## 📈 Performance

- Lazy loading of components
- Bundle optimization with Vite
- Caching of static assets
- Optimized database queries

## 🤝 Contribution

This is a demonstration project. To contribute:

1. Fork the project
2. Create a branch for your feature
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see the LICENSE file for details.

---

Developed with ❤️ for lovers of Brazilian football!
