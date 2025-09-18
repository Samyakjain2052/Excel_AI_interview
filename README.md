# AI Excel Mock Interviewer

A modern full-stack web application that provides AI-powered Excel interview practice with real-time voice and text interaction.

## Features

- AI-powered Excel interview questions
- Real-time voice and text interaction
- Performance evaluation and reporting
- Modern React frontend with TypeScript
- Express.js backend with PostgreSQL database

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Shadcn/ui components
- TanStack Query for state management
- Framer Motion for animations

### Backend
- Express.js with TypeScript
- PostgreSQL with Drizzle ORM
- Groq AI API for interview logic
- WebSocket support for real-time features

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```
   
   **For quick local development**: The app will work with the provided `.env` file using a mock database.
   
   **For full database functionality**: Set up a PostgreSQL database and update the `DATABASE_URL` in your `.env` file:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/aimockinterview
   GROQ_API_KEY=your_groq_api_key
   ```

4. (Optional) Push the database schema if using a real database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check with TypeScript
- `npm run db:push` - Push database schema changes

## Project Structure

```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
└── attached_assets/ # Static assets
```