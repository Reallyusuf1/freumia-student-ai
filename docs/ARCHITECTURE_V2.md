# ARCHITECTURE_V2.md

# Omnora Student AI
## Architecture V2

Version: 2.0
Status: Design Phase
Author: Omnora Labs
Architecture Principle:
> Never sacrifice architecture for speed.

---

# 1. Overview

Omnora Student AI follows a layered architecture.

Every layer has one responsibility.

```
UI
↓

Controller

↓

Service Layer

↓

RPC Layer

↓

Database
```

No layer may bypass another.

---

# 2. Design Principles

## Principle 1

Single Responsibility.

Every file has one responsibility.

---

## Principle 2

UI never contains business logic.

---

## Principle 3

Business rules belong to Database + RPC.

---

## Principle 4

Service Layer communicates with Supabase.

---

## Principle 5

Controllers never execute SQL.

---

## Principle 6

Database is the Source of Truth.

Never LocalStorage.

Never Browser Session.

Never Frontend Memory.

---

# 3. Folder Architecture

```
js/

auth.js

omnora-supabase.js

quizzes.js

leaderboard.js

dashboard.js

student-profile.js

utils.js
```

Future:

```
quiz-engine.js

quiz-result.js

quiz-timer.js

quiz-ui.js
```

---

# 4. Layer Responsibilities

## UI Layer

Responsibilities

• Render HTML

• Show Cards

• Show Loading

• Show Errors

• Receive User Input

Must NOT

• Call SQL

• Calculate XP

• Check Eligibility

---

## Controller Layer

File

```
quizzes.js
```

Responsibilities

• Authentication Flow

• Page Navigation

• Quiz Flow

• Timer Events

• Button Events

• Rendering

Must NOT

• Execute SQL

• Know Table Names

• Know Enum Values

---

## Service Layer

File

```
omnora-supabase.js
```

Responsibilities

• RPC Wrapper

• Error Handling

• Validation

• Normalize Responses

Must NOT

• Touch DOM

• Render HTML

---

## RPC Layer

Functions

```
can_start_daily()

start_quiz()

get_quiz_questions()

submit_quiz_answer()

finish_quiz()
```

Responsibilities

• Business Logic

• Daily Eligibility

• Quiz State

• XP

• Statistics

• Result Calculation

---

## Database Layer

Tables

```
profiles

quiz_attempts

quiz_questions

quiz_question_history

leaderboard
```

Responsibilities

• Persistent Data

• Source of Truth

---

# 5. Daily Quiz Lifecycle

```
Login

↓

Authentication

↓

Load Profile

↓

can_start_daily()

↓

───────────────
│             │
│ Eligible    │
│             │
───────────────

↓

start_quiz()

↓

get_quiz_questions()

↓

Question Engine

↓

submit_quiz_answer()

↓

finish_quiz()

↓

Update Statistics

↓

Leaderboard

↓

Result Card
```

---

# 6. Daily Quiz Rules

Rule 1

One Daily Quiz per student.

---

Rule 2

Completed quizzes cannot be repeated on the same day.

---

Rule 3

Browser refresh must never reset progress.

---

Rule 4

Closing browser before completion resumes the same quiz.

---

Rule 5

After 12:00 AM

Incomplete quiz

↓

Expired

↓

XP = 0

↓

No Streak Increment

↓

New Daily Quiz Available

---

Rule 6

Eligibility is decided by RPC.

Never by UI.

---

# 7. Explore Mode

Explore Mode

Unlimited Attempts

No XP

No Leaderboard

No Daily Limit

Learning Only

---

# 8. Result Engine

Result Screen displays

• Score

• Percentage

• XP Earned

• Current Streak

• Longest Streak

• Total Quiz Days

• Leaderboard Position

---

# 9. Statistics

profiles

Stores

• Total Quizzes

• Total Points

• Average Score

• Best Score

• Current Streak

• Longest Streak

• Last Quiz Date

---

# 10. Leaderboard

Leaderboard updates only after

finish_quiz()

Never before.

---

# 11. Resume Engine

Browser Closed

↓

Login

↓

Eligibility Check

↓

Resume Existing Quiz

↓

Continue From Remaining Question

---

# 12. Error Handling

Network Error

↓

Retry

RPC Error

↓

Toast Message

Validation Error

↓

Prevent Flow

Unexpected Error

↓

Safe Recovery

---

# 13. Coding Standards

Never duplicate business logic.

Never bypass Service Layer.

Never bypass RPC.

Never hardcode business rules.

Never couple UI with Database.

Always keep responsibilities separated.

---

# 14. Future Architecture

AI Recommendation Engine

Achievement System

School Dashboard

Teacher Dashboard

Analytics

Gamification

Offline Mode

Android App

All future modules must follow Architecture V2.

---

# Final Principle

Architecture First.

Implementation Second.

Never sacrifice architecture for speed.
