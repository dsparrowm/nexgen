import 'dotenv/config';
import { config } from './config/env';
import { logger } from './utils/logger';

console.log('Testing server startup...');
console.log('Config loaded:', !!config);
console.log('Database URL:', config.databaseUrl ? 'Set' : 'Not set');
console.log('JWT secrets:', {
    user: config.userJwtSecret ? 'Set' : 'Not set',
    admin: config.adminJwtSecret ? 'Set' : 'Not set'
});

try {
    console.log('Testing logger...');
    logger.info('Logger test');
    console.log('✅ Logger working');

    console.log('Testing database import...');
    const db = require('./services/database');
    console.log('✅ Database service imported');

    console.log('Testing app import...');
    const app = require('./app');
    console.log('✅ App imported');

    console.log('All imports successful!');

} catch (error) {
    console.error('❌ Error during import:', error instanceof Error ? error.message : String(error));
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    process.exit(1);
}