# Contributing to SITUNGBA

Thank you for your interest in contributing. This file describes how to report issues, propose changes, and submit code so maintainers can review and merge efficiently.

## Code of Conduct
Be respectful and constructive. Harassment or discriminatory behavior will not be tolerated. Follow common open-source etiquette in discussions and reviews.

## Getting started (local)
Prerequisites: Node.js (LTS), npm, MySQL (or compatible), Git.
1. Fork the repository and clone:
   git clone https://github.com/<your-user>/situngba.git
2. Copy env and install:
   cp .env.example .env
   npm install
3. Prepare database (create DB, update .env), then run migrations/seeds if available.
4. Start dev server:
   npm run dev

Adjust steps to your environment (Laragon, Docker, etc.).

## Workflow & Branching
- Create a branch per change: feat/<short-description>, fix/<short-description>, chore/<short>.
- Reference an issue in the branch name or PR (e.g., feat/#42-add-form-validation).
- Keep PRs small and focused.

## Issues & Pull Requests
- Open an issue to discuss large changes before implementation.
- PR checklist:
  - Link related issue (if any).
  - Provide a short description and rationale.
  - Include steps to reproduce/test.
  - Add screenshots if UI changes.
  - Ensure code lints and builds.

## Commit messages
Use Conventional Commits style:
- feat: add new feature
- fix: bug fix
- docs: documentation only changes
Example:
  feat(form): validate required fields

## Style & Quality
- Follow existing code patterns (Express + EJS, JS/Node style).
- Run linters/formatters (ESLint/Prettier) if configured.
- Add tests for new logic where applicable.

## Testing
Run test scripts if present:
  npm test
If no tests exist, add unit tests for core logic when feasible.

## Security
Do not open public issues for security vulnerabilities. Contact maintainers privately (use repository maintainer contact or the project's security policy).

## License & Contribution Agreement
By submitting a PR you agree that your contribution will be licensed under the repository license. Ensure you have the right to submit the code you contribute.

Thank you for helping improve SITUNGBA. Small, well-documented contributions are highly valued.