import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../models/User.js';

let mongoServer;

beforeAll(async () => {
  // Set up mock test environment variables for JWT signing
  process.env.JWT_SECRET = 'testjwtsecretaccess';
  process.env.JWT_REFRESH_SECRET = 'testjwtsecretrefresh';

  // Spin up an isolated MongoDB memory server for integration testing
  mongoServer = await MongoMemoryServer.create({
    instance: {
      launchTimeoutMS: 60000
    }
  });
  const uri = mongoServer.getUri();
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Authentication Domain API Integration Tests', () => {
  const testUser = {
    email: 'integration@test.com',
    password: 'password123',
    name: 'Integration Test User',
    age: 25,
    gender: 'male',
    preference: 'female',
    bio: 'Looking for matching partners.',
    location: 'Austin, TX',
  };

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.name).toBe(testUser.name);
    expect(res.body.accessToken).toBeDefined();
    
    // Check HttpOnly Cookie is set for refreshToken
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const hasRefreshToken = cookies.some((cookie) => cookie.includes('refreshToken='));
    expect(hasRefreshToken).toBe(true);
  });

  it('should fail to register a user with duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already exists');
  });

  it('should authenticate user and return access token on login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('should fail login with incorrect credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid email or password');
  });

  it('should fetch profile context using valid access token', async () => {
    // 1. First login to acquire the access token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const token = loginRes.body.accessToken;

    // 2. Fetch the /me endpoint passing the authorization header
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('should block profile context fetching if token is invalid or missing', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
