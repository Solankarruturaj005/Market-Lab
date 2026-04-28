# API Documentation

## Authentication Endpoints

### 1. Register User
- **Endpoint**: `POST /auth/register`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }
  ```
- **Response**: Returns JWT access token and user object.

### 2. Login User
- **Endpoint**: `POST /auth/login`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**: Returns JWT access token and user object.

---

## Stocks Endpoints

*(Requires Authorization Header: `Bearer <token>`)*

### 1. Get All Stocks
- **Endpoint**: `GET /stocks`
- **Response**: Returns an array of available stock objects.

### 2. Get Stock by Symbol
- **Endpoint**: `GET /stocks/:symbol`
- **Response**: Returns detailed information for a specific stock by its symbol (e.g. `AAPL`).

---

## Prediction Endpoint

*(Requires Authorization Header: `Bearer <token>`)*

### 1. Get Stock Prediction
- **Endpoint**: `GET /prediction/:symbol`
- **Response**:
  ```json
  {
    "symbol": "AAPL",
    "prediction": "Buy",
    "confidence": 80,
    "indicators": {
      "sma20": 145.20,
      "ema20": 146.10,
      "rsi14": 42.15,
      "macdHistogram": 1.5
    }
  }
  ```

---

## Watchlist Endpoints

*(Requires Authorization Header: `Bearer <token>`)*

### 1. Get User's Watchlist
- **Endpoint**: `GET /watchlist`
- **Response**: Returns the array of stocks saved in the user's watchlist.

### 2. Add Stock to Watchlist
- **Endpoint**: `POST /watchlist`
- **Body**:
  ```json
  {
    "stockId": 1
  }
  ```
- **Response**: Returns the created watchlist entry.

### 3. Remove Stock from Watchlist
- **Endpoint**: `DELETE /watchlist/:stockId`
- **Response**: Returns confirmation of deletion.
