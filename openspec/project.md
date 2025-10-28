# Project Context

## Purpose
edu-test is a cross-platform mobile application for educational purposes, supporting both student and teacher user roles with separate dashboards and workflows. The app provides a modern, native mobile experience for iOS, Android, and web platforms.

## Tech Stack
- **Framework**: Expo ~54.0.20 (React Native 0.81.5)
- **Language**: TypeScript 5.9.2 (strict mode enabled)
- **UI Library**: React 19.1.0
- **Routing**: Expo Router ~6.0.13 (file-based routing with typed routes)
- **Styling**: NativeWind 4.2.1 (Tailwind CSS for React Native)
- **Authentication**: Clerk Expo 2.17.1
- **State Management**: TanStack React Query 5.90.5
- **Navigation**: React Navigation (Bottom Tabs, Native Stack)
- **Animations**: React Native Reanimated 3.17.5, Expo Haptics
- **Icons**: Lucide React Native, Expo Vector Icons
- **Storage**: Expo Secure Store
- **Build Tool**: Metro bundler

## Project Conventions

### Code Style
- TypeScript strict mode enabled
- Path aliases configured with `@/*` mapping to project root
- ESLint configured with expo preset
- Prettier with Tailwind CSS plugin for class sorting
- Component files use PascalCase (e.g., `Dashboard.tsx`)
- React functional components with TypeScript
- Default exports for page components
- Prefer arrow function syntax for component definitions

### Architecture Patterns
- **File-based routing**: Pages defined in `app/` directory structure
- **Route groups**: Organized by role `(student)`, `(teacher)`, `(public)` and feature `(tabs)`
- **Typed routes**: Expo Router typed routes experiment enabled
- **React Compiler**: Enabled in experimental features for automatic optimization
- **New Architecture**: React Native new architecture enabled
- **Path-based imports**: Use `@/` alias for cleaner imports
- **Provider pattern**: Authentication and other global state wrapped in providers (e.g., `providers/clerk.tsx`)
- **Component composition**: Separate concerns between layout and feature components

### Testing Strategy
[To be defined - no testing framework currently configured]

### Git Workflow
[To be defined based on team preferences]

## Domain Context
**Educational Platform with Role-Based Access**:
- **Student Role**: Users accessing learning materials and tracking their progress
- **Teacher Role**: Users managing educational content, assignments, and student oversight
- **Public Routes**: Authentication flows (sign-in, sign-up, welcome)
- **Tab-based navigation**: Main user interface organized in tabs for easy access

## Important Constraints
- **Platform Support**: Must support iOS, Android, and web with consistent experience
- **Expo Compatibility**: All native modules must be Expo-compatible or use config plugins
- **Authentication**: Clerk integration required for all user management
- **TypeScript Strict Mode**: All code must pass strict type checking
- **React Native New Architecture**: Built for new architecture, may have compatibility considerations
- **Package Manager**: Uses pnpm (pnpm-workspace.yaml present)

## External Dependencies
- **Authentication Service**: Clerk (requires `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`)
- **Expo Services**: 
  - Splash screen management
  - Web browser integration
  - Secure storage
  - Asset management (fonts, images)
- **Design System**: Custom Tailwind theme with primary, success, and error color scales
- **Navigation**: React Navigation ecosystem for cross-platform routing
