# Activity Tracker

Activity Tracker is a mobile application developed using Ionic React, TypeScript, and Node.js for the Mobile Programming course.

The application allows users to manage daily activities, including workouts, study sessions, shopping, and other personal tasks.

## Technologies

- **Frontend:** Ionic React, TypeScript
- **Backend:** Node.js, Express
- **Communication:** REST API, WebSocket
- **Version Control:** Git, GitHub

## Activity Model

Each activity contains the following properties:

| Property | Type | Description |
|---|---|---|
| id | number | Unique identifier |
| title | string | Activity name |
| description | string | Activity description |
| date | string (date) | Scheduled date |
| duration | number | Duration in minutes |
| completed | boolean | Completion status |
| location | string (optional) | Activity location |

## Ionic1 – Implemented Features

- Master-detail interface for displaying activities
- View activity details
- Create new activities
- Edit existing activities
- Fetch activities from a REST API
- Create and update activities using HTTP POST and PUT
- Receive real-time notifications using WebSocket
- Automatically refresh the activity list when the server reports changes

## Planned Features

### Ionic2
- JWT authentication and protected routes
- Local storage and offline support
- Synchronization with the server
- Pagination, search, and filtering

### Ionic3
- Camera and location services
- Maps integration
- Animations

## Running the Application

### Backend

From the backend directory:

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

## Notes

The current backend stores activities in memory. Data is reset when the server restarts. Persistent storage will be implemented in a future laboratory.