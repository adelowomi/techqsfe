import { PrismaClient, Difficulty, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Reset the entire database by deleting all data
 */
export async function resetDatabase() {
  console.log("🗑️  Resetting database...");
  
  try {
    // Delete in order to respect foreign key constraints
    await prisma.attempt.deleteMany();
    await prisma.card.deleteMany();
    await prisma.season.deleteMany();
    await prisma.post.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.user.deleteMany();
    
    console.log("✅ Database reset completed");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    throw error;
  }
}

/**
 * Create a quick test season with minimal data
 */
export async function createTestSeason(userId: string, seasonName: string = "Test Season") {
  console.log(`🧪 Creating test season: ${seasonName}`);
  
  const season = await prisma.season.create({
    data: {
      name: seasonName,
      description: `Test season created at ${new Date().toISOString()}`,
      createdById: userId,
    },
  });
  
  // Add a few test cards for each difficulty
  const testQuestions = {
    EASY: { question: "What is 2+2?", answer: "4" },
    MEDIUM: { question: "What is the capital of France?", answer: "Paris" },
    HARD: { question: "What is the meaning of life?", answer: "42" }
  };
  
  const cards = [];
  for (const [difficulty, qa] of Object.entries(testQuestions)) {
    for (let i = 1; i <= 3; i++) {
      cards.push({
        cardNumber: i,
        question: `${qa.question} (Card ${i})`,
        correctAnswer: qa.answer,
        difficulty: difficulty as Difficulty,
        seasonId: season.id,
      });
    }
  }
  
  await prisma.card.createMany({ data: cards });
  
  console.log(`✅ Created test season with ${cards.length} cards`);
  return season;
}

/**
 * Create a test user with specified role
 */
export async function createTestUser(
  email: string, 
  name: string, 
  role: Role = Role.HOST,
  password: string = "testpass123"
) {
  console.log(`👤 Creating test user: ${email}`);
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { role, name },
    create: {
      email,
      name,
      password: hashedPassword,
      role,
    },
  });
  
  console.log(`✅ Created/updated test user: ${email} (${role})`);
  return user;
}

/**
 * Populate a season with random cards up to the specified count per difficulty
 */
export async function populateSeasonCards(
  seasonId: string, 
  cardsPerDifficulty: number = 10
) {
  console.log(`📚 Populating season ${seasonId} with ${cardsPerDifficulty} cards per difficulty`);
  
  const sampleQuestions = {
    EASY: [
      "What does HTML stand for?",
      "What is JavaScript?", 
      "What does CSS do?",
      "What is Git?",
      "What is an API?"
    ],
    MEDIUM: [
      "What is the time complexity of binary search?",
      "Explain React hooks",
      "What is a closure?",
      "What is Docker?",
      "What is middleware?"
    ],
    HARD: [
      "Explain the CAP theorem",
      "What is eventual consistency?",
      "What is the actor model?",
      "Explain consensus algorithms",
      "What is idempotency?"
    ]
  };
  
  const cards = [];
  
  for (const difficulty of Object.values(Difficulty)) {
    const questions = sampleQuestions[difficulty];
    
    for (let i = 1; i <= cardsPerDifficulty; i++) {
      const questionIndex = (i - 1) % questions.length;
      const baseQuestion = questions[questionIndex];
      
      cards.push({
        cardNumber: i,
        question: `${baseQuestion} (Card ${i})`,
        correctAnswer: `Sample answer for ${baseQuestion}`,
        difficulty,
        seasonId,
      });
    }
  }
  
  await prisma.card.createMany({ data: cards });
  console.log(`✅ Added ${cards.length} cards to season`);
}

/**
 * Create sample attempts for testing analytics
 */
export async function createSampleAttempts(
  seasonId: string, 
  recordedById: string, 
  attemptCount: number = 20
) {
  console.log(`🎯 Creating ${attemptCount} sample attempts for season ${seasonId}`);
  
  const cards = await prisma.card.findMany({
    where: { seasonId },
    take: 20,
  });
  
  if (cards.length === 0) {
    throw new Error("No cards found in season to create attempts for");
  }
  
  const contestantNames = [
    "Test User A", "Test User B", "Test User C", 
    "Test User D", "Test User E"
  ];
  
  const attempts = [];
  
  for (let i = 0; i < attemptCount; i++) {
    const card = cards[Math.floor(Math.random() * cards.length)];
    const contestantName = contestantNames[Math.floor(Math.random() * contestantNames.length)];
    const isCorrect = Math.random() > 0.4; // 60% success rate
    
    if (!card) {
      throw new Error("Failed to select a card for attempt creation");
    }
    
    if (!contestantName) {
      throw new Error("Failed to select a contestant name for attempt creation");
    }
    
    attempts.push({
      contestantName,
      givenAnswer: isCorrect ? card.correctAnswer : "Wrong answer",
      isCorrect,
      cardId: card.id,
      seasonId,
      recordedById,
      attemptedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random time in last 24 hours
    });
  }
  
  await prisma.attempt.createMany({ data: attempts });
  console.log(`✅ Created ${attempts.length} sample attempts`);
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  console.log("📊 Gathering database statistics...");
  
  const stats = {
    users: await prisma.user.count(),
    seasons: await prisma.season.count(),
    cards: await prisma.card.count(),
    attempts: await prisma.attempt.count(),
    cardsByDifficulty: {
      EASY: await prisma.card.count({ where: { difficulty: Difficulty.EASY } }),
      MEDIUM: await prisma.card.count({ where: { difficulty: Difficulty.MEDIUM } }),
      HARD: await prisma.card.count({ where: { difficulty: Difficulty.HARD } }),
    },
    usersByRole: {
      HOST: await prisma.user.count({ where: { role: Role.HOST } }),
      PRODUCER: await prisma.user.count({ where: { role: Role.PRODUCER } }),
      ADMIN: await prisma.user.count({ where: { role: Role.ADMIN } }),
    }
  };
  
  console.log("Database Statistics:");
  console.log(`- Users: ${stats.users} (HOST: ${stats.usersByRole.HOST}, PRODUCER: ${stats.usersByRole.PRODUCER}, ADMIN: ${stats.usersByRole.ADMIN})`);
  console.log(`- Seasons: ${stats.seasons}`);
  console.log(`- Cards: ${stats.cards} (EASY: ${stats.cardsByDifficulty.EASY}, MEDIUM: ${stats.cardsByDifficulty.MEDIUM}, HARD: ${stats.cardsByDifficulty.HARD})`);
  console.log(`- Attempts: ${stats.attempts}`);
  
  return stats;
}

// CLI interface when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  async function runCommand() {
    try {
      switch (command) {
        case "reset":
          await resetDatabase();
          break;
          
        case "stats":
          await getDatabaseStats();
          break;
          
        case "test-season":
          const email = process.argv[3] || "test@example.com";
          const user = await createTestUser(email, "Test User");
          await createTestSeason(user.id);
          break;
          
        case "populate":
          const seasonId = process.argv[3];
          const count = parseInt(process.argv[4] || "10") || 10;
          if (!seasonId) {
            console.error("Usage: pnpm dev-utils populate <seasonId> [cardsPerDifficulty]");
            process.exit(1);
          }
          await populateSeasonCards(seasonId, count);
          break;
          
        default:
          console.log("Available commands:");
          console.log("- reset: Reset entire database");
          console.log("- stats: Show database statistics");
          console.log("- test-season [email]: Create test user and season");
          console.log("- populate <seasonId> [count]: Populate season with cards");
          break;
      }
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  }
  
  runCommand();
}