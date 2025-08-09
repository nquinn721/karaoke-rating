import { useCallback, useEffect, useState } from 'react';
import { musicService, MusicSearchResult } from '../services/musicService';

export interface UseAutocompleteResult {
  suggestions: MusicSearchResult[];
  artistSuggestions: { id: string; name: string; }[];
  loading: boolean;
  error: string | null;
}

export const useAutocomplete = (query: string, delay = 500): UseAutocompleteResult => {
  const [suggestions, setSuggestions] = useState<MusicSearchResult[]>([]);
  const [artistSuggestions, setArtistSuggestions] = useState<{ id: string; name: string; }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce the query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [query, delay]);

  // Search when debounced query changes
  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      setArtistSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await musicService.searchMusic(searchQuery);
      setSuggestions(results.songs);
      setArtistSuggestions(results.artists);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setSuggestions([]);
      setArtistSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  return {
    suggestions,
    artistSuggestions,
    loading,
    error,
  };
};
