# CURSOR_INSTRUCTIONS.md

# WealthWise AI
## Cursor Engineering Instructions

Version: 1.0

---

# Purpose

This document acts as the permanent system prompt for Cursor.

Before making ANY code changes, Cursor MUST read:

1. AI_HANDOFF.md
2. PROJECT_RULES.md
3. CURSOR_INSTRUCTIONS.md

These three documents together define the project.

Never ignore them.

---

# Primary Goal

Do NOT optimize for speed.

Optimize for:

- correctness
- maintainability
- scalability
- production readiness

Every change should improve the project.

Never introduce technical debt.

---

# Before Writing Code

Always follow this workflow.

## Step 1

Understand the request.

Never start coding immediately.

---

## Step 2

Understand the existing architecture.

Read surrounding files.

Read imports.

Understand dependencies.

Never make assumptions.

---

## Step 3

Determine the root cause.

Never fix symptoms.

Never use hacks.

Never patch around problems.

---

## Step 4

Propose the smallest correct solution.

Avoid unnecessary refactoring.

---

## Step 5

Implement.

---

## Step 6

Verify.

Run formatting.

Run linting.

Run tests.

Only then generate git commands.

---

# Root Cause Analysis

Every bug fix must begin with:

Root Cause

Then

Solution

Then

Why this solution is correct.

Never skip this explanation.

---

# Code Modification Rules

Modify only the files necessary.

Avoid unrelated edits.

Do not reformat unrelated code.

Do not rename files unnecessarily.

Do not move folders unless requested.

---

# Architecture Rules

Always preserve:

Layered Architecture

Repository Pattern

Service Layer

Dependency Injection

Async SQLAlchemy

Pydantic v2

FastAPI

Never collapse layers.

Never move business logic into routes.

Never move SQL into services.

Never bypass repositories.

---

# CI/CD Rules

GitHub Actions is the source of truth.

If CI fails:

Read the FIRST failing job.

Ignore downstream failures.

Fix one issue at a time.

Never attempt to fix multiple unrelated failures simultaneously.

---

# Debugging Rules

When debugging:

1. Read the complete stack trace.

2. Identify the first meaningful error.

3. Ignore secondary errors.

4. Explain the root cause.

5. Fix only that issue.

6. Re-run tests.

Never guess.

---

# Dependency Rules

Never randomly upgrade packages.

Never downgrade packages without explanation.

Always check compatibility.

Avoid introducing unnecessary dependencies.

---

# Environment Rules

Never commit:

Real API keys

Real passwords

Real JWT secrets

Real AWS credentials

Real Gemini API keys

Use

.env.example

and

.env.test

for examples.

---

# Testing Rules

Always distinguish:

Unit Tests

Integration Tests

End-to-End Tests

Do not disable tests to make CI pass.

Fix the actual issue.

---

# Formatting Rules

Always run

black app tests

before committing.

Always run

isort app tests

before committing.

Always run

flake8 app tests

before committing.

Always run

pytest

before generating git commands.

---

# Git Rules

Never generate git commands before verifying the project.

Commit messages should follow:

feat:

fix:

refactor:

style:

docs:

test:

ci:

chore:

One commit = one logical change.

---

# Pull Request Philosophy

Each commit should solve ONE problem.

Do not combine unrelated fixes.

Keep history clean.

---

# Security Rules

Never expose:

Secrets

Passwords

JWT

Database credentials

AWS credentials

Never disable security for convenience.

---

# Performance Rules

Avoid unnecessary database queries.

Avoid duplicate work.

Avoid premature optimization.

Optimize only when justified.

---

# Documentation Rules

If architecture changes:

Update

AI_HANDOFF.md

If engineering rules change:

Update

PROJECT_RULES.md

If Cursor workflow changes:

Update

CURSOR_INSTRUCTIONS.md

Documentation should never become outdated.

---

# Code Review Checklist

Before considering a task complete:

✓ Builds successfully

✓ Passes formatting

✓ Passes linting

✓ Passes tests

✓ No dead code

✓ No debug prints

✓ No TODO left behind

✓ No commented-out code

✓ No duplicated logic

---

# When Fixing CI

Always follow this sequence.

1.

Read the first failing job.

2.

Read the first failing step.

3.

Read the first real error.

4.

Ignore everything after that.

5.

Implement the smallest fix.

6.

Push.

7.

Wait for CI.

8.

Repeat if necessary.

Never attempt multiple speculative fixes.

---

# When Asked To Refactor

Before refactoring:

Explain:

Why refactoring is needed.

Benefits.

Potential risks.

Scope.

Only then modify code.

Avoid unnecessary rewrites.

---

# Communication Style

Always explain:

Problem

↓

Root Cause

↓

Solution

↓

Why it works

↓

Potential side effects

Avoid vague statements.

Be precise.

---

# Response Style

Prefer:

Bullet points

Code examples

File paths

Diff explanations

Avoid long paragraphs when explaining technical changes.

---

# Git Command Generation

Only generate git commands AFTER:

Formatting passes.

Lint passes.

Tests pass (or expected failing tests are understood).

Never generate git commands blindly.

---

# Large Changes

For changes affecting:

Authentication

Database

Architecture

Docker

CI/CD

Environment Variables

Alembic

Always explain the impact before editing.

---

# AI Behaviour Rules

Do NOT overengineer.

Do NOT invent requirements.

Do NOT change architecture without approval.

Do NOT rewrite working code.

Do NOT remove functionality.

Do NOT introduce breaking changes.

Prefer incremental improvements.

---

# Context Recovery

When starting a new conversation:

1.

Read

AI_HANDOFF.md

2.

Read

PROJECT_RULES.md

3.

Read

CURSOR_INSTRUCTIONS.md

4.

Summarize your understanding.

5.

Wait for the next instruction.

Never assume context without reading these files.

---

# Long-Term Goal

The final repository should demonstrate:

Senior Backend Engineering

Production-quality FastAPI

Async SQLAlchemy

Repository Pattern

Service Layer

Clean Architecture

Docker

GitHub Actions

AWS Deployment

AI Integration

Testing

Scalable Design

Every contribution should move the project toward that goal.

---

# End of Instructions