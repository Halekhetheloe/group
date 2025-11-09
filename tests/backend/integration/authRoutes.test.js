const request = require('supertest');
const app = require('../../../server/server');

describe('Auth Routes - Integration Tests', () => {
  test('POST /api/auth/register should create a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'testuser@example.com',
        password: 'password123',
        name: 'Test User'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('user');
  });

  test('POST /api/auth/login should authenticate user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testuser@example.com',
        password: 'password123'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});