import { apiRequest } from './api';

// Types
export interface Watchlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  symbols: WatchlistItem[];
}

export interface WatchlistItem {
  id: string;
  watchlistId: string;
  symbol: string;
  addedAt: string;
  notes?: string;
  order: number;
}

export interface CreateWatchlistRequest {
  name: string;
  description?: string;
  symbols?: string[];
}

export interface UpdateWatchlistRequest {
  name?: string;
  description?: string;
  isDefault?: boolean;
}

// Watchlist service
const watchlistService = {
  // Get all watchlists for the current user
  getWatchlists: () => {
    return apiRequest<Watchlist[]>({
      method: 'GET',
      url: '/api/user/watchlists',
    });
  },

  // Get watchlist by ID
  getWatchlist: (watchlistId: string) => {
    return apiRequest<Watchlist>({
      method: 'GET',
      url: `/api/user/watchlists/${watchlistId}`,
    });
  },

  // Create new watchlist
  createWatchlist: (data: CreateWatchlistRequest) => {
    return apiRequest<Watchlist>({
      method: 'POST',
      url: '/api/user/watchlists',
      data,
    });
  },

  // Update watchlist
  updateWatchlist: (watchlistId: string, data: UpdateWatchlistRequest) => {
    return apiRequest<Watchlist>({
      method: 'PUT',
      url: `/api/user/watchlists/${watchlistId}`,
      data,
    });
  },

  // Delete watchlist
  deleteWatchlist: (watchlistId: string) => {
    return apiRequest<void>({
      method: 'DELETE',
      url: `/api/user/watchlists/${watchlistId}`,
    });
  },

  // Add symbol to watchlist
  addSymbolToWatchlist: (watchlistId: string, symbol: string, notes?: string) => {
    return apiRequest<WatchlistItem>({
      method: 'POST',
      url: `/api/user/watchlists/${watchlistId}/symbols`,
      data: {
        symbol,
        notes,
      },
    });
  },

  // Add multiple symbols to watchlist
  addSymbolsToWatchlist: (watchlistId: string, symbols: string[]) => {
    return apiRequest<WatchlistItem[]>({
      method: 'POST',
      url: `/api/user/watchlists/${watchlistId}/symbols/batch`,
      data: {
        symbols,
      },
    });
  },

  // Remove symbol from watchlist
  removeSymbolFromWatchlist: (watchlistId: string, symbol: string) => {
    return apiRequest<void>({
      method: 'DELETE',
      url: `/api/user/watchlists/${watchlistId}/symbols/${symbol}`,
    });
  },

  // Update symbol notes
  updateSymbolNotes: (watchlistId: string, symbol: string, notes: string) => {
    return apiRequest<WatchlistItem>({
      method: 'PUT',
      url: `/api/user/watchlists/${watchlistId}/symbols/${symbol}`,
      data: {
        notes,
      },
    });
  },

  // Reorder watchlist symbols
  reorderWatchlistSymbols: (watchlistId: string, symbolOrders: { symbol: string; order: number }[]) => {
    return apiRequest<void>({
      method: 'PUT',
      url: `/api/user/watchlists/${watchlistId}/reorder`,
      data: {
        symbolOrders,
      },
    });
  },

  // Get default watchlist
  getDefaultWatchlist: () => {
    return apiRequest<Watchlist>({
      method: 'GET',
      url: '/api/user/watchlists/default',
    });
  },

  // Set default watchlist
  setDefaultWatchlist: (watchlistId: string) => {
    return apiRequest<Watchlist>({
      method: 'PUT',
      url: `/api/user/watchlists/${watchlistId}/default`,
    });
  },
};

export default watchlistService;