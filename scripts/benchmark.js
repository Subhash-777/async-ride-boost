#!/usr/bin/env node

/**
 * RideShare Performance Benchmark Script
 * Compares sequential vs parallel database access patterns
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = process.env.API_URL || 'http://localhost:3001/api';
const RESULTS_DIR = path.join(__dirname, '../benchmark-results');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Test configuration
const TEST_CONFIG = {
  concurrent_users: [1, 5, 10, 20, 50],
  requests_per_user: 10,
  endpoints: ['sequential', 'parallel']
};

// Sample test data
const TEST_DATA = {
  pickup: { lat: 21.8400, lng: 82.7800 },
  dropoff: { lat: 21.8500, lng: 82.7900 },
  ride_type: 'standard'
};

class PerformanceBenchmark {
  constructor() {
    this.results = [];
    this.authToken = null;
  }

  async authenticate() {
    try {
      console.log('🔐 Authenticating test user...');
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: 'john.doe@example.com',
        password: 'password123'
      });
      this.authToken = response.data.token;
      console.log('✅ Authentication successful');
    } catch (error) {
      console.error('❌ Authentication failed:', error.response?.data || error.message);
      process.exit(1);
    }
  }

  async makeRequest(endpoint) {
    const start = Date.now();
    try {
      const response = await axios.post(
        `${API_BASE}/rides/book-${endpoint}`,
        TEST_DATA,
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`
          },
          timeout: 30000
        }
      );
      const end = Date.now();
      return {
        success: true,
        responseTime: end - start,
        dbTime: response.data.performance?.dbTime || 0
      };
    } catch (error) {
      const end = Date.now();
      return {
        success: false,
        responseTime: end - start,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async runLoadTest(endpoint, concurrentUsers, requestsPerUser) {
    console.log(`\n🚀 Running ${endpoint} test: ${concurrentUsers} users × ${requestsPerUser} requests`);
    
    const promises = [];
    const startTime = Date.now();
    
    // Create concurrent user simulations
    for (let user = 0; user < concurrentUsers; user++) {
      for (let req = 0; req < requestsPerUser; req++) {
        promises.push(this.makeRequest(endpoint));
      }
    }
    
    // Execute all requests
    const results = await Promise.allSettled(promises);
    const endTime = Date.now();
    
    // Process results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
    const failed = results.filter(r => r.status === 'rejected' || !r.value.success);
    
    const responseTimes = successful.map(r => r.value.responseTime);
    const dbTimes = successful.map(r => r.value.dbTime).filter(t => t > 0);
    
    const stats = {
      endpoint,
      concurrentUsers,
      requestsPerUser,
      totalRequests: promises.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      totalTime: endTime - startTime,
      successRate: (successful.length / promises.length * 100).toFixed(2),
      avgResponseTime: responseTimes.length ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2) : 0,
      minResponseTime: responseTimes.length ? Math.min(...responseTimes) : 0,
      maxResponseTime: responseTimes.length ? Math.max(...responseTimes) : 0,
      p95ResponseTime: responseTimes.length ? this.percentile(responseTimes, 0.95).toFixed(2) : 0,
      avgDbTime: dbTimes.length ? (dbTimes.reduce((a, b) => a + b, 0) / dbTimes.length).toFixed(2) : 0,
      throughput: (successful.length / (endTime - startTime) * 1000).toFixed(2),
      timestamp: new Date().toISOString()
    };
    
    console.log(`   ✅ Success: ${stats.successfulRequests}/${stats.totalRequests} (${stats.successRate}%)`);
    console.log(`   ⏱️  Avg Response: ${stats.avgResponseTime}ms`);
    console.log(`   📊 P95: ${stats.p95ResponseTime}ms`);
    console.log(`   🚀 Throughput: ${stats.throughput} req/sec`);
    
    return stats;
  }

  percentile(arr, p) {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }

  async runFullBenchmark() {
    console.log('🏁 Starting RideShare Performance Benchmark');
    console.log('=' .repeat(50));
    
    await this.authenticate();
    
    for (const endpoint of TEST_CONFIG.endpoints) {
      console.log(`\n🔍 Testing ${endpoint.toUpperCase()} endpoint`);
      console.log('-'.repeat(30));
      
      for (const users of TEST_CONFIG.concurrent_users) {
        const result = await this.runLoadTest(endpoint, users, TEST_CONFIG.requests_per_user);
        this.results.push(result);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    this.analyzeResults();
    this.saveResults();
  }

  analyzeResults() {
    console.log('\n📊 PERFORMANCE ANALYSIS');
    console.log('=' .repeat(50));
    
    const sequential = this.results.filter(r => r.endpoint === 'sequential');
    const parallel = this.results.filter(r => r.endpoint === 'parallel');
    
    console.log('\n📈 Average Response Times by Concurrent Users:');
    console.log('Users\tSequential\tParallel\tImprovement');
    console.log('-'.repeat(45));
    
    TEST_CONFIG.concurrent_users.forEach(users => {
      const seqResult = sequential.find(r => r.concurrentUsers === users);
      const parResult = parallel.find(r => r.concurrentUsers === users);
      
      if (seqResult && parResult) {
        const improvement = ((seqResult.avgResponseTime - parResult.avgResponseTime) / seqResult.avgResponseTime * 100).toFixed(1);
        console.log(`${users}\t${seqResult.avgResponseTime}ms\t\t${parResult.avgResponseTime}ms\t\t${improvement}%`);
      }
    });
    
    // Overall statistics
    const seqAvg = sequential.reduce((sum, r) => sum + parseFloat(r.avgResponseTime), 0) / sequential.length;
    const parAvg = parallel.reduce((sum, r) => sum + parseFloat(r.avgResponseTime), 0) / parallel.length;
    const overallImprovement = ((seqAvg - parAvg) / seqAvg * 100).toFixed(1);
    
    console.log('\n🎯 SUMMARY:');
    console.log(`Sequential Average: ${seqAvg.toFixed(2)}ms`);
    console.log(`Parallel Average: ${parAvg.toFixed(2)}ms`);
    console.log(`Overall Improvement: ${overallImprovement}% faster with parallel approach`);
    
    // Throughput comparison
    const seqThroughput = sequential.reduce((sum, r) => sum + parseFloat(r.throughput), 0) / sequential.length;
    const parThroughput = parallel.reduce((sum, r) => sum + parseFloat(r.throughput), 0) / parallel.length;
    
    console.log(`\n🚀 THROUGHPUT:`);
    console.log(`Sequential: ${seqThroughput.toFixed(2)} req/sec`);
    console.log(`Parallel: ${parThroughput.toFixed(2)} req/sec`);
    console.log(`Throughput Increase: ${((parThroughput - seqThroughput) / seqThroughput * 100).toFixed(1)}%`);
  }

  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `benchmark-results-${timestamp}.json`;
    const filepath = path.join(RESULTS_DIR, filename);
    
    const output = {
      summary: {
        testDate: new Date().toISOString(),
        configuration: TEST_CONFIG,
        totalTests: this.results.length
      },
      results: this.results
    };
    
    fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
    console.log(`\n💾 Results saved to: ${filepath}`);
    
    // Also save a CSV for easy analysis
    this.saveCsv(timestamp);
  }

  saveCsv(timestamp) {
    const csvFilename = `benchmark-results-${timestamp}.csv`;
    const csvPath = path.join(RESULTS_DIR, csvFilename);
    
    const headers = [
      'endpoint', 'concurrentUsers', 'totalRequests', 'successfulRequests', 
      'avgResponseTime', 'p95ResponseTime', 'throughput', 'successRate'
    ].join(',');
    
    const rows = this.results.map(r => [
      r.endpoint, r.concurrentUsers, r.totalRequests, r.successfulRequests,
      r.avgResponseTime, r.p95ResponseTime, r.throughput, r.successRate
    ].join(','));
    
    const csv = [headers, ...rows].join('\n');
    fs.writeFileSync(csvPath, csv);
    console.log(`📊 CSV saved to: ${csvPath}`);
  }
}

// Run the benchmark if called directly
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();
  benchmark.runFullBenchmark()
    .then(() => {
      console.log('\n🏆 Benchmark completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Benchmark failed:', error);
      process.exit(1);
    });
}

module.exports = PerformanceBenchmark;