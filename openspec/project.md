# Project Context

## Purpose

edu-test is a cross-platform mobile application for educational purposes, supporting both student and teacher user roles with separate dashboards and workflows. The app provides a modern, native mobile experience for iOS, Android, and web platforms.

## Tech Stack

- **Framework**: Expo ~54.0.20 (React Native 0.81.5)
- **Language**: TypeScript 5.9.2 (strict mode enabled)
- **UI Library**: React 19.1.0
- **Routing**: Expo Router ~6.0.13 (file-based routing with typed routes)
- **Styling**: NativeWind 4.2.1 (Tailwind CSS for React Native)
- **Backend**: Appwrite 21.3.0 (react-native-appwrite 0.4.0)
- **State Management**: TanStack React Query 5.90.5
- **Navigation**: React Navigation (Bottom Tabs, Native Stack)
- **Safe Area Handling**: React Native Safe Area Context 5.4.0
- **Animations**: React Native Reanimated 3.17.5, Expo Haptics
- **Icons**: Lucide React Native 0.548.0, Expo Vector Icons
- **Storage**: Expo Secure Store
- **Build Tool**: Metro bundler
- **Package Manager**: pnpm

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
- **Provider pattern**: Authentication and other global state wrapped in providers (e.g., `providers/appwrite.tsx`)
- **Component composition**: Separate concerns between layout and feature components
- **Safe Area Handling**: Consistent use of `SafeAreaView` or `useSafeAreaInsets()` across all screens
  - Modal screens use `SafeAreaView` with `edges={["top", "bottom"]}`
  - Stack screens with headers use `SafeAreaView` with `edges={["top"]}`
  - Tab screens use `useSafeAreaInsets()` for manual padding control
- **Mock Data Pattern**: Using `lib/mockdata.ts` for development until backend integration is complete

### Testing Strategy

[To be defined - no testing framework currently configured]

### Git Workflow

[To be defined based on team preferences]

## Project Structure

```
edu-test/
├── app/                          # Expo Router file-based routing
│   ├── _layout.tsx              # Root layout with providers
│   ├── index.tsx                # App entry redirect logic
│   ├── +not-found.tsx           # 404 page
│   ├── global.css               # Global styles (NativeWind)
│   ├── (public)/                # Public routes (auth)
│   │   ├── welcome.tsx
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (student)/               # Student-only routes
│   │   ├── (tabs)/              # Tab navigation
│   │   │   ├── dashboard.tsx
│   │   │   ├── browse.tsx
│   │   │   ├── courses.tsx
│   │   │   ├── tests.tsx
│   │   │   └── profile.tsx
│   │   ├── courses/[courseId].tsx
│   │   ├── test/[testId]/intro.tsx
│   │   └── attempt/[attemptId].tsx
│   └── (teacher)/               # Teacher-only routes
│       └── (tabs)/              # Tab navigation
│           ├── dashboard.tsx
│           ├── courses.tsx
│           ├── students.tsx
│           └── profile.tsx
├── components/                  # Reusable UI components
│   ├── student/                # Student-specific components
│   └── teacher/                # Teacher-specific components
├── lib/                        # Utilities and helpers
│   ├── appwrite.ts            # Appwrite client configuration
│   ├── mockdata.ts            # Mock data for development
│   └── utils.ts               # Utility functions
├── hooks/                      # Custom React hooks
│   └── use-appwrite.ts        # Appwrite integration hook
├── providers/                  # Context providers
│   └── appwrite.tsx           # Appwrite auth provider
├── types/                      # TypeScript type definitions
│   └── index.ts               # Shared types
├── assets/                     # Static assets (images, fonts)
├── openspec/                   # Project documentation
│   ├── AGENTS.md              # AI assistant instructions
│   ├── project.md             # This file
│   ├── specs/                 # Technical specifications
│   └── changes/               # Change proposals & archives
└── Configuration files
    ├── package.json           # Dependencies and scripts
    ├── tsconfig.json          # TypeScript configuration
    ├── tailwind.config.js     # Tailwind/NativeWind config
    ├── metro.config.js        # Metro bundler config
    ├── babel.config.js        # Babel configuration
    └── app.json               # Expo configuration
```

## Development Practices

### Starting Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm start

# Run on specific platform
pnpm android
pnpm ios
pnpm web
```

### Code Quality

- Run ESLint: `pnpm lint`
- TypeScript checking is automatic in IDE
- Prettier formats on save (with Tailwind class sorting)

### Component Guidelines

1. **Screen Components** (in `app/` directory):
   - Must handle safe areas properly
   - Use `SafeAreaView` from `react-native-safe-area-context`
   - Configure edges appropriately (e.g., `edges={["top"]}` for screens with headers)

2. **Reusable Components** (in `components/` directory):
   - Organize by feature/role (student, teacher, shared)
   - Export with named exports for sub-components, default for main component
   - Include TypeScript prop interfaces

3. **Data Fetching**:
   - Use TanStack React Query for all async operations
   - Define query keys consistently: `['resource', id]` or `['feature-resource']`
   - Handle loading and error states

4. **Styling**:
   - Use NativeWind className prop exclusively
   - Follow mobile-first approach
   - Use semantic color names from tailwind.config.js (primary-_, gray-_, etc.)
   - Consistent spacing scale (px-6, py-4, mb-3, etc.)

### Navigation Patterns

- Use `router.push()` for forward navigation
- Use `router.back()` for back navigation
- Use `router.replace()` for auth redirects
- Type-safe params with `useLocalSearchParams<{ param: string }>()`

### State Management Patterns

- **Server State**: TanStack React Query (courses, tests, user data)
- **Auth State**: Appwrite provider context
- **Local UI State**: React useState
- **Form State**: Controlled components with useState

## Domain Context

**Educational Platform with Role-Based Access**:

- **Student Role**: Users accessing learning materials and tracking their progress
- **Teacher Role**: Users managing educational content, assignments, and student oversight
- **Public Routes**: Authentication flows (sign-in, sign-up, welcome)
- **Tab-based navigation**: Main user interface organized in tabs for easy access

## Important Constraints

- **Platform Support**: Must support iOS, Android, and web with consistent experience
- **Expo Compatibility**: All native modules must be Expo-compatible or use config plugins
- **Authentication**: Appwrite integration required for all user management
- **TypeScript Strict Mode**: All code must pass strict type checking
- **React Native New Architecture**: Built for new architecture, may have compatibility considerations
- **Package Manager**: Uses pnpm (pnpm-workspace.yaml present)
- **Safe Area Consistency**: All screens must properly handle device safe areas to avoid content extending into system UI (status bar, notch, home indicator)
- **NativeWind**: Use Tailwind utility classes via `className` prop, not inline styles

## External Dependencies

- **Backend Service**: Appwrite (requires environment variables for project configuration)
- **Expo Services**:
  - Splash screen management
  - Web browser integration
  - Secure storage
  - Asset management (fonts, images)
  - System UI (status bar styling)
- **Design System**: Custom Tailwind theme with primary, success, and error color scales
- **Navigation**: React Navigation ecosystem for cross-platform routing
- **Safe Area Context**: Manages device-specific safe areas (notches, status bars, home indicators)

## Database Architecture

### Overview

The application uses **Appwrite TablesDB** as the backend database. Data is organized into 9 tables with relationships managed through foreign key references.

### Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Users    │     │   Courses   │     │    Tests    │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ $id (PK)    │◄────│ teacherId   │◄────│ courseId    │
│ email       │     │ $id (PK)    │     │ $id (PK)    │
│ firstName   │     │ title       │     │ title       │
│ lastName    │     │ description │     │ description │
│ role        │     │ imageUrl    │     │ durationMin │
│ isPrimary   │     │ price       │     │ passingScore│
└──────┬──────┘     │ currency    │     │ isPublished │
       │            │ subjects[]  │     └──────┬──────┘
       │            │ estimatedHrs│            │
       │            │ isPublished │            │
       │            └──────┬──────┘            │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Enrollments │     │  Purchases  │     │TestSubjects │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ studentId   │     │ studentId   │     │ testId      │
│ courseId    │     │ courseId    │     │ $id (PK)    │
│ status      │     │ amount      │     │ name        │
│ progress    │     │ currency    │     │ questionCnt │
│ enrolledAt  │     │ purchasedAt │     │ order       │
│ completedAt │     └─────────────┘     └──────┬──────┘
└─────────────┘                                │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Activities  │     │TestAttempts │     │  Questions  │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ userId      │     │ studentId   │     │ testId      │
│ type        │     │ testId      │     │ subjectId   │
│ title       │     │ courseId    │     │ subjectName │
│ subtitle    │     │ startedAt   │     │ type (mcq)  │
│ metadata    │     │ completedAt │     │ text        │
│ $createdAt  │     │ status      │     │ options[]   │
└─────────────┘     │ answers[]   │     │ correctIdx  │
                    │ score       │     │ explanation │
                    │ percentage  │     │ order       │
                    │ passed      │     └─────────────┘
                    └─────────────┘
```

### Tables Schema

#### Users Table

Stores user profile information linked to Appwrite Auth accounts.

| Field              | Type    | Description                                    |
| ------------------ | ------- | ---------------------------------------------- |
| `$id`              | string  | Primary key (matches Auth user ID)             |
| `email`            | string  | User email address                             |
| `firstName`        | string  | User's first name                              |
| `lastName`         | string  | User's last name                               |
| `role`             | enum    | `teacher`, `teaching_assistant`, `student`     |
| `isPrimaryTeacher` | boolean | Whether user is the primary teacher (optional) |

#### Courses Table

Stores course information created by teachers.

| Field            | Type     | Description                 |
| ---------------- | -------- | --------------------------- |
| `$id`            | string   | Primary key                 |
| `teacherId`      | string   | Foreign key to Users        |
| `title`          | string   | Course title                |
| `description`    | string   | Course description          |
| `imageUrl`       | string   | Course thumbnail URL        |
| `price`          | number   | Course price                |
| `currency`       | string   | Currency code (e.g., "INR") |
| `subjects`       | string[] | List of subject tags        |
| `estimatedHours` | number   | Estimated completion time   |
| `isPublished`    | boolean  | Whether course is visible   |

#### Tests Table

Stores test/exam information within courses.

| Field             | Type    | Description                |
| ----------------- | ------- | -------------------------- |
| `$id`             | string  | Primary key                |
| `courseId`        | string  | Foreign key to Courses     |
| `title`           | string  | Test title                 |
| `description`     | string  | Test description           |
| `durationMinutes` | number  | Time limit in minutes      |
| `passingScore`    | number  | Minimum passing percentage |
| `isPublished`     | boolean | Whether test is available  |

#### TestSubjects Table

Stores subject sections within tests.

| Field           | Type   | Description          |
| --------------- | ------ | -------------------- |
| `$id`           | string | Primary key          |
| `testId`        | string | Foreign key to Tests |
| `name`          | string | Subject name         |
| `questionCount` | number | Number of questions  |
| `order`         | number | Display order        |

#### Questions Table

Stores MCQ questions for tests.

| Field          | Type     | Description                   |
| -------------- | -------- | ----------------------------- |
| `$id`          | string   | Primary key                   |
| `testId`       | string   | Foreign key to Tests          |
| `subjectId`    | string   | Foreign key to TestSubjects   |
| `subjectName`  | string   | Denormalized subject name     |
| `type`         | enum     | Question type (`mcq`)         |
| `text`         | string   | Question text                 |
| `options`      | string[] | Array of option texts         |
| `correctIndex` | number   | Index of correct option (0-3) |
| `explanation`  | string   | Answer explanation            |
| `order`        | number   | Display order                 |

#### Enrollments Table

Tracks student course enrollments.

| Field         | Type   | Description                   |
| ------------- | ------ | ----------------------------- |
| `$id`         | string | Primary key                   |
| `studentId`   | string | Foreign key to Users          |
| `courseId`    | string | Foreign key to Courses        |
| `status`      | enum   | `active`, `completed`         |
| `progress`    | number | Completion percentage (0-100) |
| `enrolledAt`  | string | ISO timestamp                 |
| `completedAt` | string | ISO timestamp (nullable)      |

#### Purchases Table

Records course purchases for revenue tracking.

| Field         | Type   | Description            |
| ------------- | ------ | ---------------------- |
| `$id`         | string | Primary key            |
| `studentId`   | string | Foreign key to Users   |
| `courseId`    | string | Foreign key to Courses |
| `amount`      | number | Purchase amount        |
| `currency`    | string | Currency code          |
| `purchasedAt` | string | ISO timestamp          |

#### TestAttempts Table

Stores student test attempts and results.

| Field         | Type     | Description                           |
| ------------- | -------- | ------------------------------------- |
| `$id`         | string   | Primary key                           |
| `studentId`   | string   | Foreign key to Users                  |
| `testId`      | string   | Foreign key to Tests                  |
| `courseId`    | string   | Foreign key to Courses                |
| `startedAt`   | string   | ISO timestamp                         |
| `completedAt` | string   | ISO timestamp (nullable)              |
| `status`      | enum     | `in_progress`, `completed`, `expired` |
| `answers`     | string[] | Array of JSON answer tuples           |
| `score`       | number   | Points scored (nullable)              |
| `percentage`  | number   | Score percentage (nullable)           |
| `passed`      | boolean  | Whether passed (nullable)             |

**Answer Format**: Each answer is stored as JSON: `[questionIndex, selectedOptionIndex, isMarkedForReview]`

#### Activities Table

Stores user activity feed for dashboards.

| Field        | Type   | Description                                       |
| ------------ | ------ | ------------------------------------------------- |
| `$id`        | string | Primary key                                       |
| `userId`     | string | Foreign key to Users                              |
| `type`       | enum   | `test_completed`, `course_started`, `achievement` |
| `title`      | string | Activity title                                    |
| `subtitle`   | string | Activity description                              |
| `metadata`   | string | JSON metadata                                     |
| `$createdAt` | string | Timestamp (auto-generated)                        |

### Service Layer

Data access is abstracted through service modules in `lib/services/`:

- `courses.ts` - Course CRUD and queries
- `tests.ts` - Test CRUD and queries
- `questions.ts` - Question CRUD and reordering
- `enrollments.ts` - Student enrollment management
- `purchases.ts` - Purchase records and revenue
- `attempts.ts` - Test attempt lifecycle
- `activities.ts` - Activity logging and retrieval

### React Query Integration

Custom hooks in `hooks/` provide data fetching with caching:

- `use-courses.ts` - `useCourses()`, `useCoursesByTeacher()`, etc.
- `use-tests.ts` - `useTests()`, `useTestWithSubjects()`, etc.
- `use-questions.ts` - `useQuestions()`, mutations for CRUD
- `use-enrollments.ts` - `useEnrollments()`, enrollment mutations
- `use-attempts.ts` - `useAttempts()`, attempt lifecycle
- `use-activities.ts` - `useActivities()`

Query keys are centralized in `lib/query-keys.ts` for consistent cache invalidation.

## Feature Areas

### Student Features

- **Dashboard**: Overview of enrolled courses, stats, recent activity, and quick actions
- **Browse**: Discover and purchase new courses
- **My Courses**: View enrolled courses with progress tracking
- **Tests**: Access available tests from purchased courses
- **Test Taking**: Full-featured test interface with timer, question navigation, and review
- **Profile**: Account management and statistics
- **Course Details**: View course information, tests, and subjects covered

### Teacher Features

- **Dashboard**: Overview and welcome screen
- **My Courses**: Manage created courses
- **Students**: View and track student progress and ratings
- **Profile**: Account settings and business information

### Public Features

- **Welcome Screen**: App introduction and feature highlights
- **Sign In**: Email/password authentication
- **Sign Up**: User registration with role selection (student/teacher)

## Known Issues & Solutions

### Safe Area Handling (Fixed: Nov 1, 2025)

**Issue**: Pages were inconsistently taking the full screen including system UI areas (status bar, notch) on initial render, but would fix themselves on re-navigation.

**Root Cause**: Pages with Stack.Screen headers didn't have safe area containers, causing initial renders to extend into system UI areas before React Navigation's cache kicked in.

**Solution**: Wrapped affected pages in `SafeAreaView`:

- `app/(student)/courses/[courseId].tsx` - Added `SafeAreaView` with `edges={["top"]}`
- `app/(student)/test/[testId]/intro.tsx` - Added `SafeAreaView` with `edges={["top"]}`
- `app/(student)/attempt/[attemptId].tsx` - Added `SafeAreaView` with `edges={["top", "bottom"]}` (fullScreenModal)

**Prevention**: Always use `SafeAreaView` or `useSafeAreaInsets()` on all screen components to ensure consistent safe area handling across all renders.
