const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Store benchmark results
let benchmarkResults = [];

// Run performance benchmark
router.post('/run', auth, async (req, res) => {
  try {
    const { endpoint, requests = 100 } = req.body;
    
    if (!['sequential', 'parallel'].includes(endpoint)) {
      return res.status(400).json({ message: 'Invalid endpoint. Use "sequential" or "parallel"' });
    }
    
    console.log(`🚀 Starting benchmark: ${endpoint} with ${requests} requests`);
    
    const results = {
      endpoint,
      totalRequests: requests,
      successfulRequests: 0,
      failedRequests: 0,
      totalTime: 0,
      averageTime: 0,
      minTime: Infinity,
      maxTime: 0,
      responseTimes: [],
      timestamp: new Date().toISOString()
    };
    
    const promises = [];
    
    // Create concurrent requests
    for (let i = 0; i < requests; i++) {
      promises.push(makeTestRequest(endpoint));
    }
    
    const overallStart = Date.now();
    
    // Execute all requests
    const responses = await Promise.allSettled(promises);
    
    const overallEnd = Date.now();
    results.totalTime = overallEnd - overallStart;
    
    // Process results
    responses.forEach(response => {
      if (response.status === 'fulfilled') {
        results.successfulRequests++;
        const responseTime = response.value;
        results.responseTimes.push(responseTime);
        results.minTime = Math.min(results.minTime, responseTime);
        results.maxTime = Math.max(results.maxTime, responseTime);
      } else {
        results.failedRequests++;
        console.error('Request failed:', response.reason);
      }
    });
    
    // Calculate averages
    if (results.responseTimes.length > 0) {
      results.averageTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
    }
    
    // Calculate percentiles
    const sortedTimes = results.responseTimes.sort((a, b) => a - b);
    results.p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
    results.p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    results.p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
    
    // Store results
    benchmarkResults.push(results);
    
    // Keep only last 10 results
    if (benchmarkResults.length > 10) {
      benchmarkResults = benchmarkResults.slice(-10);
    }
    
    console.log(`✅ Benchmark completed: ${endpoint}`);
    console.log(`   Successful: ${results.successfulRequests}/${requests}`);
    console.log(`   Average time: ${results.averageTime.toFixed(2)}ms`);
    console.log(`   P95: ${results.p95.toFixed(2)}ms`);
    
    res.json(results);
    
  } catch (error) {
    console.error('Benchmark error:', error);
    res.status(500).json({ message: 'Failed to run benchmark' });
  }
});

// Get benchmark results
router.get('/results', auth, (req, res) => {
  res.json({
    results: benchmarkResults,
    comparison: generateComparison()
  });
});

// Make a test request to measure performance
async function makeTestRequest(endpoint) {
  const startTime = Date.now();
  
  try {
    // Simulate the database operations that happen in ride booking
    const testData = {
      pickup: { lat: 21.84, lng: 82.79 },
      dropoff: { lat: 21.85, lng: 82.80 },
      ride_type: 'standard'
    };
    
    if (endpoint === 'sequential') {
      // Simulate sequential operations
      await simulateSequentialOperations();
    } else {
      // Simulate parallel operations
      await simulateParallelOperations();
    }
    
    const endTime = Date.now();
    return endTime - startTime;
    
  } catch (error) {
    throw error;
  }
}

// Simulate sequential database operations
async function simulateSequentialOperations() {
  // Simulate the same operations as in the ride booking
  await simulateDbQuery(50); // Wallet check
  await simulateDbQuery(80); // Trip history
  await simulateDbQuery(60); // Pricing calculation
  await simulateDbQuery(40); // Logging
  await simulateDbQuery(70); // Payment validation
}

// Simulate parallel database operations
async function simulateParallelOperations() {
  // Run all operations in parallel
  await Promise.all([
    simulateDbQuery(50), // Wallet check
    simulateDbQuery(80), // Trip history
    simulateDbQuery(60), // Pricing calculation
    simulateDbQuery(40), // Logging
    simulateDbQuery(70)  // Payment validation
  ]);
}

// Simulate database query with random delay
function simulateDbQuery(baseDelay) {
  return new Promise(resolve => {
    const delay = baseDelay + Math.random() * 30; // Add some jitter
    setTimeout(resolve, delay);
  });
}

// Generate comparison between sequential and parallel results
function generateComparison() {
  const sequentialResults = benchmarkResults.filter(r => r.endpoint === 'sequential');
  const parallelResults = benchmarkResults.filter(r => r.endpoint === 'parallel');
  
  if (sequentialResults.length === 0 || parallelResults.length === 0) {
    return null;
  }
  
  const latestSequential = sequentialResults[sequentialResults.length - 1];
  const latestParallel = parallelResults[parallelResults.length - 1];
  
  const improvement = ((latestSequential.averageTime - latestParallel.averageTime) / latestSequential.averageTime) * 100;
  
  return {
    sequential: {
      averageTime: latestSequential.averageTime,
      p95: latestSequential.p95,
      successRate: (latestSequential.successfulRequests / latestSequential.totalRequests) * 100
    },
    parallel: {
      averageTime: latestParallel.averageTime,
      p95: latestParallel.p95,
      successRate: (latestParallel.successfulRequests / latestParallel.totalRequests) * 100
    },
    improvement: {
      percentage: improvement.toFixed(1),
      timesSaved: (improvement / 100 * latestSequential.averageTime).toFixed(1)
    }
  };
}

module.exports = router;
