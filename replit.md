# Dominion TV Mobile App

## Overview

Dominion TV is a React Native mobile application built with Expo for a broadcasting station. The app provides a public-facing interface for viewers to access TV program schedules, news headlines, and app settings. No authentication is required - all content is freely accessible.

The app's core functionality includes:
- Live program schedule with real-time detection of currently airing shows
- Integration with YouTube for live streaming and program playback
- News headlines display
- Per-program notification preferences (UI only, not functional yet)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation with bottom tabs and native stack navigator
- **State Management**: React Query for server state, React useState for local state
- **Animations**: React Native Reanimated for smooth UI animations
- **Styling**: StyleSheet-based approach with a centralized theme system in `client/constants/theme.ts`

### Project Structure
```
client/           # React Native frontend
├── components/   # Reusable UI components (ThemedText, ThemedView, Card, Button)
├── screens/      # Screen components (Home, News, Settings)
├── navigation/   # Navigation configuration
├── hooks/        # Custom hooks (useTheme, useScreenOptions)
├── constants/    # Theme colors, spacing, typography
└── lib/          # API client and query configuration

server/           # Express.js backend
├── index.ts      # Server entry point with CORS and middleware
├── routes.ts     # API route definitions
└── storage.ts    # In-memory data storage

shared/           # Shared code between client and server
└── schema.ts     # Drizzle ORM schema definitions
```

### Design System
- **Primary Color**: Turquoise (#08D9D6)
- **Secondary Color**: Red (for LIVE badges)
- **Accent Color**: Gold (for LIVE card borders)
- **Theme Support**: Light and dark mode with automatic detection

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Storage**: Currently using in-memory storage (`MemStorage` class), designed for easy database migration
- **API Pattern**: RESTful endpoints prefixed with `/api`

### Key Design Decisions

1. **No Authentication**: The app is designed for public content consumption without user accounts, simplifying the architecture significantly.

2. **Hardcoded Schedule**: Program schedules are currently defined in `HomeScreen.tsx` as static data. The "LIVE" status is computed client-side by comparing current device time against schedule times.

3. **YouTube Integration**: 
   - Live shows open the station's YouTube channel
   - Non-live shows open a YouTube search for the program title
   - Uses `expo-linking` for URL handling

4. **Custom Bottom Tab Bar**: Uses React Navigation's bottom tabs but with custom styling to match brand colors.

## External Dependencies

### Core Framework
- **Expo SDK 54**: Managed React Native workflow with access to native APIs
- **React 19.1.0**: Latest React version with concurrent features

### Navigation & UI
- **@react-navigation/native**: Navigation container and core utilities
- **@react-navigation/bottom-tabs**: Tab-based navigation
- **@react-navigation/native-stack**: Native stack navigation
- **react-native-reanimated**: High-performance animations
- **react-native-gesture-handler**: Touch gesture handling
- **react-native-safe-area-context**: Safe area insets management

### Data & State
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe ORM for database operations
- **drizzle-zod**: Zod schema generation from Drizzle schemas
- **zod**: Runtime type validation

### Backend
- **express**: Node.js web framework
- **pg**: PostgreSQL client (database not yet provisioned)

### External Services
- **YouTube**: Live streaming and video search integration via URL schemes
- **Expo Linking**: Deep linking and URL handling

### Development Tools
- **tsx**: TypeScript execution for development
- **drizzle-kit**: Database migration tooling
- **esbuild**: Server bundling for production