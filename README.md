# RideShare - Async Database Performance Demo

A complete ride-sharing application demonstrating the performance difference between **sequential (blocking)** and **asynchronous (parallel)** database operations.

![RideShare Demo](https://img.shields.io/badge/Demo-Live-brightgreen) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![React](https://img.shields.io/badge/React-18+-blue) ![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange)

## 🎯 Core Purpose

This project demonstrates how **asynchronous database access** dramatically improves performance compared to sequential operations, especially under high load - a critical optimization for ride-sharing platforms like Uber/Ola.

### Performance Comparison

| Method | Average Response Time | Throughput | Use Case |
|--------|---------------------|------------|-----------|
| **Sequential** | ~400-500ms | ~2-3 req/sec | ❌ Blocking operations |
| **Parallel** | ~150-200ms | ~6-8 req/sec | ✅ Non-blocking with Promise.all |

**Result: ~60-70% performance improvement with parallel database access**

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React + Vite  │    │  Node.js + Express │   │   MySQL 8.0     │
│   (Frontend)    │◄──►│   (Backend API)    │◄──│   (Database)    │
│   MapLibre GL   │    │   Socket.IO        │   │   Redis Cache   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

### 1. Clone & Run with Docker

```bash
# Clone the repository
git clone <repository-url>
cd rideshare-app

# Start all services
docker-compose up -d

# Wait for services to be ready (check logs)
docker-compose logs -f
```

### 2. Access the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### 3. Test Account

```
Email: john.doe@example.com
Password: password123
```

## 🔬 Performance Testing

### Manual Testing

1. **Login** to the application
2. **Set pickup/dropoff** locations on the map
3. **Toggle between methods**:
   - `Sequential (Slow)` - Database operations run one after another
   - `Parallel (Fast)` - Database operations run simultaneously
4. **Click "Book Ride"** and observe response times

### Automated Benchmarking

```bash
# Run comprehensive benchmark
cd backend
npm run benchmark

# Or manually with different configurations
node scripts/benchmark.js
```

### Sample Benchmark Results

```
🚀 THROUGHPUT COMPARISON:
Sequential: 2.34 req/sec
Parallel: 6.78 req/sec
Improvement: 189% faster throughput

📊 RESPONSE TIME ANALYSIS:
Users   Sequential    Parallel    Improvement
1       420ms        165ms       60.7%
5       485ms        189ms       61.0%
10      523ms        201ms       61.6%
20      578ms        234ms       59.5%
50      612ms        267ms       56.4%
```

## 🛠️ Local Development

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Start MySQL (via Docker)
docker run -d \
  --name rideshare-mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=rideshare \
  -p 3306:3306 \
  mysql:8.0

# Import database schema
mysql -h localhost -u root -p rideshare < database/schema.sql
mysql -h localhost -u root -p rideshare < database/seed.sql

# Start development server
npm run dev
```

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 📊 Database Schema

### Key Tables

```sql
-- Users with wallet balance
users (id, email, name, wallet_balance, ...)

-- Real-time driver locations  
driver_locations (driver_id, latitude, longitude, updated_at)

-- Ride bookings with performance tracking
rides (id, user_id, pickup_lat, dropoff_lat, status, ...)

-- Payment methods validation
user_payment_methods (id, user_id, payment_type, is_active)

-- Request logging for analytics
ride_logs (user_id, action, details, created_at)
```

## 🔍 Sequential vs Parallel Comparison

### Sequential Approach (Blocking)
```javascript
// ❌ SLOW: Operations run one after another
const walletBalance = await checkWallet(userId);        // Wait 80ms
const tripHistory = await getTripHistory(userId);       // Wait 60ms  
const pricing = await calculatePricing(rideData);       // Wait 70ms
const logging = await logRequest(rideData);             // Wait 40ms
const payment = await validatePayment(userId);          // Wait 50ms
// Total: ~300ms + network overhead
```

### Parallel Approach (Non-blocking)
```javascript
// ✅ FAST: Operations run simultaneously
const [walletBalance, tripHistory, pricing, logging, payment] = await Promise.all([
  checkWallet(userId),          // 80ms |
  getTripHistory(userId),       // 60ms | All execute
  calculatePricing(rideData),   // 70ms | in parallel
  logRequest(rideData),         // 40ms |
  validatePayment(userId)       // 50ms |
]);
// Total: ~80ms (longest operation) + network overhead
```

## 🌟 Key Features

### Frontend
- **Dark Theme UI** with ride-sharing specific design system
- **Interactive Map** with MapLibre GL showing real-time drivers
- **Real-time Updates** via WebSocket for driver locations
- **Performance Monitoring** with live metrics display
- **Responsive Design** for mobile and desktop

### Backend  
- **JWT Authentication** with secure password hashing
- **WebSocket Integration** for real-time driver tracking
- **Performance Benchmarking** with detailed metrics
- **Rate Limiting & Security** headers
- **Comprehensive Logging** for debugging

### Database
- **Optimized Indexes** for high-performance queries
- **Real-time Location Tracking** with spatial queries
- **Transaction Logging** for audit trails
- **Sample Data** for immediate testing

## 🚗 Real-time Features

### Driver Tracking
- Live driver locations via WebSocket
- Distance-based driver matching
- Status updates (online/offline/busy)

### Navigation Integration
- **Google Maps Integration** for turn-by-turn navigation
- One-click "Navigate to Driver" button
- Automatic route optimization

## 📈 Monitoring & Analytics

### Performance Metrics
- Response time tracking
- Database query performance
- Success/failure rates
- Throughput measurements

### Real-time Dashboard
- Live performance comparison
- Historical benchmark data
- System health monitoring

## 🔧 Configuration

### Environment Variables

```bash
# Backend (.env)
NODE_ENV=development
DB_HOST=localhost
DB_USER=rideshare_user
DB_PASSWORD=rideshare_password
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:8080

# Frontend
VITE_API_URL=http://localhost:3001/api
```

### Docker Compose Services

- **mysql**: Database with auto-initialization
- **backend**: Node.js API server
- **frontend**: React application with Nginx
- **redis**: Caching layer (optional)
- **nginx**: Load balancer for production

## 🧪 Testing

### Manual Testing Scenarios

1. **Authentication Flow**
   - Sign up new user
   - Login existing user
   - JWT token validation

2. **Ride Booking Flow**
   - Map interaction and location selection
   - Fare estimation with surge pricing
   - Wallet balance validation
   - Performance method comparison

3. **Real-time Features**
   - Driver location updates
   - Live map marker movement
   - WebSocket connection handling

### Automated Testing

```bash
# Run backend tests
cd backend
npm test

# Run performance benchmarks
npm run benchmark

# Load testing with different scenarios
node scripts/benchmark.js
```

## 🚀 Production Deployment

### Docker Production

```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# Scale backend services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Monitor logs
docker-compose logs -f
```

### Performance Optimization

1. **Database Indexing**: Optimized indexes for location queries
2. **Connection Pooling**: Reuse database connections
3. **Redis Caching**: Cache frequently accessed data
4. **CDN Integration**: Serve static assets globally
5. **Load Balancing**: Horizontal scaling with Nginx

## 📚 Learning Outcomes

This project demonstrates:

- **Asynchronous Programming**: Promise.all vs sequential awaits
- **Database Optimization**: Query performance and indexing
- **Real-time Communication**: WebSocket implementation
- **System Architecture**: Microservices with Docker
- **Performance Monitoring**: Benchmarking and metrics
- **Security Best Practices**: JWT, rate limiting, validation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ to demonstrate the power of asynchronous database operations in high-performance applications.**