# Contributing to s8vr

Thank you for your interest in contributing to s8vr! This document provides guidelines and instructions for contributing.

## Getting Started

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/s8vr.git
   cd s8vr
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/s8vr.git
   ```

### Set Up Development Environment

1. Install dependencies:
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

2. Copy environment files:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```

3. Fill in your environment variables (see README.md for details)

4. Start the development servers:
   ```bash
   # Terminal 1 - Frontend
   npm run dev

   # Terminal 2 - Backend
   cd backend && npm run dev
   ```

## Branch Naming Convention

Use the following prefixes for your branches:

- `feature/` - New features or enhancements
  - Example: `feature/add-pdf-export`
  - Example: `feature/improve-invoice-templates`

- `fix/` - Bug fixes
  - Example: `fix/payment-webhook-timeout`
  - Example: `fix/email-validation`

- `chore/` - Maintenance tasks, refactoring, dependencies
  - Example: `chore/update-dependencies`
  - Example: `chore/refactor-auth-logic`

## Making Changes

1. Create a new branch from `main`:
   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the code style of the project

3. Test your changes locally

4. Commit your changes with clear, descriptive messages:
   ```bash
   git commit -m "Add PDF export functionality for invoices"
   ```

## Pull Request Process

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Open a Pull Request against the `main` branch

3. Fill out the PR template with:
   - A clear description of what the PR does
   - Any related issue numbers
   - Screenshots for UI changes
   - Testing steps

4. Wait for review and address any feedback

## Code Style Guidelines

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Keep components small and focused
- Use meaningful variable and function names
- Add comments for complex logic

## Reporting Issues

When reporting issues, please include:

- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser/environment information
- Screenshots if applicable

## Questions?

Feel free to open an issue for any questions about contributing.
