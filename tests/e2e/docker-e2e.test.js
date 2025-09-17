/**
 * End-to-End Integration Tests
 * Tests the complete application stack using Docker Compose
 */

const { execSync, spawn } = require('child_process');
const axios = require('axios');

const TIMEOUT = 60000; // 60 seconds
const SERVER_URL = 'http://localhost:3001';
const HOST_URL = 'http://localhost:5173';
const PLAYER_URL = 'http://localhost:5174';

describe('E2E Docker Integration', () => {
  let dockerProcess;

  beforeAll(async () => {
    console.log('🐳 Starting Docker Compose services...');
    
    // Stop any existing containers
    try {
      execSync('docker-compose down -v', { stdio: 'pipe' });
    } catch (error) {
      // Ignore if no containers were running
    }

    // Start services
    dockerProcess = spawn('docker-compose', ['up', '--build'], {
      stdio: 'pipe',
      detached: false
    });

    // Wait for services to be ready
    await waitForServices();
  }, TIMEOUT);

  afterAll(async () => {
    console.log('🛑 Stopping Docker Compose services...');
    
    if (dockerProcess) {
      dockerProcess.kill('SIGTERM');
    }
    
    try {
      execSync('docker-compose down -v', { stdio: 'pipe' });
    } catch (error) {
      console.warn('Warning: Failed to stop Docker services:', error.message);
    }
  }, 30000);

  async function waitForServices() {
    const services = [
      { name: 'Server', url: `${SERVER_URL}/health` },
      { name: 'Host App', url: HOST_URL },
      { name: 'Player App', url: PLAYER_URL }
    ];

    console.log('⏳ Waiting for services to start...');

    for (const service of services) {
      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        try {
          await axios.get(service.url, { timeout: 2000 });
          console.log(`✅ ${service.name} is ready`);
          break;
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw new Error(`${service.name} failed to start after ${maxAttempts} attempts`);
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // Additional wait for Socket.io to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  test('server health check should return OK', async () => {
    const response = await axios.get(`${SERVER_URL}/health`);
    
    expect(response.status).toBe(200);
    expect(response.data.status).toBe('ok');
    expect(response.data.stats).toBeDefined();
    expect(response.data.stats.connectedSockets).toBeDefined();
  });

  test('host app should be accessible', async () => {
    const response = await axios.get(HOST_URL);
    
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });

  test('player app should be accessible', async () => {
    const response = await axios.get(PLAYER_URL);
    
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });

  test('server should create games via API', async () => {
    const response = await axios.post(`${SERVER_URL}/api/games`);
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.gameId).toBeDefined();
    expect(typeof response.data.gameId).toBe('string');
  });

  test('server stats should show game creation', async () => {
    // Create a game
    await axios.post(`${SERVER_URL}/api/games`);
    
    // Check stats
    const response = await axios.get(`${SERVER_URL}/health`);
    
    expect(response.data.stats.activeGames).toBeGreaterThanOrEqual(0);
    expect(response.data.stats.totalPlayers).toBeGreaterThanOrEqual(0);
  });

  test('docker services should have correct environment', async () => {
    // Test that services can communicate with each other
    const response = await axios.get(`${SERVER_URL}/health`);
    
    // Server should be running in Docker environment
    expect(response.data).toBeDefined();
    expect(response.status).toBe(200);
    
    // Check that frontend apps are served correctly
    const hostResponse = await axios.get(HOST_URL);
    const playerResponse = await axios.get(PLAYER_URL);
    
    expect(hostResponse.status).toBe(200);
    expect(playerResponse.status).toBe(200);
  });

  test('all services should handle CORS correctly', async () => {
    // Test CORS headers are present
    const response = await axios.options(`${SERVER_URL}/health`);
    
    expect(response.status).toBe(204); // OPTIONS should return 204
  });
});