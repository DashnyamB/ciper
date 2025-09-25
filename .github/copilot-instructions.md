# Ciper - Authentication & Authorization Service

## Project Overview

Ciper is a modern authentication and authorization service built with Bun, Elysia.js, and TypeScript. The project implements JWT-based authentication, role-based access control (RBAC), and API key management.

## Key Architecture Components

### Core Services

- **Authentication Service** (`src/routes/auth.ts`): Handles user authentication, JWT token management
- **User Management** (`src/routes/user.ts`): User profile and role assignment
- **Role Management** (`src/routes/role.ts`): RBAC implementation
- **API Key Management** (`src/routes/api-key.ts`): API key generation and validation

### Data Layer

- **Database**: PostgreSQL with Prisma ORM
- **Cache/Session**: Redis for token blacklisting and session management
- **Schema**: See `prisma/schema.prisma` for data models

### Security Layer

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Rate limiting
- API key authentication

## Development Workflow

### Environment Setup

1. Required services:

   ```
   - PostgreSQL
   - Redis
   - Bun runtime
   ```

2. Environment variables (`.env`):
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/cipher_auth"
   REDIS_URL="redis://localhost:6379"
   JWT_SECRET="your-secret"
   ACCESS_TOKEN_EXPIRY="15m"
   ```

### Common Commands

```bash
# Development
bun run dev           # Start dev server with hot reload
bun run build         # Build for production
bun run format:fix    # Fix code formatting

# Database
bunx prisma generate  # Generate Prisma client
bunx prisma db push   # Push schema changes to database
```

## Project Patterns

### Authentication Flow

1. User signs in via `/auth/signin`
2. JWT token issued and stored in Redis
3. Token validated via `authProtect` guard
4. Token blacklisting on `/auth/logout`

### Authorization Pattern

```typescript
// Guard example from src/guards/admin-guard.ts
.guard({
  beforeHandle: async ({ bearer, store, jwt }) => {
    await adminGuard({ token: bearer, store, jwt });
  },
})
```

### Error Handling

Use the `AppError` class hierarchy from `src/utils/errors.ts`:

```typescript
throw new AuthenticationError('Authentication failed');
throw new AuthorizationError('Permission denied');
throw new NotFoundError('Resource');
```

### Route Structure

Routes follow this pattern:

```typescript
const routeName = new Elysia({ prefix: '/prefix' })
  .use(middleware)
  .guard(authGuard)
  .post('/endpoint', handler, {
    body: schema,
    detail: { tags: ['tag'], summary: 'description' },
  });
```

## Integration Points

### External Services

- PostgreSQL: Database connection via Prisma
- Redis: Session management, token blacklisting
- Static file serving: Admin UI at `/admin`

### API Documentation

- OpenAPI/Swagger documentation available at `/swagger`
- API versioning through URL prefixes

## Key Files

- `src/index.ts`: Application entry point and middleware setup
- `src/lib/db.ts`: Database initialization and super admin setup
- `src/guards/*`: Authentication and authorization guards
- `prisma/schema.prisma`: Database schema definition

## Docker Support

- Multi-stage build process in `Dockerfile`
- Container orchestration via `docker-compose.yml`
- Environment variables injected through Docker Compose

## Critical Workflows

1. User authentication flow:
   ```
   signup → JWT issued → protected routes → logout → token blacklisted
   ```
2. Role management:
   ```
   create role → assign permissions → assign to user → verify in guards
   ```
3. API key flow:
   ```
   generate key → assign to user → validate in requests
   ```
