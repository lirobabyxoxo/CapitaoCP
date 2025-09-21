# Overview

GURIZES is a comprehensive Discord bot application built with a modern full-stack architecture. The bot provides a wide range of features including administrative moderation tools, roleplay commands with anime-themed interactions, marriage/relationship systems, and server configuration utilities. The project combines a React-based web dashboard for showcasing bot features with a robust Express.js backend that handles both the Discord bot functionality and web API endpoints.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client application is built with React and modern web technologies:
- **React 18** with TypeScript for type safety and component-based architecture
- **Vite** as the build tool and development server for fast development and optimized production builds
- **Tailwind CSS** with shadcn/ui component library for consistent, modern UI design
- **TanStack Query** for efficient data fetching and state management
- **Wouter** for lightweight client-side routing
- **Path aliases** configured for clean imports (@/, @shared/, @assets/)

## Backend Architecture
The server implements a multi-layered Node.js architecture:
- **Express.js** as the web framework handling both API routes and static file serving
- **Discord.js v14** for comprehensive Discord bot functionality with full intent support
- **Command-based bot architecture** with modular command categories (admin, roleplay, utility, marry, setup)
- **Event-driven system** for handling Discord events like message creation, logging, and moderation
- **Middleware stack** for request logging, JSON parsing, and error handling

## Database Layer
The application uses a PostgreSQL database with modern ORM patterns:
- **Drizzle ORM** with Neon serverless PostgreSQL for type-safe database operations
- **Schema-driven design** with shared TypeScript types between client and server
- **Migration system** for database versioning and deployment
- **Comprehensive data models** for users, marriages, server configurations, mutes, and audit logs

## Bot Command System
The Discord bot implements a sophisticated command architecture:
- **Slash command integration** with Discord's native command system
- **Permission-based access control** with role and user-level authorization
- **Interactive components** including buttons, modals, and select menus for complex workflows
- **Modular command organization** by functionality (admin tools, roleplay actions, utility commands)
- **Real-time event handling** for message monitoring, quick-clear systems, and automated moderation

## External Dependencies

### Discord Integration
- **Discord.js v14** - Primary Discord API client with gateway intents for guilds, messages, members, and moderation
- **Discord Application Commands** - Native slash command registration and handling
- **Discord Components** - Interactive buttons, modals, select menus, and embeds

### Database Services
- **Neon Database** - Serverless PostgreSQL hosting with connection pooling
- **Drizzle Kit** - Database migration and schema management tools
- **pg-simple** - PostgreSQL session store for Express sessions

### External APIs
- **Waifu.pics API** - Anime GIF service for roleplay commands (kiss, hug, pat, slap, kill actions)
- **Custom anime action endpoints** for dynamic content in roleplay interactions

### UI and Styling
- **Radix UI** - Comprehensive set of accessible, unstyled UI primitives
- **Tailwind CSS** - Utility-first CSS framework with custom design system
- **Lucide React** - Icon library for consistent iconography
- **Class Variance Authority** - Type-safe variant APIs for component styling

### Development Tools
- **Vite plugins** - Runtime error overlay, development banner, and cartographer for Replit integration
- **TypeScript** - Full type safety across the entire stack
- **ESBuild** - Fast bundling for production server builds
- **PostCSS** - CSS processing with Tailwind integration

### Authentication and Sessions
- **Express sessions** - Server-side session management
- **PostgreSQL session store** - Persistent session storage using connect-pg-simple
- **Role-based permissions** - Discord role integration for command authorization

### Monitoring and Logging
- **Custom logging middleware** - Request/response logging for API endpoints
- **Discord audit logging** - Comprehensive event logging for moderation actions
- **Error handling** - Global error catching with appropriate HTTP status codes