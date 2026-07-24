const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // Imports Express app

describe('MERN Tech Lending API Tests', () => {
    
    // Clean up database connections after all tests finish
    afterAll(async () => {
        await mongoose.connection.close();
    });

    // Test a basic public endpoint
    it('Should return 200 and success message on GET /api/status', async () => {
        const res = await request(app).get('/api/status');
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("API is working perfectly!");
    });

    // Test Database Integration
    it('Should fetch an array of inventory devices on GET /api/devices', async () => {
        const res = await request(app).get('/api/devices');
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    // Test Security & Middleware
    it('Should block unauthorized checkouts with 401 status on POST /api/rentals/checkout', async () => {
        // Attempting to checkout without sending a JWT Auth Token
        const res = await request(app).post('/api/rentals/checkout').send({
            deviceId: 'fake_device_id_123'
        });
        
        // Because of the requireAuth middleware, it should reject the request
        expect(res.statusCode).toEqual(401);
        expect(res.body.message).toBe('Authentication required');
    });
});