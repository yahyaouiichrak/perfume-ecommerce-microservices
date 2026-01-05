
// src/__tests__/auth.test.ts

import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express, { Application } from 'express';
import cors from 'cors';
import * as path from 'path';
import * as os from 'os';
import authRoutes from '../routes/auth.routes';
import User from '../models/User';

// ⏱️ Timeout large (10 min) pour couvrir le 1er download du binaire Mongo (~509 MB)
jest.setTimeout(600_000);

// 📦 Sans setup-file : on définit ici les env nécessaires
//    ➜ Version épinglée pour éviter les redownloads imprévus
process.env.MONGOMS_VERSION ??= '6.0.14';
//    ➜ Cache persistant du binaire Mongo dans le HOME de l'utilisateur
process.env.MONGOMS_DOWNLOAD_DIR ??= path.join(os.homedir(), '.cache', 'mongodb-binaries');

// (Optionnel selon version de mongodb-memory-server ; si non supporté, commente)
// process.env.MONGOMS_DISABLE_MD5_CHECKS = '1';

const createTestApp = (): Application => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
};

describe('Auth Service API Tests', () => {
  let mongoServer: MongoMemoryServer;
  let app: Application;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: process.env.MONGOMS_VERSION,
        downloadDir: process.env.MONGOMS_DOWNLOAD_DIR,
      },
      instance: { storageEngine: 'wiredTiger' },
    });

    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    app = createTestApp();
  });

  afterAll(async () => {
    // ➜ Teardown propre pour éviter les fuites de handles
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase(); // Vide la DB mémoire
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // ➜ Isoler chaque test
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    const validUser = {
      email: 'test@example.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validUser.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' }) // champs manquants
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 409 if email already exists', async () => {
      await request(app).post('/api/auth/register').send(validUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    const credentials = {
      email: 'login@example.com',
      password: 'Login123!',
    };

    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          ...credentials,
          firstName: 'Login',
          lastName: 'User',
        });
    });

    it('should login successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: credentials.email,
          password: 'WrongPassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    let token: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'profile@example.com',
          password: 'Profile123!',
          firstName: 'Profile',
          lastName: 'User',
        });

      token = response.body.data.token;
    });

    it('should get profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('profile@example.com');
    });

    it('should return 401 without token', async () => {
      await request(app).get('/api/auth/profile').expect(401);
    });
  });
});
