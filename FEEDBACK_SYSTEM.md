# Feedback System

## Overview
The feedback system allows users to submit feedback, bug reports, feature requests, and general suggestions directly from the application.

## Features
- **User-friendly dropdown menu** accessible from the username in the header
- **Categorized feedback types**: Bug reports, feature requests, improvements, and general feedback
- **Database persistence** using MySQL database 'karaoke'
- **Status tracking** for feedback management

## Database Configuration
The system connects to a MySQL database with these credentials:
- Database: `karaoke`
- Username: `karaoke`
- Password: `GC(*g""\9SH@{vBr`

The database table is automatically created when the application starts.

## Frontend Components
- **UserMenu.tsx**: Dropdown menu component with feedback option
- **FeedbackModal.tsx**: Modal dialog for submitting feedback
- **FeedbackStore.ts**: MobX store for managing feedback state

## Backend Components
- **FeedbackModule**: NestJS module containing feedback functionality
- **FeedbackController**: REST API endpoints for feedback operations
- **FeedbackService**: Database operations and business logic
- **feedback.interface.ts**: TypeScript interfaces and DTOs

## API Endpoints
- `POST /api/feedback` - Submit new feedback
- `GET /api/feedback` - Get all feedback (admin)
- `GET /api/feedback?username={username}` - Get user's feedback
- `PUT /api/feedback/status` - Update feedback status (admin)

## Usage
1. Click on your username/avatar in the header
2. Select "Send Feedback" from the dropdown menu
3. Choose feedback type and fill in details
4. Submit feedback for review

## Environment Variables
Set `DB_HOST` environment variable for Cloud Run deployment.
