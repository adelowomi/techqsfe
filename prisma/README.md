# Database Seeding and Development Utilities

This directory contains utilities for seeding the database with sample data and managing development/testing environments.

## Files

- `seed.ts` - Main seeding script with comprehensive sample data
- `dev-utils.ts` - Development utilities for database management
- `../scripts/db-manager.ts` - CLI interface for database operations

## Quick Start

### Full Database Seed
```bash
pnpm db:seed
```

This creates:
- 3 sample users (admin, host, producer) with password "password123"
- 2 seasons with technology questions
- Sample contestant attempts for analytics testing

### Quick Test Setup
```bash
pnpm db:manage test-setup
```

Creates a minimal test environment with test users and a small dataset.

## Available Commands

### Database Management
```bash
# Run full seed with sample data
pnpm db:seed

# Reset entire database (delete all data)
pnpm db:reset

# Show database statistics
pnpm db:manage stats

# Complete database manager help
pnpm db:manage help
```

### Development Utilities
```bash
# Create test environment
pnpm db:manage test-setup

# Create individual test user
pnpm db:manage test-user email@example.com "User Name" HOST

# Create test season
pnpm db:manage test-season <userId> "Season Name"

# Populate season with cards
pnpm db:manage populate <seasonId> 15

# Create sample attempts
pnpm db:manage sample-attempts <seasonId> <userId> 25
```

## Sample Data Structure

### Users
- **admin@techqs.com** (ADMIN) - Full system access
- **host@techqs.com** (HOST) - Can manage games and record attempts  
- **producer@techqs.com** (PRODUCER) - Can manage content and view analytics

### Seasons
- **Season 1** - Full deck with 45 cards (15 per difficulty)
- **Season 2** - Partial deck with 15 cards (5 per difficulty)

### Questions by Difficulty

**EASY**: Basic technology concepts
- HTML, CSS, JavaScript fundamentals
- Common acronyms and definitions
- Basic web development concepts

**MEDIUM**: Intermediate programming topics
- Algorithms and data structures
- Framework-specific knowledge
- System design basics

**HARD**: Advanced computer science topics
- Distributed systems concepts
- Advanced algorithms
- System architecture patterns

### Sample Attempts
- 30 contestant attempts with realistic success rates
- Distributed across different difficulty levels
- Includes various contestant names for analytics testing

## Development Workflow

### Setting up for Development
1. Reset database: `pnpm db:reset`
2. Run migrations: `pnpm db:generate`
3. Seed with sample data: `pnpm db:seed`

### Testing Specific Features
1. Create test environment: `pnpm db:manage test-setup`
2. Add specific test data as needed
3. Use `pnpm db:manage stats` to verify data

### Resetting for Clean State
```bash
pnpm db:reset
pnpm db:generate
pnpm db:seed
```

## Customizing Sample Data

### Adding More Questions
Edit the `sampleQuestions` object in `seed.ts` to add more questions for each difficulty level.

### Modifying User Roles
Update the user creation section in `seed.ts` to change default roles or add more users.

### Adjusting Sample Size
Modify the loops in `createSeasonsWithCards()` to change the number of cards per season or difficulty level.

## Troubleshooting

### Permission Errors
Ensure your database user has CREATE, DROP, and INSERT permissions.

### Connection Issues
Verify your `DATABASE_URL` in `.env` is correct and the database server is running.

### TypeScript Errors
Make sure all dependencies are installed:
```bash
pnpm install
```

### Seed Script Fails
Check that your database schema is up to date:
```bash
pnpm db:generate
```

## Integration with Testing

The seeding utilities are designed to work with the testing framework:

```typescript
// In test files
import { resetDatabase, createTestUser, createTestSeason } from "../prisma/dev-utils";

beforeEach(async () => {
  await resetDatabase();
  const user = await createTestUser("test@example.com", "Test User");
  const season = await createTestSeason(user.id);
  // ... test setup
});
```

This ensures each test runs with a clean, predictable dataset.