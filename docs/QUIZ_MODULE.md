# Omnora Student AI
## Quiz Module

### Overview
- Purpose
- Daily Quiz System
- Supported Classes
- Supported Subjects

### Features
- Daily Quiz
- 20 Questions Per Day
- Session Recovery
- Resume Quiz
- Auto Save
- Random Question Selection
- Leaderboard
- Anti-Repetition
- Offline Fallback

### Architecture

UI (quizzes.js)
        │
        ▼
QuizEngine
        │
        ▼
QuestionProvider
        ├── PostgreSQL
        └── question-bank.js

### Folder Structure

js/
├── quizzes.js
├── quiz-engine.js
├── omnora-supabase.js
└── question-bank.js

### Quiz Flow

Student Login
      │
      ▼
Load Profile
      │
      ▼
Check Eligibility
      │
      ▼
Create Quiz Attempt
      │
      ▼
Load Questions
      │
      ▼
Answer Questions
      │
      ▼
Finish Quiz
      │
      ▼
Update Profile
      │
      ▼
Leaderboard

### Question Sources

Primary
- PostgreSQL

Fallback
- question-bank.js

### Random Selection Strategy

- Database returns 20 daily questions.
- Questions already answered are excluded.
- Local fallback filters by student's class.
- If no class questions exist, select 20 random questions from the local bank.

### Business Rules

- One quiz per day.
- 20 questions only.
- Resume interrupted quiz.
- No repeated questions.
- Store quiz history.
- Update leaderboard automatically.

### Future Features

- AI Question Generator
- Teacher Question Review
- WAEC/NECO/JAMB Mode
- Adaptive Difficulty
- Analytics Dashboard

### Development Principles

- Never sacrifice architecture for speed.
- Separation of concerns.
- QuizEngine contains business logic only.
- UI never talks directly to database.
- QuestionProvider is the only source of quiz questions.
- One logical change per commit.
