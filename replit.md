# Overview

This is a Gmail-integrated email receipt processor that automatically extracts data from service receipts (Uber, Uber Eats, Instacart) and generates downloadable PDF reports. The application provides a web interface for configuring processing rules, searching emails, and managing extracted data with analytics capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with centralized route registration
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Gmail OAuth2 integration for email access
- **File Storage**: Local file system for PDF generation and downloads

## Data Storage Solutions
- **Primary Database**: PostgreSQL configured through Drizzle with the following schema:
  - Users table with Gmail token storage
  - Processing rules for email pattern matching and data extraction
  - Email processing results with extracted data
  - Processing jobs for batch operations
- **File Storage**: Local downloads directory for generated PDFs
- **Session Management**: In-memory storage with fallback database option

## Authentication and Authorization
- **OAuth2 Flow**: Google Gmail API integration using googleapis library
- **Token Management**: Secure storage of Gmail access/refresh tokens in database
- **Scope**: Read-only Gmail access for email processing
- **Session**: Demo user system with persistent Gmail token association

## Processing Engine
- **Email Parser**: Cheerio-based HTML parsing for data extraction
- **Rule Engine**: Configurable field extraction rules with JSON-based patterns
- **PDF Generation**: PDFKit for creating downloadable receipt reports
- **Batch Processing**: Asynchronous job system for processing multiple emails
- **Data Validation**: Zod schemas for type-safe data processing

## Key Design Patterns
- **Shared Schema**: Common TypeScript types and Zod schemas between client and server
- **Service Layer**: Modular services for Gmail, email processing, and PDF generation
- **Component Architecture**: Reusable UI components with consistent design system
- **Error Handling**: Centralized error handling with user-friendly notifications
- **Real-time Updates**: Polling-based job status updates during email processing

# External Dependencies

## Core Services
- **Google Gmail API**: Email access and search functionality via googleapis package
- **Neon Database**: Serverless PostgreSQL hosting via @neondatabase/serverless

## Development Tools
- **Vite**: Development server and build tool with React plugin
- **Replit Integration**: Development environment support with cartographer and error overlay plugins

## UI Components
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide Icons**: Icon library for consistent iconography

## Data Processing
- **Cheerio**: Server-side HTML parsing and manipulation
- **PDFKit**: PDF document generation
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **Zod**: Runtime type validation and schema definition

## Authentication
- **Google Auth Library**: OAuth2 client for Gmail authentication
- **Google APIs**: Gmail service integration

## Utilities
- **Date-fns**: Date manipulation and formatting
- **Class Variance Authority**: Component variant management
- **React Hook Form**: Form state management with validation