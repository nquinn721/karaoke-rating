# Karafun Module

This module provides integration with Karafun sessions to parse and monitor singers in the karaoke queue.

## Features

- Parse singers from Karafun session URLs
- Track multiple Karafun sessions
- Persistent storage of session data
- Admin-only session management

## API Endpoints

### Public Endpoints

- `POST /api/karafun/parse` - Parse singers from a Karafun URL
- `GET /api/karafun/session/:id/status` - Get session status and current singers

### Admin Endpoints (require admin authentication)

- `GET /api/karafun/sessions` - Get all tracked sessions
- `DELETE /api/karafun/session/:id` - Remove a session from tracking

## Usage Examples

### Parse Queue from URL

```bash
curl -X POST http://localhost:3000/api/karafun/parse \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.karafun.com/080601/"}'
```

### Get Session Status

```bash
curl http://localhost:3000/api/karafun/session/080601/status
```

### Get All Sessions (Admin)

```bash
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:3000/api/karafun/sessions
```

## Implementation Details

The module uses two approaches to extract singer data:

1. **HTML Scraping**: Parses the HTML response to find singer names using regex patterns
2. **API Discovery**: Attempts to find and use Karafun's API endpoints (if available)

The service stores session information in the database for persistence and caching.

## Configuration

The module uses the following HTTP client settings:

- Timeout: 10 seconds
- Max redirects: 5
- Custom User-Agent to mimic a real browser

## Database Schema

The `karafun_sessions` table stores:

- `sessionId`: The Karafun session ID
- `url`: The full Karafun session URL
- `isActive`: Whether the session is still active
- `lastKnownSingers`: JSON array of the last known singers
- `totalSingers`: Count of singers in the queue
- `createdAt`: When the session was first tracked
- `lastUpdated`: When the session was last updated

## Error Handling

The module handles various error cases:

- Invalid URL formats
- Network timeouts
- HTML parsing failures
- Database connection issues

Failed requests return appropriate error messages while maintaining system stability.
