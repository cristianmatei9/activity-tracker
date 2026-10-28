# Activity Tracker

Activity Tracker is a mobile application developed using Ionic React, TypeScript, and Node.js for the Mobile Programming course.

The application allows authenticated users to manage daily activities, including workouts, study sessions, shopping, and other personal tasks, with online and offline support.

## Technologies

- **Frontend:** Ionic React, TypeScript
- **Backend:** Node.js, Express
- **Communication:** REST API, WebSocket
- **Authentication:** JSON Web Tokens (JWT)
- **Local Storage:** Browser localStorage
- **Version Control:** Git, GitHub

## Activity Model

Each activity contains the following properties:

| Property | Type | Description |
|---|---|---|
| id | number | Unique identifier |
| userId | number | Associated user identifier |
| title | string | Activity name |
| description | string | Activity description |
| date | string (date) | Scheduled date |
| duration | number | Duration in minutes |
| completed | boolean | Completion status |
| location | string (optional) | Activity location |

## Ionic1 – Implemented Features

- Master-detail interface for displaying activities
- View activity details
- Create and edit activities
- Fetch activities from a REST API
- Create and update activities using HTTP POST and PUT
- Receive real-time notifications using WebSocket
- Automatically refresh the activity list when the server reports changes

## Ionic2 – Implemented Features

- JWT authentication with token persistence and automatic login
- Logout functionality
- Secured REST endpoints and WebSocket connections
- User-specific activities and WebSocket notifications
- Online/offline network status indicator
- Local storage for cached activities
- Offline creation and editing of activities
- Pending operations queue with visual indicators
- Automatic synchronization when the server becomes available
- REST API pagination with infinite scrolling
- Server-side search and filtering
- Local search and filtering when offline

## Planned Features

### Ionic3

- Camera and location services
- Maps integration
- Animations

## Running the Application

### Backend

From the `server` directory:

```bash
npm install
npm start
```

The server runs at `http://localhost:3000`.

### Frontend

From the `ionic` directory:

```bash
npm install
ionic serve
```

The application runs at `http://localhost:8100`.

## Testing

The application includes sample activities for testing pagination, search, filtering, and user-specific data access.

The following scenarios have been tested:

- Authentication, automatic login, and logout
- User-specific REST data and WebSocket notifications
- Online activity creation and editing
- Offline activity creation and editing
- Automatic synchronization of pending operations
- REST pagination and infinite scrolling
- Search and filtering

## Notes

The current backend stores activities in memory. Server-side data is reset when the backend restarts, while locally cached data is
