# Karaoke Ratings App

A full-stack karaoke ratings application built with React/TypeScript frontend and NestJS backend, featuring real-time chat and QR code scanning.

## Features

- **User Management**: Username-based authentication with local storage persistence
- **Show Management**: Create and join karaoke shows at different venues
- **Real-time Features**: WebSocket-powered chat and live updates
- **Rating System**: Rate performances with 1-10 scale and comments
- **QR Code Support**: Join shows by scanning QR codes
- **Dark Theme**: Modern dark grey theme with colorful highlights
- **Mobile Responsive**: Works on all devices

## Tech Stack

### Frontend

- React 18 with TypeScript
- Vite for build tooling
- Material-UI (MUI) for components
- MobX for state management
- MobX-persist for data persistence
- React Router for navigation
- Socket.io client for real-time communication

### Backend

- NestJS framework
- WebSocket gateway for real-time features
- Express.js for HTTP server
- Socket.io for WebSocket handling

### Deployment

- Docker containerization
- Google Cloud Run deployment
- GitHub Actions for CI/CD

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd karaoke-ratings
```

2. Install backend dependencies:

```bash
npm install
```

3. Install frontend dependencies:

```bash
cd client
npm install
cd ..
```

### Development

1. Start the backend server:

```bash
npm run start:dev
```

2. In a new terminal, start the frontend development server:

```bash
cd client
npm run dev
```

The application will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- WebSocket: ws://localhost:3000

### Production Build

1. Build both frontend and backend:

```bash
npm run build
```

2. Start the production server:

```bash
npm run start:prod
```

### Docker

1. Build the Docker image:

```bash
docker build -t karaoke-ratings .
```

2. Run the container:

```bash
docker run -p 3000:3000 karaoke-ratings
```

## Usage

1. **First Visit**: Enter your username when prompted
2. **Home Page**: View available shows or create/join new ones
3. **Create Show**: Add a show name and select venue (KaraFun, Excess, or DJ Steve)
4. **Join Show**: Click on a show card or scan a QR code
5. **In Show**: Switch between Rating and Chat tabs
   - **Rating Tab**: Rate current performer and view recent ratings
   - **Chat Tab**: Real-time chat with other participants

## API Endpoints

- `GET /api/shows` - Get all shows
- `POST /api/shows` - Create a new show
- `GET /api/shows/:id` - Get show details
- `POST /api/shows/join` - Join a show
- `POST /api/shows/rate` - Rate a performance
- `PATCH /api/shows/:id/current-performer` - Update current performer

## WebSocket Events

- `joinShow` - Join a show room
- `sendMessage` - Send chat message
- `newMessage` - Receive chat message
- `leaveShow` - Leave show room
- `currentPerformerUpdate` - Update current performer

## Deployment

The app is configured for automatic deployment to Google Cloud Run via GitHub Actions.

### Required Secrets

Set these in your GitHub repository secrets:

- `GCP_PROJECT_ID`: Your Google Cloud Project ID
- `GCP_SA_KEY`: Service Account JSON key for deployment

### Manual Deployment

1. Build and tag the image:

```bash
docker build -t gcr.io/[PROJECT-ID]/karaoke-ratings .
docker push gcr.io/[PROJECT-ID]/karaoke-ratings
```

2. Deploy to Cloud Run:

```bash
gcloud run deploy karaoke-ratings \
  --image gcr.io/[PROJECT-ID]/karaoke-ratings \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
