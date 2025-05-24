# Fencing Judge Frontend

This is the frontend application for the Fencing Video Judge system.

## Technology Stack

- React with TypeScript
- Vite as the build tool
- Tailwind CSS for styling
- DaisyUI for UI components
- Video.js for video playback

## Setup Instructions

1. Install dependencies:

```bash
pnpm install
```

2. Install Tailwind CSS and DaisyUI (if not already installed):

```bash
pnpm add -D tailwindcss postcss autoprefixer daisyui@latest
```

3. Start the development server:

```bash
pnpm dev
```

## Project Structure

- `src/` - Source code
  - `components/` - React components
  - `services/` - API services
  - `assets/` - Static assets

## Styling

This project uses Tailwind CSS with DaisyUI for styling. The main configuration files are:

- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `src/index.css` - Global styles and Tailwind directives

## Available Scripts

- `pnpm dev` - Start the development server
- `pnpm build` - Build the production version
- `pnpm preview` - Preview the production build locally
- `pnpm lint` - Run ESLint

## Notes

- The application is configured to connect to a backend server running at `http://localhost:8000`.
- Video.js is used for video playback with custom controls.
