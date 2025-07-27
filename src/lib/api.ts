import { SportsDbEvent, SportsDbResponse } from '../types';

const API_KEY = import.meta.env.VITE_SPORTSDB_API_KEY;
const BASE_URL = 'https://www.thesportsdb.com/api/v1/json';

class SportsDB_API {
  private async request<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${BASE_URL}/${API_KEY}${endpoint}`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async getBrasileiroMatches(season: string = '2024'): Promise<SportsDbEvent[]> {
    try {
      const data = await this.request<SportsDbResponse>(`/eventsseason.php?id=4719&s=${season}`);
      return data.events;
    } catch (error) {
      console.error('Error fetching matches:', error);
      return [];
    }
  }
}

export const sportsDB_API = new SportsDB_API();
