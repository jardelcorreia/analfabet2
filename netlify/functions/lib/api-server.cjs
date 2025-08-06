const fetch = require('node-fetch');

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
      const currentYear = new Date().getFullYear();
      const data = await this.request(`/lookuptable.php?l=4351&s=${currentYear}`);
      return data.table;
    } catch (error) {
      console.error('Error fetching standings:', error);
      return [];
    }
  }
}

exports.sportsDB_API = new SportsDB_API();
