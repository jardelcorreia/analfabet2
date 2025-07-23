require('dotenv').config();
const { handler } = require('./netlify/functions/populate-matches.cjs');

(async () => {
  try {
    console.log('Starting population script...');
    await handler();
    console.log('Population script finished.');
  } catch (error) {
    console.error('Population script failed:', error);
  }
})();
