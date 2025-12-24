# EQBSL Explorer

EQBSL Explorer is an interactive web app for experimenting with trust systems built on:

- Evidence-Based Subjective Logic (EBSL)
- Zero-Knowledge EBSL (ZK‑EBSL)
- EQBSL and related trust computations

This project lives in the [`Steake/EQBSL`](https://github.com/Steake/EQBSL) repository and is implemented as an Angular 21 + TypeScript front‑end.

> App metadata: see [`metadata.json`](./metadata.json)

---

## Features

- Angular 21 app (`@angular/core`, `@angular/platform-browser`, `@angular/compiler`)
- TypeScript tooling (`typescript`, `@types/node`)
- RxJS for reactive data flows
- Tailwind CSS for styling
- Google Generative AI SDK (`@google/genai`) for AI‑assisted exploration of trust models
- Development and production builds via Angular CLI

For the broader theory and protocol details, see the root of the [`EQBSL`](https://github.com/Steake/EQBSL) repository.

---

## Getting Started

### Prerequisites

- **Node.js** (recommended: latest LTS)
- **npm** (bundled with Node.js)

### Install dependencies

```bash
cd eqbsl-explorer
npm install
```

### Development server

Start a local dev server with live reload:

```bash
npm run dev
```

By default, Angular will serve on `http://localhost:4200` (or the next available port). Check your terminal output for the exact URL.

### Production build

Create an optimized production build:

```bash
npm run build
```

This runs:

```bash
ng build
```

The output will be placed in Angular’s configured `outputPath` (see [`angular.json`](./angular.json)).

### Production preview

Serve the app using the production configuration:

```bash
npm run preview
```

This is equivalent to:

```bash
ng serve --configuration=production
```

---

## Project Structure (high level)

Key files in this folder:

- [`angular.json`](./angular.json) – Angular workspace & build configuration  
- [`package.json`](./package.json) – scripts, dependencies, and metadata  
- [`tsconfig.json`](./tsconfig.json) – TypeScript configuration  
- [`index.html`](./index.html) – main HTML entry point  
- [`index.tsx`](./index.tsx) – TypeScript entry file used by the AI Studio runtime  
- [`metadata.json`](./metadata.json) – app metadata for EQBSL Explorer  
- `src/` – Angular source code (components, modules, services, styles, etc.)

---

## Environment & Configuration

The app uses:

- Angular CLI scripts (`ng serve`, `ng build`)
- TypeScript 5
- Tailwind CSS for utility‑first styling
- Google Generative AI via `@google/genai`

If you introduce environment‑specific configuration (e.g., API keys or backend endpoints), prefer Angular’s environment files / configuration system so that:

- Sensitive values are **not committed** to version control.
- Production and development configurations stay separate.

---

## Scripts (from `package.json`)

```jsonc
{
  "scripts": {
    "dev": "ng serve",
    "build": "ng build",
    "preview": "ng serve --configuration=production"
  }
}
```

- `npm run dev` – run the development server
- `npm run build` – build for production
- `npm run preview` – serve the app using the production configuration

---

## Related Work

This app is part of the broader EQBSL ecosystem. For:

- Formal definitions and proofs
- Protocol specifications
- Reference implementations

see the root of the [`EQBSL`](https://github.com/Steake/EQBSL) repository.
