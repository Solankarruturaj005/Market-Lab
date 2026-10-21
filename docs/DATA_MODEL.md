# Market Lab — Data Model Specification & Migration Guide

## Phase 2A — Field-Accurate Schema Inventory & Target Architecture

This document provides a field-accurate inventory of the active PostgreSQL database schema managed by Prisma ORM in `backend/prisma/schema.prisma`. It also specifies a target conceptual schema and a safe, non-destructive migration roadmap for future scaling.

---

## 1. Active Implemented Schema Inventory

The live PostgreSQL database contains 6 models. Integer primary keys (`Int @id @default(autoincrement())`) are used consistently across all entities.

### Model: `User`
Manages account identity, credential hashes, and OTP state.

| Field | Prisma Type | DB Type | Constraints | Description | Backend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `Int` | `serial` | Primary Key | Auto-incrementing identifier | All services |
| `email` | `String` | `varchar` | Unique Index | User email address (case-normalized) | `AuthService`, `UserService` |
| `password` | `String` | `text` | Required | Bcrypt salted hash (cost factor 10-12) | `AuthService` |
| `name` | `String?` | `varchar` | Optional | Analyst display name | `AuthService`, `UserService` |
| `isVerified` | `Boolean` | `boolean` | Default `false` | Email activation flag | `AuthService` |
| `otp` | `String?` | `varchar` | Optional | 6-digit verification code | `AuthService` |
| `otpExpiry` | `DateTime?`| `timestamptz` | Optional | Timestamp when OTP becomes invalid | `AuthService` |
| `createdAt` | `DateTime` | `timestamptz` | Default `now()` | Account creation timestamp | Audit |
| `updatedAt` | `DateTime` | `timestamptz` | Auto-update | Last modification timestamp | Audit |

- **Relationships**:
  - `watchlists`: `Watchlist[]` (1-to-many)
  - `alerts`: `Alert[]` (1-to-many)

---

### Model: `Stock`
Represents an equity instrument and its current cached snapshot.

| Field | Prisma Type | DB Type | Constraints | Description | Backend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `Int` | `serial` | Primary Key | Auto-incrementing identifier | All services |
| `symbol` | `String` | `varchar` | Unique Index | Ticker symbol (e.g. `AAPL`, `MSFT`) | `StockService`, `PredictionService` |
| `name` | `String` | `varchar` | Required | Company legal/trade name | `StockService` |
| `price` | `Float` | `double precision`| Required | Latest closing/snapshot price | `StockService`, `AlertService` |
| `change` | `Float` | `double precision`| Required | 24-hour price change percentage | `StockService` |
| `volume` | `Float` | `double precision`| Required | Daily trading volume | `StockService` |
| `createdAt` | `DateTime` | `timestamptz` | Default `now()` | Ingestion timestamp | System |

- **Relationships**:
  - `prices`: `StockPrice[]` (1-to-many historical candles)
  - `predictions`: `Prediction[]` (1-to-many historical signals)
  - `watchlists`: `Watchlist[]` (1-to-many watchlist references)
  - `alerts`: `Alert[]` (1-to-many user price triggers)

---

### Model: `StockPrice`
Historical OHLCV (Open, High, Low, Close, Volume) daily candle records.

| Field | Prisma Type | DB Type | Constraints | Description | Backend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `Int` | `serial` | Primary Key | Auto-incrementing identifier | Internal |
| `date` | `DateTime` | `timestamptz` | Part of compound unique | Trading date timestamp | `StockService`, `IndicatorService` |
| `open` | `Float` | `double precision`| Required | Opening session price | `IndicatorService` |
| `high` | `Float` | `double precision`| Required | Daily session peak price | `IndicatorService` |
| `low` | `Float` | `double precision`| Required | Daily session trough price | `IndicatorService` |
| `close` | `Float` | `double precision`| Required | Daily session closing price | `IndicatorService`, Charts |
| `volume` | `Float` | `double precision`| Required | Session shares traded | `IndicatorService`, Charts |
| `stockId` | `Int` | `integer` | Foreign Key -> `Stock(id)` | Parent equity identifier | `StockService` |

- **Constraints & Indexes**:
  - `@@unique([stockId, date])`: Guarantees idempotency and prevents duplicate daily bars for any symbol.

---

### Model: `Prediction`
Stores deterministic consensus indicator verdicts and confidence scores.

| Field | Prisma Type | DB Type | Constraints | Description | Backend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `Int` | `serial` | Primary Key | Auto-incrementing identifier | Internal |
| `stockId` | `Int` | `integer` | Foreign Key -> `Stock(id)` | Evaluated equity identifier | `PredictionService` |
| `signal` | `String` | `varchar` | Required | Consensus: `BUY`, `SELL`, `HOLD` | `PredictionService` |
| `confidence`| `Float` | `double precision`| Required | Metric confidence score (0-100) | `PredictionService` |
| `indicators`| `Json?` | `jsonb` | Optional | Serialized SMA, EMA, RSI, MACD | `PredictionService` |
| `createdAt` | `DateTime` | `timestamptz` | Default `now()` | Calculation timestamp | Audit |

---

### Model: `Watchlist`
Associates an authenticated user with a tracked equity.

| Field | Prisma Type | DB Type | Constraints | Description | Backend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `Int` | `serial` | Primary Key | Auto-incrementing identifier | Internal |
| `userId` | `Int` | `integer` | Foreign Key -> `User(id)` | Watchlist owner identifier | `WatchlistService` |
| `stockId` | `Int` | `integer` | Foreign Key -> `Stock(id)` | Saved equity identifier | `WatchlistService` |
| `createdAt` | `DateTime` | `timestamptz` | Default `now()` | Timestamp added to focus list | UI sorting |

- **Constraints & Indexes**:
  - `@@unique([userId, stockId])`: Prevents duplicate entries of the same stock in a user's watchlist.

---

### Model: `Alert`
Configures user threshold price alerts.

| Field | Prisma Type | DB Type | Constraints | Description | Backend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `Int` | `serial` | Primary Key | Auto-incrementing identifier | Internal |
| `targetPrice`| `Float` | `double precision`| Required (> 0) | Threshold price level | `AlertService` |
| `triggerType`| `String` | `varchar` | `ABOVE` or `BELOW` | Directional condition | `AlertService` |
| `isActive` | `Boolean` | `boolean` | Default `true` | Active monitoring status | `AlertService` |
| `userId` | `Int` | `integer` | Foreign Key -> `User(id)` | Alert creator identifier | `AlertService` |
| `stockId` | `Int` | `integer` | Foreign Key -> `Stock(id)` | Monitored equity identifier | `AlertService` |
| `createdAt` | `DateTime` | `timestamptz` | Default `now()` | Alert registration timestamp | Audit |

---

## 2. Target Conceptual Schema (Proposed for Phase 3)

The target conceptual schema introduces normalized multiple watchlists and persistent AI analyses while maintaining 100% backward compatibility.

```prisma
// PROPOSED TARGET SCHEMA (NOT YET APPLIED - PHASE 3 PROPOSAL)

model User {
  id          Int         @id @default(autoincrement())
  email       String      @unique
  password    String
  name        String?
  isVerified  Boolean     @default(false)
  otp         String?
  otpExpiry   DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  watchlists  Watchlist[]
  alerts      PriceAlert[]
  aiAnalyses  AiAnalysis[]
}

// Normalized Parent Watchlist container (enables multiple named lists per user)
model Watchlist {
  id          Int             @id @default(autoincrement())
  userId      Int
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String          @default("Default Watchlist")
  isDefault   Boolean         @default(true)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  items       WatchlistItem[]

  @@unique([userId, name])
}

// Child WatchlistItem
model WatchlistItem {
  id          Int        @id @default(autoincrement())
  watchlistId Int
  watchlist   Watchlist  @relation(fields: [watchlistId], references: [id], onDelete: Cascade)
  stockId     Int
  stock       Stock      @relation(fields: [stockId], references: [id], onDelete: Cascade)
  addedAt     DateTime   @default(now())

  @@unique([watchlistId, stockId])
  @@index([stockId])
}

// Renamed/Extended PriceAlert with decimal precision and trigger timestamps
model PriceAlert {
  id            Int        @id @default(autoincrement())
  userId        Int
  user          User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  stockId       Int
  stock         Stock      @relation(fields: [stockId], references: [id], onDelete: Cascade)
  targetPrice   Decimal    @db.Decimal(12, 4)
  triggerType   String     // "ABOVE" | "BELOW"
  isActive      Boolean    @default(true)
  triggeredAt   DateTime?
  notifiedAt    DateTime?
  createdAt     DateTime   @default(now())

  @@index([userId, isActive])
  @@index([stockId, isActive])
}

// Persistent AI Analysis History
model AiAnalysis {
  id          Int        @id @default(autoincrement())
  userId      Int
  user        User       @relation(fields: [userId], references: [id])
  stockId     Int
  stock       Stock      @relation(fields: [stockId], references: [id])
  signal      String     // "BUY" | "SELL" | "HOLD"
  confidence  Float
  summary     String     @db.Text
  reasoning   String     @db.Text
  createdAt   DateTime   @default(now())

  @@index([stockId, createdAt])
}
```

---

## 3. Migration Safety & Backfill Strategy

To transition from the current schema to the target schema without downtime or data corruption, follow this phased migration plan:

### Step 1: Additive Schema Migration (Non-Destructive)
1. Generate migration creating `WatchlistItem` and `AiAnalysis`.
2. Alter `Watchlist` table to add `name` and `isDefault` columns with default values.
3. Keep current `Watchlist.stockId` column temporarily to avoid breaking live running queries.

### Step 2: Backfill Script
```sql
-- Create default watchlists for existing users who have watchlist items
INSERT INTO "Watchlist" ("userId", "name", "isDefault", "createdAt", "updatedAt")
SELECT DISTINCT "userId", 'Default Watchlist', true, NOW(), NOW()
FROM "Watchlist"
ON CONFLICT DO NOTHING;

-- Populate WatchlistItem from existing Watchlist records
INSERT INTO "WatchlistItem" ("watchlistId", "stockId", "addedAt")
SELECT w.id, old.stockId, old.createdAt
FROM "Watchlist" old
JOIN "Watchlist" w ON w."userId" = old."userId" AND w."isDefault" = true
ON CONFLICT DO NOTHING;
```

### Step 3: Application Dual-Write & Switchover
1. Update `WatchlistService` to query `WatchlistItem`.
2. Verify all user watchlist counts match exactly.
3. Remove deprecated `stockId` column from `Watchlist` in a subsequent release.

### Rollback Plan
If any step fails, restore the Prisma schema to Phase 2A state. Because existing tables and records were preserved additively, zero data rollback loss occurs.
