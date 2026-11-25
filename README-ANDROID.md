## Android 1 – Native Android Application

The Android application is developed using Kotlin and Jetpack Compose, reusing the existing Node.js REST API.

### Technologies

- Kotlin and Jetpack Compose
- MVVM architecture with Repository
- Retrofit and Gson
- Kotlin Coroutines and StateFlow
- Navigation Compose
- JWT authentication

### Implemented Features

- User authentication with JWT and logout
- Master-detail interface for displaying activities
- Creating and editing activities
- Form validation, including calendar date validation
- Navigation between screens
- Loading indicators and error handling
- User-specific activity management

### Running the Application

1. Start the Node.js server using `npm start` inside the `server` directory.
2. Open the `android` directory in Android Studio.
3. Run the application on an Android emulator.

The application connects to the backend through `http://10.0.2.2:3000/`.

### Testing

All 24 functional tests passed on the Android emulator, covering authentication, master-detail navigation, activity creation and editing, input validation, user data isolation and network error handling.

### Notes

- Target SDK 36 is used for local network compatibility.
- JWT tokens are currently stored in memory.
- Calendar date validation is implemented on the Android client.