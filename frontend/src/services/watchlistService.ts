import api from './api';
import type { WatchlistItem } from '../types/stock';

interface WatchlistDeleteResponse {
  id: number;
  stockId: number;
  removed: boolean;
}

export async function fetchWatchlist() {
  const { data } = await api.get<WatchlistItem[]>('/watchlist');
  console.debug('[watchlistService] fetched watchlist', data);
  return data;
}

export async function addToWatchlist(stockId: number) {
  const { data } = await api.post<WatchlistItem>('/watchlist', { stockId });
  console.debug(`[watchlistService] added stock ${stockId} to watchlist`, data);
  return data;
}

export async function removeFromWatchlist(id: number) {
  const { data } = await api.delete<WatchlistDeleteResponse>(`/watchlist/${id}`);
  console.debug(`[watchlistService] removed watchlist item ${id}`, data);
  return data;
}
