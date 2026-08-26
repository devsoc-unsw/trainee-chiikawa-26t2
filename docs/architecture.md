# Architecture

This document aims to give an overview on the application architecture/stack/design of learnten.

## Frontend
Learnten uses Vite + React + React Router for frontend. It is written in TypeScript and runs on Vite. Specifically, the frontend runs as a React [single-page application (SPA)](https://en.wikipedia.org/wiki/Single-page_application) using React Router v8 in [Data mode](https://reactrouter.com/start/modes#data) for routing. Learning the routing config for React Router will be essential for creating pages and configurating data loading (pls do this).

## Backend
Learnten uses Express.js and mongodb for backend. The frontend connects to the backend via a REST API, providing it with data. The backend handles logic, authentication and communicates with external infrastructure such as mongodb atlas and cloudflare r2.

## Folder Structure
A list and description of important files.
### Frontend
- `public/` - public resources
- `src/`
  - `api/` - how the frontend fetches data from the backend
  - `assets/` - page assets (images, etc)
  - `components/` - shared React components
  - `lib/` - things that connect to or configure external infrastructure
  - `pages/` - files for each page/feature of the app
  - `main.tsx` - entry point into the app
  - `router.tsx` - contains all React Router routes

### Backend
- `src/`
  - `lib/` - things that connect to or configure external infrastructure
  - `controllers/` - express controllers for routes
  - `middleware/` - express middleware
  - `models/` - mongoose schemas
  - `routes/` - all the rest api routes for the app
  - `services/` - application logic and operations
  - `index.ts` - main process entry point. express app