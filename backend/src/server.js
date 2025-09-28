const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Route imports
const authRoutes = require('./routes/auth');
const rideRoutes = require('./routes/rides');
const driverRoutes = require('./routes/drivers');
const benchmarkRoutes = require('./routes/benchmark');

// Middleware imports
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Security and performance middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:8080",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api', rateLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/benchmark', benchmarkRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Real-time driver tracking
let connectedDrivers = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Driver location updates
  socket.on('driver-location-update', (data) => {
    const { driverId, lat, lng, status } = data;
    connectedDrivers.set(driverId, {
      socketId: socket.id,
      location: { lat, lng },
      status,
      lastUpdate: new Date()
    });

    // Broadcast to all clients
    socket.broadcast.emit('driver-moved', {
      driverId,
      location: { lat, lng },
      status
    });
  });

  // User requests nearby drivers
  socket.on('get-nearby-drivers', (data) => {
    const { lat, lng, radius = 5 } = data;
    const nearbyDrivers = [];

    connectedDrivers.forEach((driver, driverId) => {
      const distance = calculateDistance(lat, lng, driver.location.lat, driver.location.lng);
      if (distance <= radius && driver.status === 'online') {
        nearbyDrivers.push({
          id: driverId,
          location: driver.location,
          status: driver.status,
          distance
        });
      }
    });

    socket.emit('nearby-drivers', nearbyDrivers);
  });

  socket.on('disconnect', () => {
    // Remove driver from connected list
    for (let [driverId, driver] of connectedDrivers.entries()) {
      if (driver.socketId === socket.id) {
        connectedDrivers.delete(driverId);
        socket.broadcast.emit('driver-offline', { driverId });
        break;
      }
    }
    console.log('Client disconnected:', socket.id);
  });
});

// Haversine formula for distance calculation
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Error handling
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

server.listen(PORT, () => {
  console.log(`🚗 RideShare Backend running on port ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:8080"}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});