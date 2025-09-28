const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Get nearby drivers
router.get('/nearby', auth, async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
    
    // Get drivers within radius using Haversine formula
    const [drivers] = await db.execute(`
      SELECT 
        d.id,
        d.name,
        d.vehicle_type,
        d.license_plate,
        d.rating,
        d.status,
        dl.latitude as lat,
        dl.longitude as lng,
        (
          6371 * acos(
            cos(radians(?)) * cos(radians(dl.latitude)) *
            cos(radians(dl.longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(dl.latitude))
          )
        ) as distance
      FROM drivers d
      JOIN driver_locations dl ON d.id = dl.driver_id
      WHERE d.status = 'online'
        AND dl.updated_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
      HAVING distance <= ?
      ORDER BY distance
      LIMIT 20
    `, [lat, lng, lat, radius]);
    
    // Format response
    const formattedDrivers = drivers.map(driver => ({
      id: driver.id,
      name: driver.name,
      vehicle_type: driver.vehicle_type,
      license_plate: driver.license_plate,
      rating: parseFloat(driver.rating),
      status: driver.status,
      location: {
        lat: parseFloat(driver.lat),
        lng: parseFloat(driver.lng)
      },
      eta: Math.ceil(driver.distance * 2) // Rough ETA calculation
    }));
    
    res.json(formattedDrivers);
  } catch (error) {
    console.error('Nearby drivers error:', error);
    res.status(500).json({ message: 'Failed to get nearby drivers' });
  }
});

// Update driver location (for driver app)
router.post('/location', auth, async (req, res) => {
  try {
    const { lat, lng, status } = req.body;
    const driverId = req.user.id; // Assuming driver is logged in
    
    // Update or insert driver location
    await db.execute(`
      INSERT INTO driver_locations (driver_id, latitude, longitude, updated_at)
      VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        latitude = VALUES(latitude),
        longitude = VALUES(longitude),
        updated_at = VALUES(updated_at)
    `, [driverId, lat, lng]);
    
    // Update driver status if provided
    if (status) {
      await db.execute(
        'UPDATE drivers SET status = ? WHERE id = ?',
        [status, driverId]
      );
    }
    
    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ message: 'Failed to update location' });
  }
});

// Get driver details
router.get('/:driverId', auth, async (req, res) => {
  try {
    const { driverId } = req.params;
    
    const [drivers] = await db.execute(`
      SELECT 
        d.id,
        d.name,
        d.vehicle_type,
        d.license_plate,
        d.rating,
        d.status,
        d.phone,
        dl.latitude,
        dl.longitude,
        dl.updated_at as last_location_update
      FROM drivers d
      LEFT JOIN driver_locations dl ON d.id = dl.driver_id
      WHERE d.id = ?
    `, [driverId]);
    
    if (drivers.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    const driver = drivers[0];
    res.json({
      ...driver,
      location: driver.latitude ? {
        lat: parseFloat(driver.latitude),
        lng: parseFloat(driver.longitude)
      } : null
    });
  } catch (error) {
    console.error('Driver details error:', error);
    res.status(500).json({ message: 'Failed to get driver details' });
  }
});

module.exports = router;