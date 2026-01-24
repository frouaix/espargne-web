# Retirement Savings Calculator

A web application for managing and tracking retirement savings across multiple account types. Plan your retirement with comprehensive portfolio tracking, Social Security benefit planning, and data import/export capabilities.

## Features

- **User Profile Management**: Track birth year, filing status, and planned retirement age
- **Multiple Account Types**:
  - Roth IRA / 401(k) accounts
  - Traditional IRA / 401(k) accounts
  - Taxable brokerage accounts with cost basis tracking
- **Social Security Planning**: Input FRA monthly benefit and claiming age
- **Portfolio Summary**: Real-time calculation of total retirement and taxable account balances
- **Data Persistence**: Automatic localStorage persistence across browser sessions
- **Import/Export**: JSON-based data backup and restore with version compatibility checking
- **Data Management**: Clear all data functionality with confirmation dialog

## Technology Stack

- **React 19.2.0** with TypeScript 5.9.3
- **Vite 7.3.1** for fast development and optimized builds
- **CSS Modules** for component styling
- **localStorage API** for client-side data persistence

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+ (required by Vite 7.3.1)
- pnpm package manager

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

The development server will start on `http://localhost:5174` by default.

## Project Structure

```
src/
├── components/          # React form components
│   ├── UserProfileForm.tsx
│   ├── RothAccountForm.tsx
│   ├── TraditionalAccountForm.tsx
│   ├── TaxableAccountForm.tsx
│   ├── SSAIncomeForm.tsx
│   └── AccountsList.tsx
├── utils/              # Utility functions and types
│   ├── storage.ts      # Storage keys constants
│   ├── export.ts       # Export functionality and types
│   └── validation.ts   # Data validation functions
├── App.tsx             # Main application component
├── App.css             # Application styles
└── main.tsx            # Application entry point
```

## Data Storage

All data is stored locally in the browser using the localStorage API:
- User profile data
- Account information (balances, types, cost basis)
- Social Security benefit information

Data persists across browser sessions until explicitly cleared by the user.

## Import/Export Format

Data can be exported to and imported from JSON files with the following structure:

```json
{
  "version": "1.0.0",
  "exportedAt": "2026-01-23T00:00:00.000Z",
  "userProfile": { /* user data */ },
  "accounts": [ /* account array */ ],
  "ssaIncome": { /* SSA data */ }
}
```

Version compatibility checks ensure imported data matches the application version (major version must match).

## Coding Conventions

This project follows strict coding conventions defined in `.github/instructions/CodingConventions.instructions.md`:
- Semicolons required for all statements
- Commas in type and enum declarations
- Explicit return types for all functions
- Destructuring preferred over direct property access
- Utility functions separated into feature-specific files
- No inline CSS styles (use CSS classes)
- No console.log statements in production code

## License

This project is private and not licensed for public use.
