# Implementation Plan

- [x] 1. Extend database schema with card deck models
  - Update Prisma schema to add Season, Card, Attempt models and Difficulty/Role enums
  - Add foreign key relationships between existing User model and new models
  - Generate and run database migration to create new tables
  - _Requirements: 1.1, 2.1, 4.1, 6.2_

- [x] 2. Create core data validation schemas
  - Write Zod schemas for Season, Card, and Attempt input validation
  - Create TypeScript interfaces for API responses and component props
  - Implement validation helpers for card numbers (1-52) and difficulty levels
  - _Requirements: 2.1, 2.2, 4.1_

- [x] 3. Implement Season management service layer
  - Create season service functions for CRUD operations
  - Write functions to create seasons with empty deck initialization
  - Implement season statistics calculation (card counts, attempt counts)
  - Add unit tests for season service functions
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 4. Build Card management service layer
  - Create card service functions for adding questions to specific deck positions
  - Implement card drawing logic with random selection from unused cards
  - Write functions to update card usage counts and last used timestamps
  - Add validation to prevent exceeding 52 cards per difficulty deck
  - Add unit tests for card service functions
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2_

- [x] 5. Create Game service for contestant attempts
  - Implement attempt recording service with contestant name and answer validation
  - Write functions to calculate correct/incorrect results and update statistics
  - Create deck reset functionality for reshuffling used cards
  - Add unit tests for game service functions
  - _Requirements: 3.3, 4.1, 4.2, 3.4_

- [x] 6. Build Analytics service layer
  - Create functions to calculate card usage statistics and success rates
  - Implement contestant performance analytics by difficulty level
  - Write season comparison analytics functions
  - Add functions for data export capabilities
  - Add unit tests for analytics calculations
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 4.3, 4.4, 4.5_

- [x] 7. Create tRPC routers for API endpoints
  - Build season router with create, read, update, delete procedures
  - Implement card router with deck management and drawing procedures
  - Create game router for attempt recording and deck operations
  - Build analytics router for statistics and reporting endpoints
  - Add proper authentication middleware to all protected procedures
  - _Requirements: 6.1, 6.3, 6.4_

- [x] 8. Extend user authentication with role-based access
  - Update User model to include role field (HOST, PRODUCER, ADMIN)
  - Implement role-based middleware for tRPC procedures
  - Create user role assignment functionality for admins
  - Add role-based UI component rendering logic
  - _Requirements: 6.1, 6.2, 6.5_

- [x] 9. Build Season management UI components
  - Create SeasonList component to display all seasons with statistics
  - Build SeasonForm component for creating and editing seasons
  - Implement SeasonDashboard component showing deck overview and usage stats
  - Add navigation between seasons and deck views
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 10. Create Deck and Card management UI components
  - Build DeckView component with visual card deck representation
  - Create CardEditor component for adding/editing questions and answers
  - Implement CardList component with pagination for large decks
  - Add CardView component to display individual card details and statistics
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x] 11. Implement Game flow UI components
  - Create CardDrawer component for randomly selecting cards during show
  - Build QuestionDisplay component to show drawn questions to contestants
  - Implement ContestantForm for capturing contestant information
  - Create AnswerRecorder component for recording contestant responses and results
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 12. Build Analytics and reporting UI components
  - Create AnalyticsDashboard component with comprehensive statistics overview
  - Implement UsageCharts component for visual card usage patterns
  - Build PerformanceMetrics component showing contestant success rates
  - Add data export functionality with downloadable reports
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 13. Create main navigation and layout updates
  - Update main layout to include navigation to card deck management sections
  - Add role-based navigation menu items based on user permissions
  - Implement breadcrumb navigation for deep-linked pages
  - Create responsive design for mobile and tablet usage during shows
  - _Requirements: 6.2, 6.5_

- [x] 14. Add comprehensive error handling and loading states
  - Implement error boundaries for all major UI sections
  - Add loading states for all async operations (card drawing, data fetching)
  - Create user-friendly error messages for common scenarios (empty decks, network errors)
  - Add optimistic updates for card draws and attempt recording
  - _Requirements: 3.4, 5.5_

- [x] 15. Write integration tests for complete workflows
  - Create tests for complete season creation and card management workflow
  - Write tests for game flow from card drawing to attempt recording
  - Implement tests for analytics data accuracy across different scenarios
  - Add tests for role-based access control and authentication flows
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_

- [x] 16. Add data seeding and development utilities
  - Create database seed script with sample seasons and questions
  - Build development utilities for quickly populating test data
  - Add database reset functionality for development and testing
  - Create sample technology questions for each difficulty level
  - _Requirements: 2.1, 2.2_