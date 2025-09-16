# 🔐 Cipher

> The modern, self-hosted authentication and authorization service. Built with Bun, Elysia.js, and TypeScript for unparalleled performance and type safety.

## Features

- **🔑 JWT Authentication** - Secure access and refresh token flow
- **🛡️ RBAC Ready** - Role-based access control foundation
- **⚡ Blazing Fast** - Built on Bun and Elysia.js for maximum performance
- **🔒 Security First** - Password hashing with Bun.password, rate limiting, and security headers
- **📦 SDK Ready** - First-class support for React and Node.js clients
- **🐘 PostgreSQL** - Prisma ORM with type-safe database operations
- **🧠 Redis** - Token blacklisting and session management
- **🛠️ TypeScript** - End-to-end type safety

## Quick Start

### Prerequisites

- Bun ^1.0.0
- PostgreSQL
- Redis

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/cipher-auth-service.git
   cd cipher-auth-service
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your database and Redis credentials:

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/cipher_auth"
   REDIS_URL="redis://localhost:6379"
   JWT_SECRET="your-super-secure-jwt-secret"
   ```

4. **Set up database**

   ```bash
   bunx prisma migrate dev
   ```

5. **Start the server**
   ```bash
   bun run src/index.ts
   ```
   The server will start on `http://localhost:3000`

## API Reference

### Authentication Endpoints

- `POST /auth/signup` - Create a new user account
- `POST /auth/signin` - Authenticate a user
- `POST /auth/logout` - Invalidate user session
- `POST /auth/refresh` - Refresh access token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token

### Protected Endpoints

- `GET /users/me` - Get current user profile (requires authentication)

## SDK Usage

### React SDK

```bash
bun add @cipher-auth/react
```

```tsx
import { AuthProvider, useAuth } from '@cipher-auth/react';

function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}

function ProtectedComponent() {
  const { user, signIn, signOut } = useAuth();

  if (!user)
    return <button onClick={() => signIn({ email, password })}>Sign In</button>;

  return (
    <div>
      Welcome {user.email}! <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Node.js/Backend SDK

```bash
bun add @cipher-auth/backend
```

```typescript
import { validateJwt } from '@cipher-auth/backend';

// In your middleware
const { payload, error } = await validateJwt(request.headers.authorization);
if (error) throw new Error('Unauthorized');

// payload contains { userId: string }
```

## Development

### Project Structure

```
src/
├── index.ts              # Application entry point
├── lib/                  # Utility libraries
│   ├── db.ts            # Database client
│   ├── redis.ts         # Redis client
│   ├── logger.ts        # Logging utilities
│   └── errors.ts        # Custom error classes
├── routes/              # API route handlers
│   └── auth.ts          # Authentication routes
└── test/                # Test files
```

### Running Tests

```bash
# Run all tests
bun test

# Run tests with coverage
bun test --coverage
```

## Deployment

### Docker Deployment

```dockerfile
# Use official Bun image
FROM oven/bun:1-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Start the server
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
```

### Environment Variables

See `.env.example` for all required environment variables.

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

Please report any security issues to security@yourdomain.com instead of the public issue tracker.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Bun](https://bun.sh)
- Web framework [Elysia.js](https://elysiajs.com)
- Database ORM [Prisma](https://prisma.io)
- Authentication patterns inspired by industry best practices
