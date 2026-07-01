# WealthWise AI
# PROJECT_RULES.md

Version: 1.0

---

# Purpose

This document defines the permanent engineering rules for the WealthWise AI project.

Every AI assistant (Cursor, ChatGPT, Claude, Copilot, etc.) MUST read this file before making any code changes.

These rules are permanent unless explicitly changed.

The objective is to build a production-quality, portfolio-worthy application using industry-standard software engineering practices.

---

# Golden Rule

Do NOT optimize for "making the error disappear."

Always optimize for:

- Correctness
- Maintainability
- Scalability
- Readability
- Production readiness

Never introduce hacks just to make CI pass.

Always fix the root cause.

---

# Project Philosophy

This project is intended to demonstrate professional backend engineering.

Code should look like it belongs in a real software company.

Every architectural decision should improve long-term maintainability.

---

# Architecture

Always preserve the existing layered architecture.

```
Client
    ↓
FastAPI Routes
    ↓
Service Layer
    ↓
Repository Layer
    ↓
SQLAlchemy
    ↓
Database
```

Never bypass layers.

---

# Route Layer Rules

Routes are responsible ONLY for:

- Receiving HTTP requests
- Validating request data
- Calling services
- Returning HTTP responses

Routes MUST NOT contain:

- SQL
- Database logic
- AI prompt construction
- OCR logic
- Business calculations

Routes should remain thin.

---

# Service Layer Rules

Business logic belongs ONLY here.

Examples include:

- Financial calculations
- Health score generation
- Portfolio analysis
- Risk calculations
- AI prompt construction
- Authorization logic
- Validation logic

Services may call:

- Repositories
- AI clients
- External APIs

Services should NOT contain SQL queries.

---

# Repository Layer Rules

Repositories interact ONLY with the database.

Repositories should contain:

- CRUD operations
- Query building
- Database transactions

Repositories must NOT contain:

- Business logic
- HTTP logic
- AI logic
- Authentication logic

---

# Database Rules

Use SQLAlchemy Async ORM.

Prefer ORM queries.

Avoid raw SQL unless necessary.

Database sessions must always come from dependency injection.

Never create sessions manually inside routes.

Alembic manages schema changes.

Never edit production schema manually.

---

# Configuration Rules

All configuration belongs inside:

app/core/config.py

Never hardcode:

- API keys
- Passwords
- Secrets
- Database URLs
- JWT secrets
- AWS credentials

Always use Pydantic Settings.

---

# Environment Rules

Allowed files:

.env

.env.example

.env.test

Only dummy values may be committed.

Never commit:

- Production passwords
- Real API keys
- Real JWT secrets
- AWS credentials

---

# Authentication Rules

Always use JWT.

Passwords must always be hashed.

Never expose password hashes.

Never log tokens.

Never return sensitive information.

---

# AI Rules

Gemini integration must remain isolated.

Only services should communicate with Gemini.

Routes should never directly call Gemini.

Prompt construction belongs inside services.

---

# OCR Rules

OCR logic remains isolated inside clients.

OCR code should never leak into routes.

---

# Dependency Injection

Use FastAPI dependency injection everywhere.

Dependencies include:

- Database sessions
- Current user
- Authentication
- Configuration

Never instantiate dependencies manually inside routes.

---

# Error Handling

Use custom exceptions.

Never expose Python tracebacks to API users.

Return proper HTTP status codes.

Centralize error handling whenever possible.

---

# Logging

Never use print().

Always use the centralized logger.

Never log:

- Passwords
- Tokens
- Secrets
- API keys

---

# Testing Rules

Every feature should eventually have:

- Unit Tests
- Integration Tests

Do not remove tests to make CI pass.

Fix the underlying issue.

---

# Code Formatting

Before every commit run:

```bash
black app tests
isort app tests
flake8 app tests
pytest
```

Code should already be formatted before committing.

---

# Type Hints

Use type hints everywhere practical.

Avoid Any unless absolutely necessary.

Use Optional correctly.

Prefer explicit return types.

---

# Pydantic

Use Pydantic v2.

Use BaseModel for schemas.

Separate:

- Request schemas
- Response schemas

Never expose ORM models directly.

---

# API Design

Use REST principles.

Consistent endpoints.

Proper status codes.

Consistent JSON responses.

No breaking API changes without reason.

---

# Database Models

Keep models focused.

Relationships should be clear.

Avoid circular imports.

Use SQLAlchemy 2.x style.

---

# Git Rules

Commit often.

Keep commits small.

Use conventional commit messages.

Examples:

feat:

fix:

refactor:

style:

docs:

test:

ci:

chore:

Never commit broken code.

---

# GitHub Actions

CI must remain green.

Never disable checks.

Never bypass CI.

Fix failures properly.

---

# Docker

Docker images should be reproducible.

Avoid hardcoded paths.

Avoid hardcoded ports.

Use environment variables.

---

# Security

Never trust user input.

Always validate input.

Hash passwords.

Sanitize uploaded files.

Protect secrets.

Never expose internal stack traces.

---

# Performance

Avoid unnecessary database queries.

Avoid N+1 queries.

Use pagination where appropriate.

Cache only when needed.

Optimize only after measuring.

---

# Documentation

Every major feature should include:

- Clear comments where necessary
- Docstrings
- README updates if behavior changes

Do not over-comment obvious code.

---

# CI/CD Principles

Local development should closely match CI.

If something passes locally but fails in CI:

1. Find the environmental difference.
2. Fix the root cause.
3. Do not add hacks specific to GitHub Actions unless absolutely required.

---

# AI Assistant Instructions

When making changes:

1. Understand the existing architecture first.
2. Modify the minimum necessary code.
3. Preserve existing behavior unless a bug is being fixed.
4. Explain why each change is necessary.
5. Avoid introducing unnecessary dependencies.
6. Keep code clean and production-ready.

Never perform large refactors unless explicitly requested.

---

# Before Every Commit

Ensure:

✓ Code builds

✓ Tests pass

✓ Black passes

✓ isort passes

✓ flake8 passes

✓ mypy passes

✓ GitHub Actions should be expected to pass

---

# Current Project Status (June 2026)

Backend:
~90% complete

Frontend:
~10% complete

CI:
Almost complete

Deployment:
Pending

Remaining major work:

- Finish Integration Test workflow
- Complete frontend
- AWS deployment
- Production monitoring
- Documentation

---

# Long-Term Vision

WealthWise AI should become a professional-grade AI-powered personal finance platform demonstrating:

- Clean Architecture
- FastAPI best practices
- SQLAlchemy Async
- Repository Pattern
- Service Layer
- Docker
- GitHub Actions
- AWS deployment
- AI integration
- Production-ready engineering

Every change should move the project closer to that goal.