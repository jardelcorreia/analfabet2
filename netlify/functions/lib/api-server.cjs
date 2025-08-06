const fetch = require('node-fetch');

const API_KEY = process.env.VITE_SPORTSDB_API_KEY;
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
