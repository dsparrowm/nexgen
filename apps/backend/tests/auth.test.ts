import request from 'supertest';
import app from '../src/app';
import db from '../src/services/database';

describe('Auth API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/user/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                email: 'test@example.com',
                username: 'testuser',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User'
            };

            // Mock database calls
            (db.prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // No existing user
            (db.prisma.user.create as jest.Mock).mockResolvedValue({
                id: 'user-id',
                email: userData.email,
                username: userData.username,
                role: 'USER',
                isVerified: false,
                balance: 0,
                totalInvested: 0,
                totalEarnings: 0,
                referralCode: 'testuser_abc123',
                createdAt: new Date()
            });

            const response = await request(app)
                .post('/api/auth/user/register')
                .send(userData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(userData.email);
            expect(response.body.data.tokens).toBeDefined();
        });

        it('should return error for existing email', async () => {
            const userData = {
                email: 'existing@example.com',
                username: 'testuser',
                password: 'password123'
            };

            // Mock existing user
            (db.prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 'existing-id',
                email: userData.email
            });

            const response = await request(app)
                .post('/api/auth/user/register')
                .send(userData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('EMAIL_EXISTS');
        });
    });

    describe('POST /api/auth/user/login', () => {
        it('should login user successfully', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };

            // Mock user lookup
            (db.prisma.user.findUnique as jest.Mock).mockResolvedValue({
                id: 'user-id',
                email: loginData.email,
                password: 'hashed-password',
                role: 'USER'
            });

            const response = await request(app)
                .post('/api/auth/user/login')
                .send(loginData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.tokens).toBeDefined();
        });
    });
});