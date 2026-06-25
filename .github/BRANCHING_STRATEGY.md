# WealthWise AI — Branching Strategy

## Branch Model: GitHub Flow (simplified GitFlow)

```
main ─────────────────────────────────────────────────── [PRODUCTION]
  │
  ├── develop ──────────────────────────────────────────── [STAGING]
  │     │
  │     ├── feature/auth-jwt-refresh
  │     ├── feature/ocr-paddleocr-fallback
  │     ├── feature/frontend-dashboard-charts
  │     ├── fix/transaction-pagination-bug
  │     ├── hotfix/security-token-blacklist
  │     └── chore/update-dependencies
```

---

## Branch Naming Conventions

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New feature development | `feature/ai-coach-streaming` |
| `fix/` | Bug fix for develop branch | `fix/statement-upload-422` |
| `hotfix/` | Urgent fix for production | `hotfix/jwt-expiry-bypass` |
| `chore/` | Maintenance, deps, config | `chore/bump-fastapi-0.116` |
| `docs/` | Documentation only | `docs/api-reference-update` |
| `refactor/` | Code restructuring | `refactor/repository-pattern` |
| `perf/` | Performance improvements | `perf/transaction-query-index` |
| `ci/` | CI/CD pipeline changes | `ci/add-bandit-scan` |

---

## Commit Message Convention (Conventional Commits)

```
<type>(<scope>): <description>

[optional body]

[optional footer: BREAKING CHANGE, Closes #123]
```

### Types
| Type | When to Use |
|------|------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, missing semicolons (no logic change) |
| `refactor` | Code restructuring (no feature change) |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `chore` | Build process, dependencies |
| `ci` | CI/CD changes |
| `build` | Changes to build system |

### Scopes
`backend`, `frontend`, `api`, `auth`, `ocr`, `ai`, `db`, `deploy`, `docs`

### Examples
```
feat(backend): add JWT refresh token rotation
fix(api): return 409 on duplicate email registration
feat(frontend): add spending donut chart on dashboard
chore(backend): upgrade SQLAlchemy to 2.0.37
test(backend): add integration tests for auth routes
docs(api): document all query parameters for /transactions
```

---

## Workflow

### Standard Feature Development
```
1. Branch from: develop
   git checkout develop && git pull
   git checkout -b feature/your-feature-name

2. Develop + commit regularly (small commits)
   git add . && git commit -m "feat(backend): add health score endpoint"

3. Push and open PR to develop
   git push origin feature/your-feature-name
   # Open PR via GitHub UI

4. PR Review:
   - At least 1 reviewer approval required
   - All CI checks must pass
   - No merge conflicts

5. Merge to develop (squash merge recommended)

6. Staging auto-deploys from develop on merge

7. Test on staging

8. When ready, PR from develop → main

9. Production deploys from main (requires approval)
```

### Hotfix Flow (Production Emergency)
```
1. Branch from: main
   git checkout main && git pull
   git checkout -b hotfix/critical-security-fix

2. Fix + test + commit

3. Open PR to BOTH main AND develop

4. After review, merge to main first:
   → Production deploy triggers

5. Merge to develop (to keep branches in sync)
```

---

## Branch Protection Rules

### `main` (Production)
- ✅ Require PR reviews: **2 approvals**
- ✅ Dismiss stale reviews on new commits
- ✅ Require status checks: `lint`, `unit-tests`, `integration-tests`, `docker-build`
- ✅ Require branches to be up to date before merge
- ✅ Restrict who can push: **DevOps/Tech Leads only**
- ✅ Require signed commits
- ❌ No force pushes
- ❌ No branch deletion

### `develop` (Staging)
- ✅ Require PR reviews: **1 approval**
- ✅ Require status checks: `lint`, `unit-tests`
- ✅ Require branches to be up to date
- ❌ No force pushes

### `feature/*`, `fix/*`, `chore/*`
- No protection (developers work freely)
- Delete branch after merge (auto-delete enabled)

---

## Release Process

```
1. Create release branch from develop:
   git checkout -b release/v1.2.0

2. Update version numbers:
   - backend/pyproject.toml: version = "1.2.0"
   - frontend/package.json: "version": "1.2.0"
   - main.py: version="1.2.0"

3. Final QA on release branch

4. PR release → main (production deploy)

5. Tag the release:
   git tag -a v1.2.0 -m "Release 1.2.0"
   git push origin v1.2.0

6. Merge main back to develop
```

---

## GitHub Secrets Required

```
# AWS
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY

# EC2 Access
STAGING_EC2_HOST
STAGING_EC2_SSH_KEY
PROD_EC2_HOST
PROD_EC2_SSH_KEY

# Frontend
FRONTEND_S3_BUCKET
CLOUDFRONT_DISTRIBUTION_ID

# Notifications
SLACK_WEBHOOK_URL

# Code Quality (optional)
CODECOV_TOKEN
```
