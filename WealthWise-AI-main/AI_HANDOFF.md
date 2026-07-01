# AI_HANDOFF.md

# WealthWise AI
## Project Context & Engineering Handoff

Last Updated June 2026

---

# Project Overview

WealthWise AI is an AI-powered personal finance platform that helps users analyze their financial health, manage portfolios, gain AI-driven financial insights, and process bank statements.

The goal is to build a production-quality SaaS application using modern backend engineering practices.

This repository is intended to be portfolio quality and deployment ready.

---

# High Level Architecture

Browser
↓
React Frontend
↓
FastAPI Backend
↓
SQLAlchemy ORM
↓
PostgreSQL

Additional Services

- Gemini AI
- OCR Processing
- Redis (planned)
- Docker
- GitHub Actions
- AWS Deployment (future)

---

# Tech Stack

## Backend

- Python 3.11
- FastAPI
- SQLAlchemy 2.x
- Alembic
- PostgreSQL
- Pydantic v2
- JWT Authentication
- Passlib
- python-jose
- Uvicorn

## AI

- Google Gemini API
- OCR Client

## Testing

- pytest
- pytest-asyncio
- coverage

## Code Quality

- Black
- isort
- Flake8
- mypy

## DevOps

- Docker
- Docker Compose
- GitHub Actions

---

# Folder Structure

backend

app

api

v1

admin_routes.py

auth_routes.py

portfolio_routes.py

statement_routes.py

health_score_routes.py

risk_profile_routes.py

transaction_routes.py

ai_coach_routes.py

router.py

clients

gemini_client.py

ocr_client.py

core

config.py

dependencies.py

logger.py

security.py

database

base.py

session.py

models

repositories

schemas

services

middleware

tests

unit

integration

---

# Implemented Features

## Authentication

Completed

- User Registration
- User Login
- JWT Authentication
- Password Hashing
- Protected Routes

---

## Portfolio Module

Completed

Supports

- Portfolio CRUD
- Portfolio Analysis

---

## Health Score Module

Completed

Supports

- Financial Health Score
- Score API
- Health Schema
- Health Service

---

## Risk Profile Module

Completed

Supports

- Risk Assessment
- Risk Enum
- API Endpoints

---

## Statement Processing

Completed

Supports

- Statement Upload
- OCR Processing
- Transaction Extraction

---

## Analytics

Completed

Supports

- Financial Analytics
- Repository Layer
- Service Layer

---

## AI Coach

Completed

Supports

- Gemini Integration
- Personalized Financial Advice

---

# Backend Architecture

The backend follows a layered architecture.

Request

↓

API Routes

↓

Services

↓

Repositories

↓

Database

Routes never directly access the database.

Business logic lives inside Services.

Database operations live inside Repositories.

---

# ORM

Uses SQLAlchemy 2.x Async ORM.

Database sessions are injected using dependency injection.

Alembic manages migrations.

---

# Configuration

Uses

Pydantic Settings

Configuration is loaded from

.env

or

.env.test

depending on execution environment.

---

# Environment Files

Production

.env

Development

.env.example

Testing

.env.test

---

# Authentication

JWT

Access Token

Refresh Token

Password Hashing

bcrypt

---

# Database

Primary Database

PostgreSQL

Testing Database

SQLite (aiosqlite)

SQLite is used only for unit testing.

The session layer automatically configures

StaticPool

for SQLite.

Production continues to use connection pooling.

---

# CICD

GitHub Actions

Current Jobs

Backend CI

Includes

Black

isort

Flake8

mypy

Unit Tests

Integration Tests

Docker Build

Security Scan

---

# Completed CI Fixes

Resolved

✓ boto3  aiobotocore dependency conflict

✓ Python version mismatch

Python 3.13

↓

Python 3.11

✓ Black formatting

✓ isort formatting

✓ flake8 configuration

✓ requirements-dev

✓ email-validator dependency

✓ PYTHONPATH configuration

✓ SQLite engine configuration

✓ test environment loading

✓ .env.test support

---

# Current Remaining Issue

Integration Tests

Current GitHub Actions Status

Black

PASS

isort

PASS

flake8

PASS

mypy

PASS

Security Scan

PASS

Unit Tests

PASS

Docker Build

PASS

Integration Tests

FAIL

Reason

pytest executes

testsintegration

but all integration tests are skipped or deselected.

GitHub Actions currently returns

Exit Code 5

because pytest treats

No tests collected

as an error.

This is NOT an application bug.

It is purely a CI configuration issue.

Expected fix

Either

- add actual integration tests

OR

- modify CI so zero collected integration tests are allowed.

---

# Coding Standards

Always

Use

Black

before committing.

Run

isort

before committing.

Run

flake8

before committing.

Never bypass CI.

Never disable tests simply to make CI green.

---

# Git Strategy

Main branch

main

Commit style

feat

fix

refactor

docs

style

test

ci

chore

---

# Development Workflow

Before every push

Run

black app tests

Run

isort app tests

Run

flake8 app tests

Run

pytest

Commit

Push

Wait for GitHub Actions.

---

# Future Roadmap

Backend

Redis Caching

Celery Background Tasks

Rate Limiting

AWS S3 Integration

Email Verification

Password Reset

Notifications

Role Based Authorization

Admin Dashboard

Production Logging

API Versioning

---

Frontend

Dashboard

Authentication

Portfolio

Analytics

AI Coach

Responsive UI

Charts

Dark Mode

---

Cloud

Docker

AWS ECS

AWS RDS

AWS S3

AWS CloudFront

GitHub Actions

Terraform

Monitoring

CloudWatch

---

Deployment Goal

Production deployment on AWS.

---

# Notes for Future AI Conversations

This document is the primary source of truth.

Always read this document completely before making architectural decisions.

Do not suggest restructuring the project unless necessary.

Preserve

Layered Architecture

Repository Pattern

Service Layer

Async SQLAlchemy

FastAPI

Pydantic v2

Docker

GitHub Actions

Follow existing coding conventions.

Never remove production functionality solely to satisfy CI.

Fix root causes rather than masking issues.

---

# Current Project State

Backend Progress

≈90%

Frontend Progress

≈10%

CICD Progress

≈95%

Deployment

Pending

---

# Immediate Next Task

Fix the GitHub Actions Integration Test workflow.

Current issue

pytest reports

3 deselected  0 selected

which exits with code 5.

Goal

Modify the Integration Test workflow so it succeeds when no integration tests exist, while still failing on actual test failures.

After CI is fully green, continue frontend development.

---

End of Document