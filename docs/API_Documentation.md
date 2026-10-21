# Market Lab — Complete REST API Documentation

## Phase 2A — Comprehensive Route Inventory & Contract Specification

This document details the actual, active REST API contracts provided by the NestJS application (default port `5000`). All endpoints are cataloged from real controller decorators, DTO schemas, and authentication guards.

---

## 1. Authentication & Identity Subsystem

Base Path: `/auth`

### 1.1 Register User Account
- **Route**: `POST /auth/register`
- **Authentication**: None (Public)
- **Dependencies**: `AuthService`, `UserService`, `PrismaService`, Nodemailer SMTP
- **Request Body**:
  ```json
  {
    "email": "analyst@example.com",
    "password": "SecurePassword123!",
    "name": "Jane Analyst"
  }
  ```
- **Validation Rules**:
  - `email`: Valid email format, normalized to lowercase.
  - `password`: String, non-empty, minimum recommended length 8 characters.
  - `name`: String, optional.
- **Success Response**: `201 Created`
  ```json
  {
    "message": "Verification code sent to your email"
  }
  ```
- **Error Codes**:
  - `400 Bad Request`: Email or password missing; or email belongs to an existing verified user.
  - `400 Bad Request`: Rate limit active ("Please wait X seconds before requesting a new verification code").
  - `409 Conflict`: Registration already pending for this email with an active unexpired code.
  - `503 Service Unavailable`: SMTP email delivery failure.

### 1.2 Verify Email OTP
- **Route**: `POST /auth/verify-otp`
- **Authentication**: None (Public)
- **Dependencies**: `AuthService`, `UserService`, `PrismaService`
- **Request Body**:
  ```json
  {
    "email": "analyst@example.com",
    "otp": "482910"
  }
  ```
- **Validation Rules**:
  - `email`: Required valid email string.
  - `otp`: Required 6-digit numeric string.
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Email verified successfully"
  }
  ```
- **Error Codes**:
  - `400 Bad Request`: Invalid verification code; or maximum 5 attempts exceeded (invalidated).
  - `400 Bad Request`: Verification code has expired (> 5 minutes).
  - `404 Not Found`: No registered account found for provided email.

### 1.3 User Login
- **Route**: `POST /auth/login`
- **Authentication**: None (Public)
- **Dependencies**: `AuthService`, `UserService`, `JwtService`
- **Request Body**:
  ```json
  {
    "email": "analyst@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "analyst@example.com",
      "name": "Jane Analyst"
    }
  }
  ```
- **Error Codes**:
  - `400 Bad Request`: Invalid email or password.
  - `400 Bad Request`: Account email is unverified (must complete OTP verification).
  - `429 Too Many Requests`: Account temporarily locked out after 5 consecutive failed attempts (5-minute cooldown).

---

## 2. User Profile Subsystem

Base Path: `/users`

### 2.1 Get Current User Profile
- **Route**: `GET /users/profile`
- **Authentication**: Required (`Bearer <JWT>`)
- **Dependencies**: `UserService`, `PrismaService`
- **Success Response**: `200 OK`
  ```json
  {
    "id": 1,
    "email": "analyst@example.com",
    "name": "Jane Analyst",
    "isVerified": true,
    "createdAt": "2026-10-21T18:00:00.000Z",
    "updatedAt": "2026-10-21T18:00:00.000Z"
  }
  ```
- **Error Codes**:
  - `401 Unauthorized`: Missing, expired, or invalid bearer token.

---

## 3. Market Data & Stock Subsystem

Base Path: `/stocks`

### 3.1 Get All Tracked Equities
- **Route**: `GET /stocks`
- **Authentication**: None (Public browse allowed)
- **Dependencies**: `StockService`, `PrismaService`
- **Success Response**: `200 OK`
  ```json
  [
    {
      "id": 1,
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "price": 280.14,
      "change": 1.25,
      "volume": 52000000,
      "isFallback": false,
      "source": "live",
      "history": [
        { "date": "2026-10-20T00:00:00.000Z", "close": 278.89, "open": 277.5, "high": 281.0, "low": 277.0, "volume": 51000000 }
      ]
    }
  ]
  ```

### 3.2 Get Stock Details by Symbol
- **Route**: `GET /stocks/:symbol`
- **Authentication**: None (Public browse allowed)
- **Path Parameters**: `symbol` (e.g., `AAPL`, `MSFT`)
- **Dependencies**: `StockService`, `PrismaService`
- **Success Response**: `200 OK` (Returns full 365-day historical price points)

### 3.3 Get Live Stock Quote (Throttled & Cached)
- **Route**: `GET /stocks/live/:symbol`
- **Authentication**: None (Public)
- **Dependencies**: `StockApiService`, In-Memory Cache (600s TTL), Alpha Vantage API, PostgreSQL fallback
- **Success Response**: `200 OK`
  ```json
  {
    "symbol": "AAPL",
    "price": 280.14,
    "change": 1.25,
    "volume": 52000000,
    "isFallback": false,
    "source": "live"
  }
  ```

---

## 4. Technical Indicator & Prediction Subsystem

Base Path: `/prediction`

### 4.1 Get Quantitative Prediction for Symbol
- **Route**: `GET /prediction/:symbol`
- **Authentication**: None (Public)
- **Dependencies**: `PredictionService`, `IndicatorService`, `StockService`
- **Path Parameters**: `symbol` (e.g., `NVDA`)
- **Success Response**: `200 OK`
  ```json
  {
    "symbol": "NVDA",
    "prediction": "BUY",
    "confidence": 78.5,
    "indicators": {
      "sma": 142.30,
      "ema": 143.10,
      "rsi": 44.20,
      "macd": {
        "macd": 1.85,
        "signal": 1.20,
        "histogram": 0.65
      }
    }
  }
  ```

---

## 5. Watchlist Subsystem

Base Path: `/watchlist`

### 5.1 Get User Watchlist
- **Route**: `GET /watchlist`
- **Authentication**: Required (`Bearer <JWT>`)
- **Dependencies**: `WatchlistService`, `PrismaService`
- **Success Response**: `200 OK`
  ```json
  [
    {
      "id": 14,
      "userId": 1,
      "stockId": 3,
      "createdAt": "2026-10-21T19:00:00.000Z",
      "stock": {
        "id": 3,
        "symbol": "MSFT",
        "name": "Microsoft Corporation",
        "price": 448.20,
        "change": -0.45,
        "volume": 21000000
      }
    }
  ]
  ```

### 5.2 Add Stock to Watchlist
- **Route**: `POST /watchlist`
- **Authentication**: Required (`Bearer <JWT>`)
- **Request Body**:
  ```json
  {
    "stockId": 3
  }
  ```
- **Validation Rules**: `stockId` must be a positive integer.
- **Success Response**: `201 Created`
- **Error Codes**:
  - `400 Bad Request`: Stock is already present in user's watchlist.
  - `404 Not Found`: `stockId` does not exist in `Stock` table.

### 5.3 Remove Stock from Watchlist
- **Route**: `DELETE /watchlist/:id`
- **Authentication**: Required (`Bearer <JWT>`)
- **Path Parameters**: `id` (numeric stock ID)
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Stock removed from watchlist"
  }
  ```

---

## 6. Price Alert Subsystem

Base Path: `/alerts`

### 6.1 Get User Alerts
- **Route**: `GET /alerts`
- **Authentication**: Required (`Bearer <JWT>`)
- **Dependencies**: `AlertService`, `PrismaService`
- **Success Response**: `200 OK`
  ```json
  [
    {
      "id": 5,
      "userId": 1,
      "stockId": 1,
      "targetPrice": 300.00,
      "triggerType": "ABOVE",
      "isActive": true,
      "createdAt": "2026-10-21T19:30:00.000Z",
      "stock": {
        "id": 1,
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "price": 280.14
      }
    }
  ]
  ```

### 6.2 Create Price Alert
- **Route**: `POST /alerts`
- **Authentication**: Required (`Bearer <JWT>`)
- **Request Body**:
  ```json
  {
    "stockId": 1,
    "targetPrice": 300.00,
    "triggerType": "ABOVE"
  }
  ```
- **Validation Rules**:
  - `stockId`: Integer, required.
  - `targetPrice`: Number > 0, required.
  - `triggerType`: Enum `ABOVE` | `BELOW`.
- **Success Response**: `201 Created`

### 6.3 Delete Price Alert
- **Route**: `DELETE /alerts/:id`
- **Authentication**: Required (`Bearer <JWT>`)
- **Path Parameters**: `id` (numeric alert record ID)
- **Success Response**: `200 OK`

---

## 7. AI Intelligence & MarketBot Subsystem

Base Path: `/ai`

### 7.1 Automated Stock Synthesis
- **Route**: `POST /ai/analyze-stock`
- **Authentication**: Required (`Bearer <JWT>`)
- **Dependencies**: `AiService`, Google Gemini SDK
- **Request Body**:
  ```json
  {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "price": 280.14,
    "change": 1.25,
    "rsi": 54.2,
    "sma": 274.5,
    "ema": 276.1,
    "volume": 52000000
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "signal": "BUY",
    "confidence": 75,
    "summary": "Apple exhibits steady upward momentum above its 20-period moving average with healthy trading volume.",
    "reasoning": "RSI at 54.2 demonstrates balanced momentum with ample room before overbought thresholds. Moving averages confirm bullish trend continuation."
  }
  ```

### 7.2 MarketBot Interactive Chat
- **Route**: `POST /ai/chat`
- **Authentication**: Required (`Bearer <JWT>`)
- **Request Body**:
  ```json
  {
    "messages": [
      { "role": "user", "content": "Explain what a bullish MACD crossover means." }
    ]
  }
  ```
- **Success Response**: `200 OK`
  ```json
  {
    "reply": "A bullish MACD crossover occurs when the short-term MACD line crosses above the longer-term Signal line..."
  }
  ```

### 7.3 News Summarization
- **Route**: `POST /ai/summarize-news`
- **Authentication**: Required (`Bearer <JWT>`)
- **Request Body**:
  ```json
  {
    "symbol": "AAPL",
    "news": [
      { "title": "Apple announces quarterly results", "content": "Revenue grew 6% year-over-year..." }
    ]
  }
  ```
- **Success Response**: `200 OK`

---

## 8. System Health Endpoint

- **Route**: `GET /test`
- **Authentication**: None
- **Success Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "message": "Backend is running",
    "timestamp": "2026-10-22T00:00:00.000Z"
  }
  ```

---

## 9. Proposed Versioned API Migration (`/api/v1/*`)

For Phase 3 architectural evolution, unifying all routes under an `/api/v1` namespace is proposed:

| Current Route | Proposed Phase 3 Target | Notes |
| :--- | :--- | :--- |
| `POST /auth/register` | `POST /api/v1/auth/register` | Preserves existing DTO contract |
| `GET /stocks` | `GET /api/v1/stocks` | Adds pagination query params (`?limit=20&offset=0`) |
| `POST /ai/analyze-stock`| `POST /api/v1/analysis` | Aliased via NestJS controller routing |
| `GET /alerts` | `GET /api/v1/alerts` | Supports status filtering (`?status=active`) |

### Non-Disruptive Switchover Plan:
In `backend/src/main.ts`, invoke:
```typescript
app.setGlobalPrefix('api/v1', {
  exclude: ['test', 'health'],
});
```
To ensure zero frontend breakage, a lightweight URL-rewrite middleware can intercept non-prefixed paths during the deprecation period until all clients migrate.
