# AI Excel Mock Interviewer

## Overview

A modern full-stack web application that provides AI-powered Excel interview practice with real-time voice and text interaction. The system conducts structured interviews with 5-10 Excel-related questions, evaluates responses using AI, and generates comprehensive performance reports. Built with a React frontend, Express.js backend, and PostgreSQL database using modern technologies like TypeScript, TailwindCSS, and the Groq AI API.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library with Radix UI primitives for accessibility
- **Styling**: TailwindCSS with dark theme support and CSS variables for theming
- **State Management**: TanStack Query for server state management and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Animations**: Framer Motion for smooth UI transitions and interactions

### Backend Architecture
- **Runtime**: Node.js with Express.js framework using TypeScript
- **API Design**: RESTful API structure with centralized route registration
- **Database ORM**: Drizzle ORM for type-safe database operations with PostgreSQL
- **Session Management**: Express sessions with PostgreSQL session store
- **File Uploads**: Multer middleware for handling file uploads
- **Development**: Hot reload with Vite middleware integration

### Data Storage Solutions
- **Primary Database**: PostgreSQL using Neon serverless database
- **Schema Management**: Drizzle Kit for database migrations and schema management
- **Connection Pooling**: Neon serverless connection pooling with WebSocket support
- **Data Models**: Three main entities - users, interviews, and question bank with JSONB fields for flexible data storage

### Authentication and Authorization
- **Session-based Authentication**: Using Express sessions stored in PostgreSQL
- **Anonymous Users**: Supports anonymous interview sessions without required authentication
- **User Management**: Basic user creation and management with username/password

### External Service Integrations
- **AI Evaluation**: Groq API for answer evaluation and feedback generation
- **Speech Recognition**: Browser Web Speech API for voice input transcription
- **Text-to-Speech**: Browser Speech Synthesis API for AI interviewer voice output
- **PDF Generation**: jsPDF for client-side report generation and export
- **Development Tools**: Replit-specific development plugins for enhanced development experience

## External Dependencies

### Core Technologies
- **Database**: Neon PostgreSQL serverless database with connection pooling
- **AI Services**: Groq API for natural language processing and answer evaluation
- **File Storage**: Local file system for temporary uploads and assets

### Third-party Services
- **Browser APIs**: Web Speech API for voice recognition and Speech Synthesis API for text-to-speech
- **CDN Resources**: Google Fonts for typography (Inter font family)
- **PDF Libraries**: jsPDF for client-side PDF report generation

### Development Dependencies
- **Build Tools**: Vite for development server and build optimization
- **Code Quality**: TypeScript for type safety, ESLint for linting
- **Replit Integration**: Custom Vite plugins for Replit development environment
- **Testing**: Component testing setup with React Testing Library patterns