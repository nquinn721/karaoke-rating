export interface MusicSearchResult {
  id: string;
  title: string;
  artist: string;
  album?: string;
  year?: string;
}

export interface ArtistSearchResult {
  id: string;
  name: string;
  disambiguation?: string;
  country?: string;
}

export interface SearchMusicDto {
  query: string;
  limit?: number;
}
