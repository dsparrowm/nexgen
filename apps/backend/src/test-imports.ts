import 'dotenv/config';

console.log('Testing server startup...');

try {
    console.log('1. Loading config...');
    const { config } = require('./config/env');
    console.log('✅ Config loaded');

    console.log('2. Loading logger...');
    const { logger } = require('./utils/logger');
    console.log('✅ Logger loaded');

    console.log('3. Loading database service...');
    const db = require('./services/database');
    console.log('✅ Database service loaded');

    console.log('4. Loading app...');
    const app = require('./app');
    console.log('✅ App loaded');

    console.log('All imports successful!');

} catch (error: any) {
    console.error('❌ Error during import:', error.message);
    console.error('Stack:', error.stack);
}