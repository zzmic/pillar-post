# pillar-post

## Overview

`pillar-post` is a blog platform powered by the PERN stack, combining PostgreSQL, Express.js, React, and Node.js. It provides a secure and intuitive environment for content creation and management, with a RESTful API on the backend that guarantees data integrity and a dynamic React frontend that supports rich-text editing, interactive commenting, and dynamic content rendering.

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
- **Rate Limiting**: Stricter limits on `/api/auth`; a separate limit applies to all `/api` routes.
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
- **client/**: The React frontend application.
  - **client/src/components/**: React components for UI (Posts, Comments, Auth, etc.).
  - **client/src/context/**: React Context for authentication state management.
  - **client/src/services/**: API service layer for backend communication.

## Building and Usage

### Prerequisites

- Node.js
- PostgreSQL
- Environment variables configured (`.env` file)

### Environment variables (server)

| Variable                                       | Notes                                                                                                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DB_NAME`                                      | Base name for databases: `{DB_NAME}_dev`, `_test`, `_prod`. If unset in development/test, defaults to `pillar_post` (e.g. `pillar_post_dev`). **Required in production.** |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` | PostgreSQL connection (see `server/config/config.js`).                                                                                                                    |
| `SESSION_SECRET`                               | Required. Used to sign session cookies.                                                                                                                                   |
| `CORS_ORIGIN`                                  | Allowed browser origin (default `http://localhost:3000`).                                                                                                                 |
| `TRUST_PROXY`                                  | Optional; set to `1` or `true` when the app sits behind a reverse proxy so `req.ip`, rate limiting, and secure cookies use `X-Forwarded-*` correctly.                               |
| `TRUST_PROXY_HOPS`                             | Optional; number of trusted proxies (default `1`). Only used when `TRUST_PROXY` is enabled.                                                                               |

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

Migrations create application tables and the **`session`** table used by the PostgreSQL session store (`connect-pg-simple`). Run them on every new database.

```bash
# Create database and run migrations
cd server
npx sequelize-cli db:create
npx sequelize-cli db:migrate
```

### Running the Application

#### Development

1. **Start the backend server** (runs on port 8080):
   ```bash
   cd server
   npm run dev
   ```
2. **Start the frontend development server** (runs on port 5173):
   ```bash
   cd client
   npm run dev
   ```

## Frontend Features

The React frontend provides a user interface for the blog platform:

- **Authentication UI**: Login and signup forms with session management
- **Posts Management**:
  - View all posts with pagination
  - View individual post details
  - Create new posts (authors only)
  - Edit and delete posts (ownership required)
- **Comments System**:
  - View comments on posts
  - Post new comments (authenticated users)
  - Delete own comments
- **User Interface**:
  - Responsive navigation bar
  - Role-based UI elements (Admin, Author, Subscriber)

## API Endpoints

- **Health**:
  - `GET /health`: Liveness/readiness-style check. Returns **200** when the app and database connection are OK, **503** if the database check fails (see `checks.database` in the JSON body).

- **Authentication**:
  - `POST /api/auth/signup`: User registration (new accounts are created as `subscriber`; roles are not chosen via this endpoint).
  - `POST /api/auth/login`: Session-based login.
  - `POST /api/auth/logout`: Session destruction.

- **Posts**:
  - `POST /api/posts`: Create a new post (Author/Admin only).
  - `GET /api/posts`: Retrieve all posts with pagination.
  - `GET /api/posts/:id`: Get a single post with comments and associations.
  - `PUT /api/posts/:id`: Update a post (ownership required).
  - `DELETE /api/posts/:id`: Delete a post (ownership required).

- **Comments**:
  - `POST /api/comments/posts/:post_id`: Create a new comment.
  - `GET /api/comments/posts/:post_id`: Get comments for a post.
  - `PUT /api/comments/:id`: Update a comment (ownership required).
  - `DELETE /api/comments/:id`: Delete a comment (ownership required).

- **Users**:
  - `GET /api/users/:id/profile`: Get a user's profile.
  - `PUT /api/users/:id/profile`: Update a user's profile.
