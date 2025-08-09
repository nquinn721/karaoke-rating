# BaseAPI Store Integration

## Overview

I have successfully implemented a centralized BaseAPI store using Axios that manages all API calls for both localhost development and production server environments. All other stores now use this BaseAPI store exclusively - **NO DIRECT API CALLS** are made outside of the BaseAPI store.

## Architecture

### BaseAPIStore (`client/src/stores/BaseAPIStore.ts`)

- **Centralized API management** with Axios
- **Environment-aware base URLs**:
  - Development: `http://localhost:3000`
  - Production: Uses `window.location.origin`
- **Automatic request/response interceptors**:
  - Loading state management
  - Error handling and normalization
  - Request timeout (10 seconds)
- **Standardized HTTP methods**: GET, POST, PUT, PATCH, DELETE
- **TypeScript support** with generic types

### Store Dependencies

```typescript
RootStore
├── BaseAPIStore (created first)
├── UserStore (no API calls)
├── ShowsStore (uses BaseAPIStore)
└── ChatStore (uses BaseAPIStore for future features)
```

## Updated Stores

### ShowsStore

**All API methods refactored**:

- ✅ `fetchShows()` - GET `/api/shows`
- ✅ `createShow()` - POST `/api/shows`
- ✅ `joinShow()` - POST `/api/shows/join`
- ✅ `fetchShow()` - GET `/api/shows/:id`
- ✅ `ratePerformance()` - POST `/api/shows/rate`
- ✅ `updateCurrentPerformerAPI()` - PATCH `/api/shows/:id/current-performer`
- ✅ `fetchShowRatings()` - GET `/api/shows/:id/ratings`

**Before & After Example**:

```typescript
// ❌ OLD - Direct fetch calls
async fetchShows() {
  const response = await fetch("/api/shows");
  if (!response.ok) throw new Error("Failed to fetch shows");
  const shows = await response.json();
  // ...
}

// ✅ NEW - Using BaseAPI
async fetchShows() {
  const shows = await this.baseAPI.get<Show[]>("/api/shows");
  // Error handling automatically managed by BaseAPI
}
```

### ChatStore

- ✅ Updated to use BaseAPI for socket URL consistency
- ✅ Added `fetchChatHistory()` method for future API integration
- WebSocket connections use the same base URL logic as HTTP requests

## Features

### Environment Detection

```typescript
private getBaseURL(): string {
  // Development mode detection
  if (import.meta.env.DEV || window.location.hostname === 'localhost') {
    return 'http://localhost:3000';
  }

  // Production uses same origin
  return window.location.origin;
}
```

### Error Handling

- **Centralized error normalization**
- **Automatic loading states**
- **Request/response interceptors**
- **TypeScript error typing**

### Type Safety

```typescript
// Strongly typed API calls
const shows = await this.baseAPI.get<Show[]>("/api/shows");
const newShow = await this.baseAPI.post<Show>("/api/shows", { name, venue });
```

## Benefits

1. **🎯 Single Source of Truth**: All API configuration in one place
2. **🔄 Environment Consistency**: Same logic for dev and prod
3. **📊 Centralized Loading/Error States**: Consistent UX across all API calls
4. **🔒 Type Safety**: Full TypeScript support with generics
5. **🚀 Interceptors**: Automatic request/response handling
6. **⚡ Performance**: Axios optimizations and timeout management
7. **🧪 Testability**: Easy to mock and test API calls
8. **📱 SPA/Server Compatibility**: Works with both Vite dev server and NestJS static serving

## File Structure

```
client/src/stores/
├── BaseAPIStore.ts      # ✅ NEW - Centralized API management
├── RootStore.ts         # ✅ UPDATED - Dependency injection
├── ShowsStore.ts        # ✅ UPDATED - Uses BaseAPI exclusively
├── ChatStore.ts         # ✅ UPDATED - Uses BaseAPI for future features
├── UserStore.ts         # ✅ UNCHANGED - No API calls needed
└── types.ts             # ✅ UNCHANGED - Type definitions
```

## Verification

✅ **Build Status**: All builds passing  
✅ **TypeScript**: No compilation errors  
✅ **Runtime**: Production server running successfully  
✅ **Architecture**: No direct API calls outside BaseAPI  
✅ **Environment**: Localhost dev and production both supported

The application now has a robust, centralized API layer that ensures all HTTP requests go through the BaseAPI store, providing consistent error handling, loading states, and environment management across the entire application.
