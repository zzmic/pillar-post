# pillar-post

## Overview

This is a blog platform powered by the PERN stack, combining PostgreSQL, Express.js, React, and Node.js. It provides a secure and intuitive environment for content creation and management, with a RESTful API on the backend that guarantees data integrity and a dynamic React frontend (under development) that supports rich-text editing, interactive commenting, and dynamic content rendering.

Content is transformed into a structured blog ecosystem through a comprehensive, multi-layered architecture:

1.  **Authentication**: Secure, session-based authentication with role-based access control.
2.  **Data Management**: A normalized PostgreSQL database with the Sequelize ORM for efficient data modeling.
3.  **API Integration**: Robust RESTful endpoints with comprehensive validation and middleware.
4.  **Security**: Proactive measures like password hashing, rate limiting, and input sanitization.
5.  **Content System**: Tools for post creation, categorization, tagging, and a nested commenting system.

## Supported Features

### User-Centric Features

- **Role-Based Access**: Hierarchical permissions for `admin`, `author`, and `subscriber` roles.
- **Profile Management**: Users can manage their username, email, first/last name, bio, and profile picture.
- **Secure Authentication**: bcrypt hashing with configurable rounds ensures password security.

### Content Management

- **Rich-Text Posts**: Create, update, and delete posts with rich-text content.
- **Dynamic Organization**: Flexible categorization and tagging with many-to-many relationships.
- **SEO-Friendly URLs**: Automatic slug generation for clean, search-engine-friendly URLs.
- **Post Ownership**: Enforced ownership rules for editing and deleting content.

### Interactive Commenting

- **Nested Replies**: Self-referential associations enable threaded comment replies.
- **Content Moderation**: Comments can be flagged as `approved`, `pending`, or `spam` for control.
- **Anonymous Contributions**: Optional user association allows for anonymous commenting.

### Robust Security

- **Session Security**: Uses secure, HttpOnly, and SameSite cookies with a PostgreSQL-backed session store.
- **Input Validation**: Express Validator and sanitize-html prevent common attacks like SQL injection and XSS.
- **Rate Limiting**: Throttles authentication attempts to prevent brute-force attacks.
- **CORS Protection**: Configurable cross-origin resource sharing for secure communication.

## Project Structure

The application is organized into a clear, modular structure:

- **server/**: The core Node.js and Express backend.
- **server/config/**: Configuration files for database, sessions, and environment variables.
- **server/controllers/**: Handles request logic and business rules.
- **server/middleware/**: Custom middleware functions for request processing.
- **server/migrations/**: Manages database schema changes.
- **server/models/**: Sequelize ORM model definitions.
- **server/routes/**: Defines API endpoints and their associated controllers.
- **server/utils/**: Utility functions for various tasks.
- **client/**: The React frontend.

## Building and Usage

### Prerequisites

- Node.js
- PostgreSQL
- Environment variables configured (`.env` file)

### Installation

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Database Setup

```bash
# Create database and run migrations
cd server
npx sequelize-cli db:create
npx sequelize-cli db:migrate
```

### Running the Application

#### Development

1.  Start the backend: `cd server && npm run dev`
2.  Start the frontend: `cd client && npm run dev`

#### Production

1.  Build the frontend: `cd client && npm run build`
2.  Start the production server: `cd server && npm start`

## API Endpoints

- **Authentication**:
  - `POST /api/auth/signup`: User registration.
  - `POST /api/auth/login`: Session-based login.
  - `POST /api/auth/logout`: Session destruction.

- **Posts**:
  - `POST /api/posts`: Create a new post (Author/Admin only).
  - `GET /api/posts`: Retrieve all posts with pagination.
  - `GET /api/posts/:id`: Get a single post with comments and associations.
  - `PUT /api/posts/:id`: Update a post (ownership required).
  - `DELETE /api/posts/:id`: Delete a post (ownership required).

- **Comments**:
  - `POST /api/comments`: Create a new comment.
  - `PUT /api/comments/:id`: Update a comment (ownership required).
  - `DELETE /api/comments/:id`: Delete a comment (ownership required).

## References
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [Sequelize Documentation](https://sequelize.org/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
