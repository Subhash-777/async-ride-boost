-- Sample data for RideShare Database
-- This data is for development and testing purposes

USE rideshare;

-- Insert sample users
INSERT INTO users (id, email, password, name, phone, wallet_balance) VALUES
('user_001', 'john.doe@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewUm8BIcv9/A9QK6', 'John Doe', '+1234567890', 150.00),
('user_002', 'jane.smith@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewUm8BIcv9/A9QK6', 'Jane Smith', '+1234567891', 200.50),
('user_003', 'mike.johnson@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewUm8BIcv9/A9QK6', 'Mike Johnson', '+1234567892', 75.25),
('user_004', 'sarah.wilson@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewUm8BIcv9/A9QK6', 'Sarah Wilson', '+1234567893', 300.00),
('user_005', 'alex.brown@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewUm8BIcv9/A9QK6', 'Alex Brown', '+1234567894', 120.75);

-- Insert sample drivers
INSERT INTO drivers (id, email, password, name, phone, license_number, vehicle_type, license_plate, rating, status) VALUES
('driver_001', 'driver1@rideshare.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewUm8BIcv9/A9QK6', 'Raj Kumar', '+9876543210', 'DL001234567', 'Sedan', 'MH01AB1234', 4.8, 'online'),
('driver_002', 'driver2@rideshare.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewUm8BIcv9/A9QK6', 'Priya Sharma', '+9876543211', 'DL001234568', 'Hatchback', 'MH01AB5678', 4.9, 'online'),
('driver_003', 'driver3@rideshare.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewUm8BIcv9/A9QK6', 'Ahmed Ali', '+9876543212', 'DL001234569', 'SUV', 'MH02CD1234', 4.7, 'busy'),
('driver_004', 'driver4@rideshare.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewUm8BIcv9/A9QK6', 'Sneha Patel', '+9876543213', 'DL001234570', 'Sedan', 'MH02CD5678', 4.6, 'online'),
('driver_005', 'driver5@rideshare.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewUm8BIcv9/A9QK6', 'David Wilson', '+9876543214', 'DL001234571', 'Premium', 'MH03EF1234', 4.9, 'online'),
('driver_006', 'driver6@rideshare.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewUm8BIcv9/A9QK6', 'Lisa Chen', '+9876543215', 'DL001234572', 'Hatchback', 'MH03EF5678', 4.8, 'offline');

-- Insert driver locations (around Raipur, India - 21.84, 82.79)
INSERT INTO driver_locations (driver_id, latitude, longitude) VALUES
('driver_001', 21.8456, 82.7908),  -- Close to center
('driver_002', 21.8398, 82.7856),  -- Southwest
('driver_004', 21.8502, 82.7945),  -- Northeast  
('driver_005', 21.8423, 82.7823),  -- West
('driver_003', 21.8378, 82.7912);  -- South (busy driver)

-- Insert sample payment methods
INSERT INTO user_payment_methods (id, user_id, payment_type, card_last_four) VALUES
('payment_001', 'user_001', 'card', '1234'),
('payment_002', 'user_001', 'wallet', NULL),
('payment_003', 'user_002', 'card', '5678'),
('payment_004', 'user_002', 'upi', NULL),
('payment_005', 'user_003', 'wallet', NULL),
('payment_006', 'user_004', 'card', '9999'),
('payment_007', 'user_005', 'card', '1111');

-- Insert sample rides (historical data)
INSERT INTO rides (id, user_id, driver_id, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, ride_type, status, fare, surge_multiplier, distance_km, duration_minutes, rating, created_at, completed_at) VALUES
('ride_001', 'user_001', 'driver_001', 21.8400, 82.7800, 21.8500, 82.7900, 'standard', 'completed', 120.50, 1.0, 8.5, 22, 5, '2024-01-15 10:30:00', '2024-01-15 10:52:00'),
('ride_002', 'user_002', 'driver_002', 21.8450, 82.7850, 21.8350, 82.7750, 'premium', 'completed', 180.75, 1.2, 6.2, 18, 4, '2024-01-15 14:20:00', '2024-01-15 14:38:00'),
('ride_003', 'user_003', 'driver_004', 21.8420, 82.7820, 21.8480, 82.7880, 'shared', 'completed', 85.25, 1.0, 4.8, 15, 5, '2024-01-16 09:15:00', '2024-01-16 09:30:00'),
('ride_004', 'user_001', 'driver_005', 21.8390, 82.7790, 21.8510, 82.7910, 'premium', 'completed', 245.00, 1.5, 9.2, 28, 4, '2024-01-16 18:45:00', '2024-01-16 19:13:00'),
('ride_005', 'user_004', 'driver_001', 21.8460, 82.7860, 21.8380, 82.7780, 'standard', 'completed', 95.50, 1.0, 5.5, 16, 5, '2024-01-17 12:00:00', '2024-01-17 12:16:00');

-- Insert sample promo codes
INSERT INTO promo_codes (id, code, discount_type, discount_value, min_fare, max_discount, usage_limit, expires_at) VALUES
('promo_001', 'FIRST50', 'percentage', 50.00, 100.00, 100.00, 1000, '2024-12-31 23:59:59'),
('promo_002', 'SAVE20', 'fixed', 20.00, 50.00, NULL, 5000, '2024-06-30 23:59:59'),
('promo_003', 'WEEKEND25', 'percentage', 25.00, 80.00, 50.00, 2000, '2024-08-31 23:59:59');

-- Insert sample payments
INSERT INTO payments (id, ride_id, user_id, amount, payment_method_id, status, transaction_id, completed_at) VALUES
('payment_txn_001', 'ride_001', 'user_001', 120.50, 'payment_001', 'completed', 'TXN_001_2024_001', '2024-01-15 10:53:00'),
('payment_txn_002', 'ride_002', 'user_002', 180.75, 'payment_003', 'completed', 'TXN_002_2024_002', '2024-01-15 14:39:00'),
('payment_txn_003', 'ride_003', 'user_003', 85.25, 'payment_005', 'completed', 'TXN_003_2024_003', '2024-01-16 09:31:00'),
('payment_txn_004', 'ride_004', 'user_001', 245.00, 'payment_002', 'completed', 'TXN_004_2024_004', '2024-01-16 19:14:00'),
('payment_txn_005', 'ride_005', 'user_004', 95.50, 'payment_006', 'completed', 'TXN_005_2024_005', '2024-01-17 12:17:00');

-- Insert sample ride logs (for performance testing)
INSERT INTO ride_logs (user_id, action, details) VALUES
('user_001', 'ride_request', '{"pickup": {"lat": 21.84, "lng": 82.79}, "dropoff": {"lat": 21.85, "lng": 82.80}, "ride_type": "standard"}'),
('user_002', 'ride_estimate', '{"distance": 5.2, "fare": 120.50, "surge": 1.0}'),
('user_003', 'ride_cancelled', '{"reason": "driver_not_found", "ride_id": "ride_cancelled_001"}'),
('user_001', 'ride_completed', '{"ride_id": "ride_001", "rating": 5, "fare": 120.50}'),
('user_004', 'surge_pricing', '{"multiplier": 1.5, "reason": "high_demand", "area": "city_center"}');

-- Insert sample performance logs
INSERT INTO performance_logs (endpoint, method, response_time_ms, db_queries_count, success) VALUES
('/rides/book-sequential', 'sequential', 450, 5, TRUE),
('/rides/book-sequential', 'sequential', 520, 5, TRUE),
('/rides/book-sequential', 'sequential', 380, 5, TRUE),
('/rides/book-parallel', 'parallel', 180, 5, TRUE),
('/rides/book-parallel', 'parallel', 165, 5, TRUE),
('/rides/book-parallel', 'parallel', 195, 5, TRUE),
('/rides/book-sequential', 'sequential', 490, 5, TRUE),
('/rides/book-parallel', 'parallel', 170, 5, TRUE);