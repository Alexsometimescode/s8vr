# s8vr Backend API

Backend server for the s8vr invoicing platform.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Set up PostgreSQL database:**
   - Install PostgreSQL if not already installed
   - Create database: `createdb s8vr`
   - Update `DATABASE_URL` in `.env`

4. **Run development server:**
   ```bash
   npm run dev
   ```

   Server will run on http://localhost:3001

## Environment Variables

See `.env.example` for required variables.

## Project Structure

```
backend/
├── src/
│   ├── server.ts          # Main Express server
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── models/            # Data models
│   └── db/                # Database connection
├── migrations/            # Database migrations
├── .env                   # Environment variables (not in git)
└── package.json
```

## API Endpoints

- `GET /health` - Health check
- `GET /api` - API info

More endpoints to be added...

