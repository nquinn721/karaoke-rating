// Music API service for song/artist search using backend API
export interface MusicSearchResult {
  id: string;
  title: string;
  artist: string;
  album?: string;
  year?: string;
}

class MusicService {
  private getBaseURL(): string {
    const isDevelopment = import.meta.env.MODE === 'development';
    return isDevelopment ? 'http://localhost:3000' : '';
  }

  // Search for songs by title using backend API
  async searchSongs(query: string, limit = 10): Promise<MusicSearchResult[]> {
    if (query.length < 3) return [];

    try {
      const baseURL = this.getBaseURL();
      const url = `${baseURL}/api/music/search/songs?q=${encodeURIComponent(query)}&limit=${limit}`;
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Music API error: ${response.status}`);
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Music search error:', error);
      return [];
    }
  }

  // Search for artists using backend API
  async searchArtists(query: string, limit = 10): Promise<{ id: string; name: string; }[]> {
    if (query.length < 2) return [];

    try {
      const baseURL = this.getBaseURL();
      const url = `${baseURL}/api/music/search/artists?q=${encodeURIComponent(query)}&limit=${limit}`;
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Music API error: ${response.status}`);
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Artist search error:', error);
      return [];
    }
  }

  // Combined search for better results using backend API
  async searchCombined(query: string, limit = 10): Promise<MusicSearchResult[]> {
    if (query.length < 3) return [];

    try {
      const baseURL = this.getBaseURL();
      const url = `${baseURL}/api/music/search/combined?q=${encodeURIComponent(query)}&limit=${limit}`;
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Music API error: ${response.status}`);
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Combined music search error:', error);
      return [];
    }
  }

  // Search both songs and artists (for comprehensive results)
  async searchMusic(query: string, limit = 8): Promise<{
    songs: MusicSearchResult[];
    artists: { id: string; name: string; }[];
  }> {
    if (query.length < 3) return { songs: [], artists: [] };

    const [songs, artists] = await Promise.all([
      this.searchSongs(query, limit),
      this.searchArtists(query, limit),
    ]);

    return { songs, artists };
  }
}

// Export singleton instance
export const musicService = new MusicService();
export default musicService;
