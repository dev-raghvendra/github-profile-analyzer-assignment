# GitHub Profile Analyzer API

A powerful REST API built with Node.js, Express, and TypeScript that analyzes GitHub user profiles, fetches detailed statistics, and caches results in a MySQL database.

## Features

- **GitHub Profile Analysis**: Fetch and analyze GitHub user profiles with detailed statistics
- **Data Caching**: Store profiles in MySQL for optimized performance and reduced API calls
- **Rate Limiting**: Built-in rate limiting (200 requests per 15 minutes) to prevent abuse
- **Request Validation**: Input validation middleware for robust error handling
- **Error Handling**: Comprehensive error handling with meaningful HTTP status codes
- **Logging**: Structured logging for debugging and monitoring
- **Docker Support**: Pre-configured Docker and Docker Compose for easy deployment
- **Type-Safe**: Full TypeScript support for type safety and better DX
- **Testing**: Automated test suite with Vitest

## Tech Stack

- **Runtime**: Node.js 22
- **Framework**: Express.js 5.x
- **Language**: TypeScript 6.x
- **Database**: MySQL 8 with Drizzle ORM
- **API Testing**: Supertest & Vitest
- **Logging**: Morgan & Custom Logger
- **Security**: CORS, Rate Limiting, Input Validation

## Prerequisites

- Node.js 22 or higher
- npm or yarn
- Docker (optional, for containerized deployment)
- MySQL 8 (or use Docker Compose)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd assignment-3
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL=mysql://user:password@localhost:3306/github_analyzer
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_PROFILE_CACHE_TTL=60
GITHUB_API_BASE_URL=https://api.github.com
PORT=3000
```

**Environment Variables Explanation:**
- `DATABASE_URL`: MySQL connection string
- `GITHUB_TOKEN`: GitHub Personal Access Token for API requests (get from https://github.com/settings/tokens)
- `GITHUB_PROFILE_CACHE_TTL`: Cache time-to-live in seconds (default: 60)
- `GITHUB_API_BASE_URL`: GitHub API base URL
- `PORT`: Server port (default: 3000)

### 4. Setup database

#### Option A: Using Docker Compose (Recommended)

```bash
docker-compose up -d
```

This will start a MySQL container with the required database.

#### Option B: Manual MySQL setup

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE github_analyzer;"

# Update DATABASE_URL in .env with your MySQL credentials
```

## Running the Application

### Development Mode

```bash
npm run dev
```

Server will start with hot-reload enabled at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

### Using Docker

Build and run the Docker image:

```bash
docker build -t github-profile-analyzer .
docker run -p 3000:3000 --env-file .env github-profile-analyzer
```

## API Endpoints

### Root Endpoint

```
GET /
```

Returns API documentation with available endpoints.

**Response:**
```json
{
  "name": "GitHub Profile Analyzer API",
  "status": "running",
  "docs": {
    "analyze": "GET /api/v1/profiles/analyze/:username",
    "list": "GET /api/v1/profiles/list",
    "getOne": "GET /api/v1/profiles/:username",
    "delete": "DELETE /api/v1/profiles/:username"
  }
}
```

### Analyze GitHub Profile

```
GET /api/v1/profiles/analyze/:username
```

Fetches and analyzes a GitHub user profile, storing results in the database.

**Parameters:**
- `username` (string): GitHub username to analyze

**Response:**
```json
{
  "id": 1,
  "username": "torvalds",
  "followers": 210000,
  "public_repos": 15,
  "profile_url": "https://github.com/torvalds",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-06-21T15:30:00Z"
}
```

**Status Codes:**
- `200`: Profile successfully analyzed and stored
- `400`: Invalid username format
- `404`: User not found on GitHub
- `429`: Rate limit exceeded
- `500`: Server error

### List GitHub Profiles

```
GET /api/v1/profiles/list
```

Retrieves a paginated list of all cached GitHub profiles from the database.

**Query Parameters:**
- `page` (number, required): Page number for pagination (default: 1)
- `per_page` (number, required): Number of profiles per page (default: 10)

**Response:**
```json
{
  "code": 200,
  "message": "Profiles found",
  "profiles": [
    {
      "githubId": 1,
      "username": "octocat",
      "name": "The Octocat",
      "avatarUrl": "https://avatars.githubusercontent.com/u/1?v=4",
      "profileUrl": "https://github.com/octocat",
      "bio": "There once was...",
      "company": "GitHub",
      "location": "San Francisco",
      "blog": "https://github.blog",
      "twitterUsername": "octocat",
      "email": null,
      "hireable": null,
      "stats": {
        "publicRepos": 2,
        "publicGists": 8,
        "followers": 3938,
        "following": 9,
        "followerFollowingRatio": 437.56
      },
      "insights": {
        "totalStars": 4520,
        "totalForks": 1890,
        "totalWatchers": 2340,
        "topLanguage": "JavaScript",
        "languageBreakdown": {"JavaScript": 45, "Python": 30, "Go": 25},
        "mostStarredRepo": "Hello-World",
        "mostStarredRepoStars": 3000,
        "accountAgeDays": 5000,
        "activityScore": 8.5
      },
      "githubCreatedAt": "2011-01-26T19:01:12Z",
      "githubUpdatedAt": "2024-01-15T12:00:00Z",
      "analyzedAt": "2024-01-15T12:00:00Z",
      "createdAt": "2024-01-15T12:00:00Z",
      "updatedAt": "2024-01-15T12:00:00Z"
    }
  ],
  "perPage": 10,
  "nextPage": 2
}
```

**Status Codes:**
- `200`: Profiles retrieved successfully
- `400`: Invalid pagination parameters
- `429`: Rate limit exceeded
- `500`: Server error

### Get Cached Profile

```
GET /api/v1/profiles/:username
```

Retrieves a previously cached GitHub profile from the database.

**Parameters:**
- `username` (string): GitHub username

**Response:**
```json
{
  "id": 1,
  "username": "torvalds",
  "followers": 210000,
  "public_repos": 15,
  "profile_url": "https://github.com/torvalds",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-06-21T15:30:00Z"
}
```

**Status Codes:**
- `200`: Profile found
- `400`: Invalid username format
- `404`: Profile not found in database
- `429`: Rate limit exceeded
- `500`: Server error

### Delete Profile

```
DELETE /api/v1/profiles/:username
```

Removes a cached GitHub profile from the database.

**Parameters:**
- `username` (string): GitHub username

**Response:**
```json
{
  "message": "Profile deleted successfully"
}
```

**Status Codes:**
- `200`: Profile deleted successfully
- `400`: Invalid username format
- `404`: Profile not found
- `429`: Rate limit exceeded
- `500`: Server error

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm test -- --coverage
```

Test files are located in `src/tests/` directory.

## Project Structure

```
assignment-3/
├── src/
│   ├── app.ts                    # Express app configuration
│   ├── server.ts                 # Server entry point
│   ├── config/
│   │   └── config.ts             # Configuration loader
│   ├── controllers/
│   │   └── profile.controller.ts # Route handlers
│   ├── services/
│   │   └── github.service.ts     # GitHub API integration
│   ├── routes/
│   │   └── profile.routes.ts     # Route definitions
│   ├── middlewares/
│   │   ├── error.middleware.ts   # Error handling
│   │   └── validation.middleware.ts # Input validation
│   ├── database/
│   │   ├── client.ts             # Database connection
│   │   └── schema.ts             # Table schemas
│   ├── utils/
│   │   ├── logger.ts             # Logging utilities
│   │   └── error.ts              # Error classes
│   ├── types/
│   │   └── request.ts            # TypeScript types
│   └── tests/
│       └── profile.test.ts       # Test suite
├── .env                          # Environment variables
├── docker-compose.yaml           # Docker Compose configuration
├── Dockerfile                    # Docker image definition
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── vitest.config.ts              # Vitest configuration
├── tsup.config.ts                # Build configuration
└── README.md                     # This file
```

## API Rate Limiting

The API implements rate limiting to prevent abuse:

- **Limit**: 200 requests per 15 minutes
- **Rate Limit Header**: Included in response headers
- **Exceeded Response**: `429 Too Many Requests`

## Error Handling

The API returns standardized error responses:

```json
{
  "error": "Error message",
  "status": 400
}
```

Common error codes:
- `400`: Bad Request (validation errors)
- `404`: Not Found (user not found)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

## Database Schema

### profiles table

| Column | Type | Description |
|--------|------|-------------|
| id | INT PRIMARY KEY | Auto-incrementing ID |
| username | VARCHAR(255) UNIQUE | GitHub username |
| followers | INT | Number of followers |
| public_repos | INT | Number of public repositories |
| profile_url | VARCHAR(255) | GitHub profile URL |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

## Development

### Adding a new endpoint

1. Create a controller method in `src/controllers/profile.controller.ts`
2. Define the route in `src/routes/profile.routes.ts`
3. Add validation middleware if needed in `src/middlewares/validation.middleware.ts`
4. Write tests in `src/tests/profile.test.ts`
5. Add documentation in this README

### Code Standards

- Use TypeScript for type safety
- Follow Express.js conventions
- Add error handling for all async operations
- Include JSDoc comments for complex functions
- Write tests for new features

## Deployment

### Deploy to Production

1. Build the application: `npm run build`
2. Set up environment variables in production
3. Run with Docker or directly: `npm start`
4. Monitor logs and error tracking

### Environment Considerations

- Use a production-grade MySQL instance
- Enable HTTPS/TLS for API endpoints
- Rotate GitHub tokens regularly
- Monitor rate limiting and adjust as needed
- Set up proper logging and monitoring

## Troubleshooting

### Database connection failed

- Check `DATABASE_URL` in `.env`
- Ensure MySQL is running
- Verify credentials and network access

### GitHub API errors

- Verify `GITHUB_TOKEN` is valid
- Check GitHub API rate limits
- Ensure user exists on GitHub

### Rate limit exceeded

- Wait for the retry period specified in `Retry-After` header
- Consider upgrading GitHub token permissions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License. See the LICENSE file for details.

## Support

For support, please open an issue on the GitHub repository or contact the maintainers.

## Changelog

### Version 1.0.0
- Initial release
- GitHub profile analysis API
- MySQL caching
- Rate limiting
- Docker support
