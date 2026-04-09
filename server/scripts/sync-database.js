const db = require('../config/Database.js').default;

async function runMigrations() {
    try {
        console.log('Running database sync...');
        await db.sync({ alter: true });
        console.log('✅ Database synchronized successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database sync failed:', error.message);
        process.exit(1);
    }
}

runMigrations();
