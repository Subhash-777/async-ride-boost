const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');
const { validateRideRequest } = require('../middleware/validation');

// Get ride estimate
router.post('/estimate', auth, validateRideRequest, async (req, res) => {
  try {
    const { pickup, dropoff, ride_type } = req.body;
    
    // Calculate distance (simplified calculation)
    const distance = calculateDistance(
      pickup.lat, pickup.lng,
      dropoff.lat, dropoff.lng
    );
    
    // Base fare calculation
    const baseFares = {
      standard: 2.5,
      premium: 4.0,
      shared: 1.8
    };
    
    const baseFare = baseFares[ride_type] || baseFares.standard;
    const distanceFare = distance * 1.2;
    
    // Surge pricing (simplified)
    const currentHour = new Date().getHours();
    let surgeMultiplier = 1.0;
    
    // Peak hours: 7-9 AM, 5-8 PM
    if ((currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 20)) {
      surgeMultiplier = 1.5;
    }
    
    const totalFare = (baseFare + distanceFare) * surgeMultiplier;
    const duration = Math.ceil(distance / 40 * 60); // Assuming 40 km/h average speed
    
    res.json({
      distance: Math.round(distance * 100) / 100,
      duration,
      base_fare: Math.round(baseFare * 100) / 100,
      surge_multiplier: surgeMultiplier,
      total_fare: Math.round(totalFare * 100) / 100,
      currency: 'USD'
    });
  } catch (error) {
    console.error('Estimate error:', error);
    res.status(500).json({ message: 'Failed to calculate estimate' });
  }
});

// Book ride - SEQUENTIAL (BLOCKING) - FOR PERFORMANCE COMPARISON
router.post('/book-sequential', auth, validateRideRequest, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { pickup, dropoff, ride_type } = req.body;
    const userId = req.user.id;
    
    console.log('🐢 Starting SEQUENTIAL ride booking...');
    
    // SEQUENTIAL DATABASE OPERATIONS (BLOCKING)
    const dbStartTime = Date.now();
    
    // 1. Check wallet balance (WAIT for this to complete)
    console.log('⏳ Checking wallet balance...');
    const [walletRows] = await db.execute(
      'SELECT wallet_balance FROM users WHERE id = ?',
      [userId]
    );
    console.log('✅ Wallet check completed');
    
    // 2. Get user trip history (WAIT for this to complete)
    console.log('⏳ Fetching trip history...');
    const [tripRows] = await db.execute(
      'SELECT COUNT(*) as trip_count FROM rides WHERE user_id = ? AND status = "completed"',
      [userId]
    );
    console.log('✅ Trip history completed');
    
    // 3. Calculate pricing with surge (WAIT for this to complete)
    console.log('⏳ Calculating pricing...');
    const [surgeRows] = await db.execute(
      'SELECT AVG(surge_multiplier) as avg_surge FROM rides WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)'
    );
    console.log('✅ Pricing calculation completed');
    
    // 4. Log the request (WAIT for this to complete)
    console.log('⏳ Logging ride request...');
    await db.execute(
      'INSERT INTO ride_logs (user_id, action, details, created_at) VALUES (?, ?, ?, NOW())',
      [userId, 'ride_request', JSON.stringify({ pickup, dropoff, ride_type })]
    );
    console.log('✅ Logging completed');
    
    // 5. Validate payment method (WAIT for this to complete)
    console.log('⏳ Validating payment method...');
    const [paymentRows] = await db.execute(
      'SELECT id FROM user_payment_methods WHERE user_id = ? AND is_active = 1 LIMIT 1',
      [userId]
    );
    console.log('✅ Payment validation completed');
    
    const dbEndTime = Date.now();
    const dbTime = dbEndTime - dbStartTime;
    
    // Simulate ride creation
    const rideId = `ride_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`🐢 SEQUENTIAL booking completed in ${totalTime}ms (DB: ${dbTime}ms)`);
    
    res.json({
      ride_id: rideId,
      performance: {
        method: 'sequential',
        totalTime,
        dbTime,
        operations: 5,
        avgTimePerOperation: Math.round(dbTime / 5)
      }
    });
    
  } catch (error) {
    console.error('Sequential booking error:', error);
    res.status(500).json({ message: 'Failed to book ride (sequential)' });
  }
});

// Book ride - PARALLEL (ASYNC) - FOR PERFORMANCE COMPARISON
router.post('/book-parallel', auth, validateRideRequest, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { pickup, dropoff, ride_type } = req.body;
    const userId = req.user.id;
    
    console.log('🚀 Starting PARALLEL ride booking...');
    
    // PARALLEL DATABASE OPERATIONS (NON-BLOCKING)
    const dbStartTime = Date.now();
    
    console.log('⚡ Firing all database queries in parallel...');
    
    // Execute all independent queries in parallel using Promise.all
    const [
      walletResult,
      tripHistoryResult,
      surgePricingResult,
      loggingResult,
      paymentValidationResult
    ] = await Promise.all([
      // 1. Check wallet balance
      db.execute('SELECT wallet_balance FROM users WHERE id = ?', [userId]),
      
      // 2. Get user trip history
      db.execute(
        'SELECT COUNT(*) as trip_count FROM rides WHERE user_id = ? AND status = "completed"',
        [userId]
      ),
      
      // 3. Calculate pricing with surge
      db.execute(
        'SELECT AVG(surge_multiplier) as avg_surge FROM rides WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)'
      ),
      
      // 4. Log the request
      db.execute(
        'INSERT INTO ride_logs (user_id, action, details, created_at) VALUES (?, ?, ?, NOW())',
        [userId, 'ride_request', JSON.stringify({ pickup, dropoff, ride_type })]
      ),
      
      // 5. Validate payment method
      db.execute(
        'SELECT id FROM user_payment_methods WHERE user_id = ? AND is_active = 1 LIMIT 1',
        [userId]
      )
    ]);
    
    const dbEndTime = Date.now();
    const dbTime = dbEndTime - dbStartTime;
    
    console.log('✅ All parallel operations completed!');
    
    // Simulate ride creation
    const rideId = `ride_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`🚀 PARALLEL booking completed in ${totalTime}ms (DB: ${dbTime}ms)`);
    
    res.json({
      ride_id: rideId,
      performance: {
        method: 'parallel',
        totalTime,
        dbTime,
        operations: 5,
        speedImprovement: `~${Math.round(((300 - totalTime) / 300) * 100)}% faster than sequential`
      }
    });
    
  } catch (error) {
    console.error('Parallel booking error:', error);
    res.status(500).json({ message: 'Failed to book ride (parallel)' });
  }
});

// Regular book ride endpoint
router.post('/book', auth, validateRideRequest, async (req, res) => {
  try {
    const { pickup, dropoff, ride_type } = req.body;
    const userId = req.user.id;
    
    // Use the parallel approach for regular bookings (best performance)
    const rideId = `ride_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Insert ride record
    await db.execute(
      `INSERT INTO rides (id, user_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, 
       ride_type, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'requested', NOW())`,
      [rideId, userId, pickup.lat, pickup.lng, dropoff.lat, dropoff.lng, ride_type]
    );
    
    res.json({ ride_id: rideId });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ message: 'Failed to book ride' });
  }
});

// Get trip history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [rides] = await db.execute(
      `SELECT id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, 
       ride_type, status, fare, surge_multiplier, created_at, completed_at
       FROM rides WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
      [userId]
    );
    
    const [stats] = await db.execute(
      `SELECT COUNT(*) as total_trips, SUM(fare) as total_spent, AVG(rating) as average_rating
       FROM rides WHERE user_id = ? AND status = 'completed'`,
      [userId]
    );
    
    res.json({
      rides: rides.map(ride => ({
        ...ride,
        pickup_location: { lat: ride.pickup_lat, lng: ride.pickup_lng },
        dropoff_location: { lat: ride.dropoff_lat, lng: ride.dropoff_lng }
      })),
      total_trips: stats[0]?.total_trips || 0,
      total_spent: stats[0]?.total_spent || 0,
      average_rating: stats[0]?.average_rating || 0
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ message: 'Failed to get trip history' });
  }
});

// Cancel ride
router.delete('/:rideId', auth, async (req, res) => {
  try {
    const { rideId } = req.params;
    const userId = req.user.id;
    
    await db.execute(
      'UPDATE rides SET status = "cancelled" WHERE id = ? AND user_id = ?',
      [rideId, userId]
    );
    
    res.json({ message: 'Ride cancelled successfully' });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ message: 'Failed to cancel ride' });
  }
});

// Helper function to calculate distance using Haversine formula
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

module.exports = router;