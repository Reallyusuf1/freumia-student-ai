# PROJECT_ARCHITECTURE.md

# Freumia Student AI

Version: 2.0

Maintained by: Omnora Labs

---

## Vision

Freumia Student AI is an AI-powered learning platform built for African students with a modular, scalable, and production-ready architecture.

---

## Core Principles

- One responsibility per file.
- Modular architecture.
- Mobile-first development.
- Reusable components.
- Documentation before implementation.
- One feature = One commit.

---

## Folder Structure

/
├── docs/
├── css/
├── js/
├── pages/
├── assets/
├── api/

---

## Development Workflow

Architecture

↓

Documentation

↓

HTML

↓

JavaScript

↓

CSS

↓

Testing

↓

Preview

↓

Production

---

## Architecture Rules

- Navigation logic belongs only in navigation.js.
- Quiz logic belongs only in quiz.js.
- AI logic belongs only in ai.js.
- Authentication belongs only in auth.js.
- Shared functions belong only in utils.js.
- Never mix unrelated logic in one file.

---

## Long-Term Goal

Build a scalable AI learning platform that can evolve from LocalStorage to Supabase and PostgreSQL without major architectural changes.
