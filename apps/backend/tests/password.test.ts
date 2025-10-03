import { hashPassword, verifyPassword } from '../src/utils/password';

describe('Password Utilities', () => {
    describe('hashPassword', () => {
        it('should hash a password', async () => {
            const password = 'testpassword123';
            const hashed = await hashPassword(password);

            expect(hashed).toBeDefined();
            expect(typeof hashed).toBe('string');
            expect(hashed.length).toBeGreaterThan(0);
            expect(hashed).not.toBe(password);
        });

        it('should produce different hashes for same password', async () => {
            const password = 'testpassword123';
            const hash1 = await hashPassword(password);
            const hash2 = await hashPassword(password);

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('verifyPassword', () => {
        it('should verify correct password', async () => {
            const password = 'testpassword123';
            const hashed = await hashPassword(password);

            const isValid = await verifyPassword(password, hashed);
            expect(isValid).toBe(true);
        });

        it('should reject incorrect password', async () => {
            const password = 'testpassword123';
            const wrongPassword = 'wrongpassword';
            const hashed = await hashPassword(password);

            const isValid = await verifyPassword(wrongPassword, hashed);
            expect(isValid).toBe(false);
        });
    });
});