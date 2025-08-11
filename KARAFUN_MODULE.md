# Karafun Module

This NestJS module provides integration with Karafun sessions to parse singers from the queue.

## Features

- Parse singers from Karafun session URLs
- Store session data in the database
- Track session status and history
- Admin-only endpoints for session management
- Fallback to multiple parsing strategies (HTML scraping and API attempts)

## API Endpoints

### POST `/api/karafun/parse`

Parse singers from a Karafun session URL.

**Request Body:**

```json
{
  "url": "https://www.karafun.com/080601/"
}
```

**Response:**

```json
{
  "sessionId": "080601",
  "singers": [
    {
      "nickname": "Singer1",
      "position": 1,
      "joinedAt": "2025-08-11T10:00:00Z"
    }
  ],
  "totalSingers": 1,
  "lastUpdated": "2025-08-11T10:00:00Z"
}
```

### GET `/api/karafun/sessions` (Admin Only)

Get all tracked Karafun sessions.

**Response:**

```json
[
  {
    "sessionId": "080601",
    "url": "https://www.karafun.com/080601/",
    "isActive": true,
    "createdAt": "2025-08-11T10:00:00Z",
    "lastUpdated": "2025-08-11T10:00:00Z"
  }
]
```

### GET `/api/karafun/session/:id/status`

Get the current status of a specific session.

**Response:**

```json
{
  "sessionId": "080601",
  "isValid": true,
  "singers": [...],
  "error": null
}
```

### DELETE `/api/karafun/session/:id` (Admin Only)

Remove a session from tracking.

**Response:**

```json
{
  "success": true,
  "message": "Session removed successfully"
}
```

## Database Schema

The module creates a `karafun_sessions` table with the following structure:

```sql
CREATE TABLE karafun_sessions (
  sessionId VARCHAR(255) PRIMARY KEY,
  url VARCHAR(500) NOT NULL,
  isActive BOOLEAN DEFAULT true,
  lastKnownSingers JSON,
  totalSingers INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Usage Example

### Frontend Integration

```typescript
// Parse a Karafun session
const response = await fetch("/api/karafun/parse", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: "https://www.karafun.com/080601/",
  }),
});

const queueData = await response.json();
console.log("Singers:", queueData.singers);
```

### Service Usage

```typescript
import { KarafunService } from "./karafun/karafun.service";

@Injectable()
export class SomeService {
  constructor(private karafunService: KarafunService) {}

  async importKarafunQueue(url: string) {
    const queueData = await this.karafunService.parseQueueFromUrl(url);
    // Process the singer data...
    return queueData;
  }
}
```

## Implementation Details

### Parsing Strategy

The service uses multiple strategies to extract singer data:

1. **API Endpoints**: Attempts to find and use official Karafun API endpoints
2. **JSON in Scripts**: Looks for initial state data in script tags
3. **HTML Pattern Matching**: Uses regex patterns to find singer names in HTML

### Error Handling

- Invalid URLs return appropriate error messages
- Network failures are handled gracefully
- Fallback to last known singer data when live parsing fails

### Security

- Admin-only endpoints are protected with `AdminGuard`
- Input validation on URLs
- Sanitized HTML parsing to prevent XSS

## Future Enhancements

- [ ] Real-time WebSocket updates for queue changes
- [ ] Integration with existing karaoke show management
- [ ] Bulk import from multiple Karafun sessions
- [ ] Export queue data to other formats
- [ ] Auto-refresh capabilities for active sessions
- [ ] Rate limiting and caching for frequent requests

## Dependencies

- `@nestjs/axios` - HTTP client for making requests
- `@nestjs/typeorm` - Database integration
- `axios` - HTTP requests
- `rxjs` - Reactive programming support

## Configuration

No additional configuration required. The module uses the same database connection as the main application.
