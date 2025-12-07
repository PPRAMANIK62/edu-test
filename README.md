# edu-test

A cross-platform mobile application for educational purposes, supporting both student and teacher user roles with separate dashboards and workflows.

## Tech Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS)
- **Backend**: Appwrite
- **State Management**: TanStack React Query

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Expo CLI
- Appwrite account (cloud or self-hosted)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/PPRAMANIK62/edu-test.git
   cd edu-test
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file (see [Database Setup](#database-setup) below)

5. Start the development server:

   ```bash
   pnpm start
   ```

### Running on Platforms

```bash
# iOS Simulator
pnpm ios

# Android Emulator
pnpm android

# Web Browser
pnpm web
```

## Database Setup

This app uses **Appwrite TablesDB** for data storage. Follow these steps to set up your database.

### 1. Create Appwrite Project

1. Go to [Appwrite Console](https://cloud.appwrite.io) (or your self-hosted instance)
2. Create a new project
3. Note your **Project ID**

### 2. Create Database

1. Navigate to **Databases** in the Appwrite Console
2. Click **Create Database**
3. Name it (e.g., "edu-test-db")
4. Note the **Database ID**

### 3. Create Tables

Create the following tables in your database. Each table requires specific attributes.

#### Users Table

| Attribute        | Type    | Size                                 | Required |
| ---------------- | ------- | ------------------------------------ | -------- |
| email            | String  | 255                                  | Yes      |
| firstName        | String  | 100                                  | Yes      |
| lastName         | String  | 100                                  | Yes      |
| role             | Enum    | teacher, teaching_assistant, student | Yes      |
| isPrimaryTeacher | Boolean | -                                    | No       |

#### Courses Table

| Attribute      | Type     | Size | Required |
| -------------- | -------- | ---- | -------- |
| teacherId      | String   | 36   | Yes      |
| title          | String   | 255  | Yes      |
| description    | String   | 2000 | Yes      |
| imageUrl       | String   | 500  | Yes      |
| price          | Float    | -    | Yes      |
| currency       | String   | 10   | Yes      |
| subjects       | String[] | 100  | Yes      |
| estimatedHours | Integer  | -    | Yes      |
| isPublished    | Boolean  | -    | Yes      |

#### Tests Table

| Attribute       | Type    | Size | Required |
| --------------- | ------- | ---- | -------- |
| courseId        | String  | 36   | Yes      |
| title           | String  | 255  | Yes      |
| description     | String  | 2000 | Yes      |
| durationMinutes | Integer | -    | Yes      |
| passingScore    | Integer | -    | Yes      |
| isPublished     | Boolean | -    | Yes      |

#### TestSubjects Table

| Attribute     | Type    | Size | Required |
| ------------- | ------- | ---- | -------- |
| testId        | String  | 36   | Yes      |
| name          | String  | 100  | Yes      |
| questionCount | Integer | -    | Yes      |
| order         | Integer | -    | Yes      |

#### Questions Table

| Attribute    | Type     | Size | Required |
| ------------ | -------- | ---- | -------- |
| testId       | String   | 36   | Yes      |
| subjectId    | String   | 36   | Yes      |
| subjectName  | String   | 100  | Yes      |
| type         | Enum     | mcq  | Yes      |
| text         | String   | 2000 | Yes      |
| options      | String[] | 500  | Yes      |
| correctIndex | Integer  | -    | Yes      |
| explanation  | String   | 2000 | Yes      |
| order        | Integer  | -    | Yes      |

#### Enrollments Table

| Attribute   | Type    | Size              | Required |
| ----------- | ------- | ----------------- | -------- |
| studentId   | String  | 36                | Yes      |
| courseId    | String  | 36                | Yes      |
| status      | Enum    | active, completed | Yes      |
| progress    | Integer | -                 | Yes      |
| enrolledAt  | String  | 30                | Yes      |
| completedAt | String  | 30                | No       |

#### Purchases Table

| Attribute   | Type   | Size | Required |
| ----------- | ------ | ---- | -------- |
| studentId   | String | 36   | Yes      |
| courseId    | String | 36   | Yes      |
| amount      | Float  | -    | Yes      |
| currency    | String | 10   | Yes      |
| purchasedAt | String | 30   | Yes      |

#### TestAttempts Table

| Attribute   | Type     | Size                            | Required |
| ----------- | -------- | ------------------------------- | -------- |
| studentId   | String   | 36                              | Yes      |
| testId      | String   | 36                              | Yes      |
| courseId    | String   | 36                              | Yes      |
| startedAt   | String   | 30                              | Yes      |
| completedAt | String   | 30                              | No       |
| status      | Enum     | in_progress, completed, expired | Yes      |
| answers     | String[] | 100                             | Yes      |
| score       | Integer  | -                               | No       |
| percentage  | Float    | -                               | No       |
| passed      | Boolean  | -                               | No       |

#### Activities Table

| Attribute | Type   | Size                                        | Required |
| --------- | ------ | ------------------------------------------- | -------- |
| userId    | String | 36                                          | Yes      |
| type      | Enum   | test_completed, course_started, achievement | Yes      |
| title     | String | 255                                         | Yes      |
| subtitle  | String | 500                                         | Yes      |
| metadata  | String | 2000                                        | Yes      |

### 4. Create Indexes

For optimal query performance, create the following indexes:

| Table        | Index Name      | Attributes  | Type |
| ------------ | --------------- | ----------- | ---- |
| Courses      | teacherId_idx   | teacherId   | Key  |
| Courses      | isPublished_idx | isPublished | Key  |
| Tests        | courseId_idx    | courseId    | Key  |
| Questions    | testId_idx      | testId      | Key  |
| Enrollments  | studentId_idx   | studentId   | Key  |
| Enrollments  | courseId_idx    | courseId    | Key  |
| Purchases    | studentId_idx   | studentId   | Key  |
| TestAttempts | studentId_idx   | studentId   | Key  |
| TestAttempts | testId_idx      | testId      | Key  |
| Activities   | userId_idx      | userId      | Key  |

## Project Structure

```
edu-test/
├── app/                    # Expo Router pages
│   ├── (public)/          # Auth screens
│   ├── (student)/         # Student screens
│   └── (teacher)/         # Teacher screens
├── components/            # Reusable UI components
├── hooks/                 # React Query hooks
├── lib/
│   ├── services/         # Data access layer
│   ├── appwrite.ts       # Appwrite client
│   └── query-keys.ts     # Query key definitions
├── providers/            # Context providers
├── types/                # TypeScript types
└── openspec/             # Documentation
```

## Available Scripts

| Script         | Description                    |
| -------------- | ------------------------------ |
| `pnpm start`   | Start Expo development server  |
| `pnpm ios`     | Run on iOS simulator           |
| `pnpm android` | Run on Android emulator        |
| `pnpm web`     | Run in web browser             |
| `pnpm lint`    | Run ESLint                     |
| `pnpm seed`    | Seed database with sample data |

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [Appwrite Documentation](https://appwrite.io/docs)
- [TanStack Query](https://tanstack.com/query)
- [NativeWind](https://www.nativewind.dev/)
