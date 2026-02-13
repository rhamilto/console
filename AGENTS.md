# Instructions for large language models and AI coding agents

This is the entry point for AI-assisted development. Read this first and follow links for details.

## Project overview

- **Monorepo:** `frontend/` (React + TypeScript, yarn workspaces), `pkg/` - Go backend code, `cmd/` - Go CLI commands
- **Static plugins:** dependencies listed in `frontend/packages/console-app/package.json`
- **Key Packages:** `@console/dynamic-plugin-sdk` (public API), `@console/shared` (utils), `@console/internal` (core UI/k8s)

## Common commands

```bash
cd frontend && yarn install    # Install frontend dependencies
cd frontend && yarn lint       # ESLint / prettier linting (can specify file path)
cd frontend && yarn test       # Run frontend tests (can specify test path)
cd frontend && yarn build      # Production build
cd frontend && yarn dev-once   # Development build (no watch mode)
cd frontend && yarn i18n       # Update i18n keys
go mod vendor && go mod tidy   # Update Go dependencies
./build-frontend.sh            # Production build of frontend
./build-backend.sh             # Build backend Go code
./test-backend.sh              # Run backend tests
./build.sh                     # Full build (frontend + backend)
```

## Global practices

### Commit strategy

- **Backend dependency updates**: Separate vendor folder changes into their own commit to isolate core logic changes
- **Frontend i18n updates**: Run `yarn i18n` and commit updated keys alongside any code changes that affect i18n

### Branch naming

- Feature work: `CONSOLE-####` (Jira story number)
- Bug fixes: `OCPBUGS-####` (Jira bug number)
- Base branch: `main`

## Required reference files for AI coding agents

**REQUIRED FOR ALL CODING AGENTS**: Before generating or modifying code, always consult the relevant file(s) to ensure full compliance. These files are the single source of truth for architecture, coding standards, and testing.

### General

- **[ARCHITECTURE.md](ARCHITECTURE.md)**
- **[TESTING.md](TESTING.md)**
- **[README.md](README.md)**
- **[CONTRIBUTING.md](CONTRIBUTING.md)**
- **[STYLEGUIDE.md](STYLEGUIDE.md)**
- **[INTERNATIONALIZATION.md](INTERNATIONALIZATION.md)**

### Plugin development

- **[frontend/packages/console-dynamic-plugin-sdk/README.md](frontend/packages/console-dynamic-plugin-sdk/README.md)** - Comprehensive dynamic plugin SDK documentation
