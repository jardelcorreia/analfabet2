const fetch = require('node-fetch');

// The API key is hardcoded here because the free tier key '1' does not provide access to the required endpoint.
// The key '3' was provided by the user and seems to be the correct one for this application.
// In a real-world application, this should be stored in a secure environment variable.
const API_KEY = '3';
const BASE_URL = 'https://www.thesportsdb.com/api/v1/json';

class SportsDB_API {
  async request(endpoint) {
    const response = await fetch(`${BASE_URL}/${API_KEY}${endpoint}`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async getBrasileiroStandings() {
    try {
      const data = await this.request(`/lookuptable.php?l=4351`);
      return data.table;
    } catch (error) {
      console.error('Error fetching standings:', error);
      return [];
    }
  }
}

exports.sportsDB_API = new SportsDB_API();
