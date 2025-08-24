import { PrismaClient, Difficulty, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Sample technology questions for each difficulty level
const sampleQuestions = {
  EASY: [
    {
      question: "What does HTML stand for?",
      correctAnswer: "HyperText Markup Language"
    },
    {
      question: "Which programming language is known as the 'language of the web'?",
      correctAnswer: "JavaScript"
    },
    {
      question: "What does CSS stand for?",
      correctAnswer: "Cascading Style Sheets"
    },
    {
      question: "What is the most popular version control system?",
      correctAnswer: "Git"
    },
    {
      question: "What does API stand for?",
      correctAnswer: "Application Programming Interface"
    },
    {
      question: "Which company created the React JavaScript library?",
      correctAnswer: "Facebook (Meta)"
    },
    {
      question: "What does SQL stand for?",
      correctAnswer: "Structured Query Language"
    },
    {
      question: "What is the default port for HTTP?",
      correctAnswer: "80"
    },
    {
      question: "What does URL stand for?",
      correctAnswer: "Uniform Resource Locator"
    },
    {
      question: "Which markup language is used for creating web pages?",
      correctAnswer: "HTML"
    }
  ],
  MEDIUM: [
    {
      question: "What is the time complexity of binary search?",
      correctAnswer: "O(log n)"
    },
    {
      question: "In React, what hook is used to manage component state?",
      correctAnswer: "useState"
    },
    {
      question: "What design pattern is commonly used in Redux?",
      correctAnswer: "Flux pattern"
    },
    {
      question: "What is the difference between '==' and '===' in JavaScript?",
      correctAnswer: "== compares values with type coercion, === compares values and types strictly"
    },
    {
      question: "What is a closure in JavaScript?",
      correctAnswer: "A function that has access to variables in its outer scope even after the outer function returns"
    },
    {
      question: "What is the purpose of Docker containers?",
      correctAnswer: "To package applications with their dependencies for consistent deployment across environments"
    },
    {
      question: "What is the CAP theorem in distributed systems?",
      correctAnswer: "Consistency, Availability, and Partition tolerance - you can only guarantee two of the three"
    },
    {
      question: "What is the difference between SQL and NoSQL databases?",
      correctAnswer: "SQL databases are relational with structured schemas, NoSQL databases are non-relational with flexible schemas"
    },
    {
      question: "What is middleware in Express.js?",
      correctAnswer: "Functions that execute during the request-response cycle and can modify request/response objects"
    },
    {
      question: "What is the purpose of a load balancer?",
      correctAnswer: "To distribute incoming network traffic across multiple servers to ensure reliability and performance"
    }
  ],
  HARD: [
    {
      question: "Explain the Byzantine Generals Problem in distributed computing.",
      correctAnswer: "A consensus problem where distributed parties must agree on a strategy while some parties may be unreliable or malicious"
    },
    {
      question: "What is the difference between optimistic and pessimistic locking in databases?",
      correctAnswer: "Optimistic locking assumes conflicts are rare and checks for conflicts before committing, pessimistic locking prevents conflicts by locking resources"
    },
    {
      question: "Explain the concept of eventual consistency in distributed systems.",
      correctAnswer: "A consistency model where the system will become consistent over time if no new updates are made"
    },
    {
      question: "What is the actor model in concurrent programming?",
      correctAnswer: "A computational model where actors are primitive units that can send messages, create new actors, and change their behavior"
    },
    {
      question: "Explain the difference between horizontal and vertical scaling.",
      correctAnswer: "Horizontal scaling adds more machines to the resource pool, vertical scaling adds more power to existing machines"
    },
    {
      question: "What is the purpose of a consensus algorithm like Raft or Paxos?",
      correctAnswer: "To achieve agreement among distributed nodes on a single data value despite failures"
    },
    {
      question: "Explain the concept of idempotency in REST APIs.",
      correctAnswer: "An operation is idempotent if performing it multiple times has the same effect as performing it once"
    },
    {
      question: "What is the difference between synchronous and asynchronous replication?",
      correctAnswer: "Synchronous replication waits for confirmation from replicas before committing, asynchronous replication commits immediately and replicates later"
    },
    {
      question: "Explain the concept of sharding in database systems.",
      correctAnswer: "Partitioning data across multiple database instances to distribute load and improve performance"
    },
    {
      question: "What is the purpose of a circuit breaker pattern in microservices?",
      correctAnswer: "To prevent cascading failures by stopping calls to a failing service and allowing it time to recover"
    }
  ]
};

async function createUsers() {
  console.log("Creating sample users...");
  
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@techqs.com" },
      update: {},
      create: {
        name: "Admin User",
        email: "admin@techqs.com",
        password: hashedPassword,
        role: Role.ADMIN,
      },
    }),
    prisma.user.upsert({
      where: { email: "host@techqs.com" },
      update: {},
      create: {
        name: "Show Host",
        email: "host@techqs.com",
        password: hashedPassword,
        role: Role.HOST,
      },
    }),
    prisma.user.upsert({
      where: { email: "producer@techqs.com" },
      update: {},
      create: {
        name: "Show Producer",
        email: "producer@techqs.com",
        password: hashedPassword,
        role: Role.PRODUCER,
      },
    }),
  ]);
  
  console.log(`Created ${users.length} users`);
  return users;
}

async function createSeasonsWithCards(users: any[]) {
  console.log("Creating sample seasons with cards...");
  
  const adminUser = users.find(u => u.role === Role.ADMIN);
  if (!adminUser) throw new Error("Admin user not found");
  
  // Create Season 1 - Full deck
  const season1 = await prisma.season.create({
    data: {
      name: "Season 1 - Tech Fundamentals",
      description: "First season focusing on basic technology concepts and programming fundamentals",
      createdById: adminUser.id,
    },
  });
  
  // Create Season 2 - Partial deck for testing
  const season2 = await prisma.season.create({
    data: {
      name: "Season 2 - Advanced Topics",
      description: "Second season covering advanced programming concepts and system design",
      createdById: adminUser.id,
    },
  });
  
  // Create cards for Season 1 (full deck)
  const season1Cards = [];
  for (const difficulty of Object.values(Difficulty)) {
    const questions = sampleQuestions[difficulty];
    
    // Create 15 cards per difficulty for Season 1 (45 total)
    for (let i = 0; i < 15; i++) {
      const questionIndex = i % questions.length;
      const question = questions[questionIndex];
      
      if (!question) {
        throw new Error(`Failed to get question at index ${questionIndex} for difficulty ${difficulty}`);
      }
      
      season1Cards.push({
        cardNumber: i + 1,
        question: `${question.question} (Card ${i + 1})`,
        correctAnswer: question.correctAnswer,
        difficulty,
        seasonId: season1.id,
        usageCount: Math.floor(Math.random() * 3), // Random usage count 0-2
        lastUsed: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
      });
    }
  }
  
  // Create cards for Season 2 (partial deck for testing)
  const season2Cards = [];
  for (const difficulty of Object.values(Difficulty)) {
    const questions = sampleQuestions[difficulty];
    
    // Create 5 cards per difficulty for Season 2 (15 total)
    for (let i = 0; i < 5; i++) {
      const questionIndex = i % questions.length;
      const question = questions[questionIndex];
      
      if (!question) {
        throw new Error(`Failed to get question at index ${questionIndex} for difficulty ${difficulty}`);
      }
      
      season2Cards.push({
        cardNumber: i + 1,
        question: question.question,
        correctAnswer: question.correctAnswer,
        difficulty,
        seasonId: season2.id,
        usageCount: 0, // Fresh deck
        lastUsed: null,
      });
    }
  }
  
  // Insert all cards
  await prisma.card.createMany({
    data: [...season1Cards, ...season2Cards],
  });
  
  console.log(`Created ${season1Cards.length + season2Cards.length} cards across 2 seasons`);
  return [season1, season2];
}

async function createSampleAttempts(seasons: any[], users: any[]) {
  console.log("Creating sample contestant attempts...");
  
  const hostUser = users.find(u => u.role === Role.HOST);
  if (!hostUser) throw new Error("Host user not found");
  
  // Get some cards from Season 1 to create attempts for
  const season1Cards = await prisma.card.findMany({
    where: { seasonId: seasons[0].id },
    take: 20, // Get first 20 cards
  });
  
  const contestantNames = [
    "Alice Johnson",
    "Bob Smith", 
    "Charlie Brown",
    "Diana Prince",
    "Eve Wilson",
    "Frank Miller",
    "Grace Lee",
    "Henry Davis"
  ];
  
  const attempts = [];
  
  for (let i = 0; i < 30; i++) {
    const card = season1Cards[Math.floor(Math.random() * season1Cards.length)];
    const contestantName = contestantNames[Math.floor(Math.random() * contestantNames.length)];
    const isCorrect = Math.random() > 0.3; // 70% success rate
    
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
      seasonId: seasons[0].id,
      recordedById: hostUser.id,
      attemptedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
    });
  }
  
  await prisma.attempt.createMany({
    data: attempts,
  });
  
  console.log(`Created ${attempts.length} sample attempts`);
}

async function main() {
  console.log("🌱 Starting database seeding...");
  
  try {
    const users = await createUsers();
    const seasons = await createSeasonsWithCards(users);
    await createSampleAttempts(seasons, users);
    
    console.log("✅ Database seeding completed successfully!");
    console.log("\nSample users created:");
    console.log("- admin@techqs.com (password: password123) - ADMIN role");
    console.log("- host@techqs.com (password: password123) - HOST role");
    console.log("- producer@techqs.com (password: password123) - PRODUCER role");
    console.log("\nSeasons created:");
    console.log("- Season 1: 45 cards (15 per difficulty)");
    console.log("- Season 2: 15 cards (5 per difficulty)");
    console.log("- 30 sample contestant attempts");
    
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });