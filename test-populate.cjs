// test-populate.js
require('dotenv').config();
const { handler } = require('./netlify/functions/populate-matches.cjs');

(async () => {
  try {
    console.log('Starting test...');
    const response = await handler();
    console.log('Test finished.');
    console.log('Response:', response);
  } catch (error) {
    console.error('Test failed:', error);
  }
})();
