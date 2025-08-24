#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";
import { resetDatabase, createTestUser, createTestSeason, populateSeasonCards, createSampleAttempts, getDatabaseStats } from "../prisma/dev-utils";

const prisma = new PrismaClient();

async function showHelp() {
  console.log(`
🎯 TechQ's Database Manager

Usage: pnpm db:manage <command> [options]

Commands:
  seed              Run the full database seed with sample data
  reset             Reset the entire database (delete all data)
  stats             Show current database statistics
  
  test-setup        Quick setup for testing (creates test user + season)
  test-user         Create a test user
  test-season       Create a test season with sample cards
  
  populate          Populate a season with cards
  sample-attempts   Create sample attempts for analytics testing

Examples:
  pnpm db:manage seed
  pnpm db:manage reset
  pnpm db:manage test-setup
  pnpm db:manage populate <seasonId> 15
  pnpm db:manage sample-attempts <seasonId> <userId> 25
`);
}

async function runSeed() {
  console.log("🌱 Running full database seed...");
  
  // Import and run the seed script
  const { spawn } = await import("child_process");
  
  return new Promise((resolve, reject) => {
    const seedProcess = spawn("pnpm", ["exec", "tsx", "prisma/seed.ts"], {
      stdio: "inherit",
      cwd: process.cwd()
    });
    
    seedProcess.on("close", (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Seed process exited with code ${code}`));
      }
    });
  });
}

async function quickTestSetup() {
  console.log("🧪 Setting up quick test environment...");
  
  // Create test users
  const adminUser = await createTestUser("admin@test.com", "Test Admin", "ADMIN");
  const hostUser = await createTestUser("host@test.com", "Test Host", "HOST");
  
  // Create test season (this already creates 3 cards per difficulty)
  const season = await createTestSeason(adminUser.id, "Test Season");
  
  // Create some sample attempts
  await createSampleAttempts(season.id, hostUser.id, 10);
  
  console.log("✅ Test environment ready!");
  console.log("Test users:");
  console.log("- admin@test.com (password: testpass123) - ADMIN");
  console.log("- host@test.com (password: testpass123) - HOST");
  console.log(`Test season: ${season.name} (ID: ${season.id}) with 9 cards`);
}

async function main() {
  const command = process.argv[2];
  
  if (!command || command === "help" || command === "--help" || command === "-h") {
    await showHelp();
    return;
  }
  
  try {
    switch (command) {
      case "seed":
        await runSeed();
        break;
        
      case "reset":
        await resetDatabase();
        console.log("✅ Database reset complete");
        break;
        
      case "stats":
        await getDatabaseStats();
        break;
        
      case "test-setup":
        await quickTestSetup();
        break;
        
      case "test-user":
        const email = process.argv[3] || "test@example.com";
        const name = process.argv[4] || "Test User";
        const role = (process.argv[5] as any) || "HOST";
        await createTestUser(email, name, role);
        break;
        
      case "test-season":
        const userId = process.argv[3];
        const seasonName = process.argv[4] || "Test Season";
        if (!userId) {
          console.error("Usage: pnpm db:manage test-season <userId> [seasonName]");
          process.exit(1);
        }
        await createTestSeason(userId, seasonName);
        break;
        
      case "populate":
        const seasonId = process.argv[3];
        const cardsPerDifficulty = parseInt(process.argv[4] || "10") || 10;
        if (!seasonId) {
          console.error("Usage: pnpm db:manage populate <seasonId> [cardsPerDifficulty]");
          process.exit(1);
        }
        await populateSeasonCards(seasonId, cardsPerDifficulty);
        break;
        
      case "sample-attempts":
        const attemptSeasonId = process.argv[3];
        const recordedById = process.argv[4];
        const attemptCount = parseInt(process.argv[5] || "20") || 20;
        if (!attemptSeasonId || !recordedById) {
          console.error("Usage: pnpm db:manage sample-attempts <seasonId> <userId> [attemptCount]");
          process.exit(1);
        }
        await createSampleAttempts(attemptSeasonId, recordedById, attemptCount);
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        await showHelp();
        process.exit(1);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();