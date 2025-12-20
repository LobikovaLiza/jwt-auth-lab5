const request = require('supertest');
// Базовый URL будет передаваться из окружения (STAGING_URL)
const API_URL = process.env.API_URL || 'http://localhost:8080';

describe('Staging API Integration Tests', () => {
    test('Health endpoint returns 200', async () => {
        const response = await request(API_URL).get('/health');
        expect(response.status).toBe(200);
    });

    test('Public endpoint works', async () => {
        const response = await request(API_URL).get('/api/test/all');
        expect(response.status).toBe(200);
    });
});