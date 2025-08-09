// MusicBrainz API service for song/artist search
export interface MusicSearchResult {
  id: string;
  title: string;
  artist: string;
  album?: string;
  year?: string;
}

class MusicService {
  private readonly baseURL = 'https://musicbrainz.org/ws/2';
  private readonly userAgent = 'KaraokeRatingsApp/1.0.0';

  // Search for songs by title
  async searchSongs(query: string, limit = 10): Promise<MusicSearchResult[]> {
    if (query.length < 3) return [];

    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.baseURL}/recording?query=recording:${encodedQuery}&fmt=json&limit=${limit}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(`MusicBrainz API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.recordings?.map((recording: any) => ({
        id: recording.id,
        title: recording.title,
        artist: recording['artist-credit']?.[0]?.name || 'Unknown Artist',
        album: recording.releases?.[0]?.title,
        year: recording.releases?.[0]?.date?.split('-')[0],
      })) || [];
    } catch (error) {
      console.error('Music search error:', error);
      return [];
    }
  }

  // Search for artists
  async searchArtists(query: string, limit = 10): Promise<{ id: string; name: string; }[]> {
    if (query.length < 2) return [];

    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.baseURL}/artist?query=artist:${encodedQuery}&fmt=json&limit=${limit}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
        },
      });

      if (!response.ok) {
        throw new Error(`MusicBrainz API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.artists?.map((artist: any) => ({
        id: artist.id,
        name: artist.name,
      })) || [];
    } catch (error) {
      console.error('Artist search error:', error);
      return [];
    }
  }

  // Combined search for both songs and artists
  async searchMusic(query: string, limit = 8): Promise<{
    songs: MusicSearchResult[];
    artists: { id: string; name: string; }[];
  }> {
    if (query.length < 3) return { songs: [], artists: [] };

    const [songs, artists] = await Promise.all([
      this.searchSongs(query, limit),
      this.searchArtists(query, Math.floor(limit / 2)),
    ]);

    return { songs, artists };
  }
}

export const musicService = new MusicService();
