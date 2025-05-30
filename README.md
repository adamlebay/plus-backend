# Plus Backend

## Overview
The Plus Backend is a Node.js application built with Express.js that provides a RESTful API for managing volunteering events and user authentication. It utilizes PostgreSQL for data storage and Supabase for authentication services.

## Features
- User registration and login with OAuth support via Supabase.
- Management of volunteering events, including creation, updating, and retrieval.
- User profile management with the ability to view and update user information.
- JWT-based authentication for secure access to protected routes.
- Real-time updates and notifications for users.

## Project Structure
```
plus-backend
├── src
│   ├── app.js                # Initializes the Express application and sets up middleware
│   ├── server.js             # Entry point for starting the server
│   ├── config
│   │   ├── db.js             # PostgreSQL database configuration
│   │   └── supabase.js       # Supabase client initialization
│   ├── controllers
│   │   ├── authController.js  # Handles user authentication
│   │   ├── userController.js  # Manages user profiles
│   │   └── eventController.js # Manages volunteering events
│   ├── middleware
│   │   └── authMiddleware.js  # JWT verification middleware
│   ├── models
│   │   ├── userModel.js       # User model schema
│   │   └── eventModel.js      # Event model schema
│   ├── routes
│   │   ├── authRoutes.js      # Authentication routes
│   │   ├── userRoutes.js      # User management routes
│   │   └── eventRoutes.js     # Event management routes
│   └── utils
│       └── jwt.js             # JWT utility functions
├── prisma
│   └── schema.prisma          # Prisma schema definition
├── .env                        # Environment variables
├── package.json                # NPM configuration
└── README.md                   # Project documentation
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd plus-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables for PostgreSQL and Supabase.

## Usage
To start the server, run:
```
npm start
```

The server will listen on the specified port (default is 3000). You can access the API endpoints for user authentication, profile management, and event management.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the ISC License.
