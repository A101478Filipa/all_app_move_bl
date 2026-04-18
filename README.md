# MOVEPLUSAPP

A comprehensive healthcare management system designed for elderly care institutions, featuring fall detection, health monitoring, and multi-role user management. The application provides real-time monitoring capabilities for elderly patients, allowing caregivers and institution staff to track health metrics, manage medications, respond to fall incidents, and maintain detailed patient records.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Database Management](#database-management)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

## 🎯 Overview

MOVEPLUSAPP is a multi-platform healthcare solution that bridges the gap between elderly care facilities and modern technology. It enables institutions to:

- Monitor elderly patients in real-time
- Detect and respond to fall incidents
- Manage patient health records, medications, and pathologies
- Track vital signs and measurements
- Coordinate care between different user roles (caregivers, administrators, clinicians)
- Maintain comprehensive activity logs and assessments

## ✨ Features

### 👥 Multi-Role User Management
- **Elderly Patients**: Personal health profiles with medical history
- **Caregivers**: Patient monitoring and care coordination
- **Institution Admins**: Facility management and oversight
- **Clinicians**: Medical assessments and treatment planning
- **Programmers**: System maintenance and configuration

### 🚨 Fall Detection & Management
- Real-time fall detection monitoring
- Incident reporting and response workflows
- Detailed fall occurrence documentation
- Injury assessment and follow-up tracking

### 💊 Health Record Management
- Medication tracking and administration schedules
- Pathology documentation and monitoring
- Vital signs and measurement recording
- Comprehensive patient history

### 📱 Cross-Platform Mobile App
- Native iOS and Android support via React Native
- Intuitive user interface with role-based access
- Real-time notifications and alerts
- Offline capability with data synchronization

## 🏗️ Architecture

The application follows a modern three-tier architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│                 │    │                 │    │                 │
│  React Native   │◄──►│   Node.js +     │◄──►│   PostgreSQL    │
│  (Expo)         │    │   Express       │    │   (Prisma ORM)  │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                       │
          │                       │
          └───────────────────────┼─────────────────────────┐
                                  │                         │
                        ┌─────────▼─────────┐    ┌──────────▼──────────┐
                        │   Shared Package  │    │   File Storage      │
                        │                   │    │                     │
                        │ TypeScript Types  │    │   Images/Uploads    │
                        │ Zod Validation    │    │                     │
                        │                   │    │                     │
                        └───────────────────┘    └─────────────────────┘
```

## 🛠️ Technology Stack

### Frontend (Mobile App)
- **React Native 0.76.9** - Cross-platform mobile development
- **Expo 52.0.0** - Development platform and toolchain
- **TypeScript** - Type-safe JavaScript development
- **React Navigation 6.x** - Navigation and routing
- **Redux Toolkit** - State management
- **React Native Paper** - Material Design UI components

### Backend (Server)
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe development
- **Prisma** - Database ORM and migration tool
- **PostgreSQL** - Relational database
- **JWT** - Authentication and authorization
- **Multer** - File upload handling

### Shared Package
- **TypeScript** - Shared type definitions
- **Zod** - Runtime type validation and parsing
- **npm workspaces** - Monorepo package management

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Nodemon** - Development server auto-restart
- **ts-node** - TypeScript execution

## 📋 Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **PostgreSQL** (v14 or higher)
- **Expo CLI** (for mobile development)
- **Git**

### Mobile Development Prerequisites
- **iOS Development**: Xcode (macOS only)
- **Android Development**: Android Studio
- **Expo Go App** (for testing on physical devices)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/BiRDLab-UMinho/MOVEPLUSAPP.git
   cd MOVEPLUSAPP
   ```

2. **Install dependencies for all packages**
   ```bash
   # Install server dependencies
   cd server && npm install && cd ..

   # Install app dependencies
   cd app && npm install && cd ..

   # Install shared package dependencies
   cd shared && npm install && cd ..
   ```

3. **Build the shared package**
   ```bash
   make shared
   ```

4. **Set up environment variables**

   Create a `.env` file in the `server` directory:
   ```bash
   # Database Configuration
   DATABASE_URL="postgresql://username:password@localhost:5432/moveplusapp"
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=moveplusapp

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key

   # Server Configuration
   PORT=3000
   ```
   Create a `.env` file in the `app` directory:
   ```bash
   # Backend Server Configuration
   SERVER_ADDRESS=localhost
   SERVER_PORT=3000
   ```

5. **Set up the database**
   ```bash
   make db
   ```

## 🔧 Development

The project includes a comprehensive Makefile for easy development workflow management.

### Available Make Commands

#### Start Development Server
```bash
make dev
```
Starts the Node.js backend server in development mode with hot reloading.

#### Start Mobile App
```bash
make expo
```
Launches the React Native app using Expo CLI with cache clearing.

#### Database Management
```bash
# Reset and recreate the database schema
make drop-db

# Full database setup (drop, migrate, seed)
make db

# Build shared package
make shared
```

#### Production Build
```bash
make dist
```
Builds and runs the production version of the server.

### Development Workflow

1. **Start the backend server**
   ```bash
   make dev
   ```

2. **In a new terminal, build the shared package**
   ```bash
   make shared
   ```

3. **In another terminal, start the mobile app**
   ```bash
   make expo
   ```

4. **Access the application**
   - Backend API: `http://localhost:3000`
   - Mobile app: Use Expo Go app or simulator

## 🗄️ Database Management

### Prisma ORM

The project uses Prisma as the database ORM, providing type-safe database access and automatic migration management.

#### Key Prisma Commands (run inside the server folder)

```bash
# Generate Prisma client (run after schema changes)
npx prisma generate

# Apply database migrations
npx prisma migrate dev --name migration_name

# Reset database and apply all migrations
npx prisma migrate reset

# Seed the database with initial data
npx prisma db seed

# View database in Prisma Studio
npx prisma studio
```

#### Schema Management

The database schema is defined in `server/prisma/schema.prisma` and includes:

- **User Management**: Multi-role user system
- **Institution Management**: Healthcare facility organization
- **Patient Records**: Elderly patient information and medical history
- **Fall Detection**: Incident tracking and response
- **Health Monitoring**: Medications, pathologies, and measurements
- **Activity Logging**: Comprehensive audit trail

### Database Seeding

Initial mock data can be populated using the seed script:
```bash
cd server && npx prisma db seed
```

The seed file is located at `server/prisma/seed.ts` and creates sample institutions, users, and test data.

## 📁 Project Structure

```
MOVEPLUSAPP/
├── Makefile                    # Development workflow automation
├── README.md                   # Project documentation
│
├── app/                        # React Native mobile application
│   ├── App.tsx                 # Application entry point
│   ├── package.json            # Mobile app dependencies
│   ├── babel.config.js         # Babel configuration
│   ├── metro.config.js         # Metro bundler configuration
│   ├── tsconfig.json           # TypeScript configuration
│   ├── assets/                 # Static assets (images, fonts, icons)
│   └── src/                    # Application source code
│       ├── constants/          # Application constants
│       ├── modules/            # Feature-based modules
│       │   ├── authentication/ # App authentication
│       │   ├── elderly/        # Elderly management
│       │   ├── falls/          # Fall detection and management
│       │   ├── institution/    # Institution management
│       │   └── caregivers/     # Caregiver functionality
│       ├── services/           # API and external services
│       ├── ui/                 # UI components and styles
│       └── utils/              # Utility functions
│
├── server/                     # Node.js backend application
│   ├── package.json            # Server dependencies
│   ├── tsconfig.json           # TypeScript configuration
│   ├── nodemon.json            # Nodemon configuration
│   ├── prisma/                 # Database management
│   │   ├── schema.prisma       # Database schema definition
│   │   ├── seed.ts             # Database seeding script
│   │   └── migrations/         # Database migration files
│   └── src/                    # Server source code
│       ├── server.ts           # Application entry point
│       ├── apiRoutes.ts        # API route definitions
│       ├── modules/            # Feature-based modules
│       │   ├── auth/           # Authentication
│       │   ├── elderly/        # Patient management
│       │   ├── falls/          # Fall detection
│       │   └── institution/    # Institution management
│       ├── middleware/         # Express middleware
│       └── utils/              # Utility functions
│
├── shared/                     # Shared TypeScript package
│   ├── package.json            # Shared package configuration
│   ├── tsconfig.json           # TypeScript configuration
│   └── src/                    # Shared source code
│       ├── entities/           # Database entity interfaces
│       ├── enums/              # Shared enumerations
│       ├── models/             # Data models
│       └── rest/               # API request/response types
│
└── public/                     # Static file serving
    └── uploads/                # User uploaded files
```

## 🔌 API Documentation

### Authentication

All API endpoints require authentication via JWT tokens, except for login and registration endpoints.

**Authentication Header:**
```
Authorization: Bearer <jwt_token>
```

### Key API Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout

#### User Management
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile

#### Elderly Management
- `GET /elderly/:elderlyId` - Get elderly patient details
- `POST /elderly/:elderlyId/medications` - Add medication
- `POST /elderly/:elderlyId/pathologies` - Add pathology
- `POST /elderly/:elderlyId/measurements` - Add health measurement

#### Fall Management
- `GET /fall-occurrences` - List fall occurrences
- `POST /elderly/:elderlyId/fall-occurrences` - Create fall occurrence
- `PUT /fall-occurrences/:occurrenceId` - Handle fall occurrence
- `GET /fall-occurrences/:occurrenceId` - Get fall occurrence details

#### Institution Management
- `GET /institutions/:institutionId/elderly` - List elderly patients
- `GET /institutions/:institutionId/staff` - List institution staff

### Request/Response Validation

All API requests and responses are validated using **Zod schemas** defined in the shared package. This ensures:

- **Type Safety**: Compile-time type checking
- **Runtime Validation**: Data validation at API boundaries
- **Consistent Data Structures**: Shared types between frontend and backend

Example Zod schema usage:
```typescript
import { CreateFallOccurrenceRequest } from 'moveplus-shared';

// Validate incoming request
const request = CreateFallOccurrenceRequest.safeParse(req.body);
if (!request.success) {
  return res.status(400).json({
    message: 'Invalid request data',
    errors: request.error.flatten(),
  });
}
```

### Development Guidelines

- Follow TypeScript best practices
- Use Zod schemas for data validation
- Maintain consistent code formatting
- Write meaningful commit messages
- Test all changes thoroughly
- Update documentation as needed