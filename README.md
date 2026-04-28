# Smart Stock Analysis & Prediction Dashboard

A full-stack web application designed for a final year engineering project. It visualizes market trends, provides a watchlist, and implements technical analysis indicators (SMA, EMA, RSI, MACD) to automatically generate Buy/Hold/Sell signals.

## Tech Stack
- **Frontend**: React (TypeScript, Vite), Recharts, Zustand, React, Vanilla CSS with dark mode dynamics. 
- **Backend**: NestJS (TypeScript), PostgreSQL, Prisma ORM, JWT authentication.

## Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database

## Setup Instructions

### 1. Database
Create a PostgreSQL database (e.g., `stock_db`). 

### 2. Backend Setup
```bash
cd backend
npm install

# Setup environment
cp .env.example .env

# Configure PostgreSQL URL & Secret in .env
# e.g.: DATABASE_URL="postgresql://user:password@localhost:5432/stock_db?schema=public"

# Format and migrate DB
npx prisma generate
npx prisma migrate dev --name init

# Seed database with mock stocks and history
npm run prisma:seed

# Start backend server
npm run start:dev
```
The backend API runs on `http://localhost:5000`

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start frontend development server
npm run dev
```
The frontend UI runs on `http://localhost:3000`

## Core Features
1. **JWT Custom Authentication** - Secure logic for logins/signups.
2. **Dashboard Overview** - At-a-glance market prices and performance.
3. **Smart Technical Analysis** - Auto-generated predictions from:
   - Simple Moving Average (SMA)
   - Exponential Moving Average (EMA)
   - Relative Strength Index (RSI)
   - MACD (Moving Average Convergence Divergence)
4. **Watchlists** - Save your favorite stocks to analyze later.
5. **Modern Dashboard Interface** - Glassmorphism, tailored styling without Tailwind.

## Project Structure
- `backend/src/indicator/strategies/` contains the logic calculating indicators.
- `backend/src/prediction/` connects indicator output directly towards REST endpoints.
- `frontend/src/pages/StockDetails.tsx` generates graphs utilizing pure history alongside analyzing outputs. 
