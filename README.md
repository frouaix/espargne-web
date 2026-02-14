# Espargne - Retirement Planning Application

A pure TypeScript SPA for US retirement planning with comprehensive financial simulations. All calculations run in the browser with no backend required.

## Features

### Portfolio Management
- **User Profile Management**: Birth year, filing status, planned retirement age
- **Multiple Account Types**:
  - Roth IRA / 401(k) accounts (tax-free withdrawals, no RMDs)
  - Traditional IRA / 401(k) accounts (tax-deferred, RMD compliance)
  - Taxable brokerage accounts (cost basis tracking, LTCG treatment)
- **Social Security Planning**: FRA benefit and claiming age adjustments
- **Data Persistence**: Automatic localStorage persistence
- **Import/Export**: JSON backup and restore with version compatibility

### Financial Simulations
- **Deterministic Projections**: 30-year retirement simulations with fixed returns
- **Monte Carlo Analysis**: 1000+ stochastic runs with percentile outcomes
- **Withdrawal Strategies**: Taxable-first, Traditional-first, Roth-first, Pro-rata
- **Tax Calculations**: 2024 IRS brackets, LTCG/QD stacking, Social Security taxation
- **RMD Enforcement**: SECURE Act 2.0 compliant with IRS Uniform Lifetime Table
- **Chart Visualizations**: Interactive balance and income charts
- **CSV Export**: Excel-ready projection data
- **Textual Analysis**: Human-readable explanations with recommendations

## Technology Stack

- **React 19.2.0** with TypeScript 5.9.3
- **Vite 7.3.1** for fast development and optimized builds
- **big.js 7.0.1** for arbitrary precision financial calculations
- **Recharts 2.12.7** for interactive charts
- **CSS Modules** for component styling
- **localStorage API** for client-side data persistence

**No backend required** - All financial calculations run in the browser.

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
├── components/              # React UI components
│   ├── UserProfileForm.tsx
│   ├── *AccountForm.tsx     # Roth, Traditional, Taxable, Real Estate, Mortgage
│   ├── SSAIncomeForm.tsx
│   ├── ScenarioRunner.tsx   # Simulation control and results
│   ├── ProjectionChart.tsx  # Recharts visualizations
│   └── ExplanationView.tsx  # Textual analysis display
├── lib/                     # Financial calculation engine
│   ├── types.ts             # Core financial types
│   ├── bigHelpers.ts        # Big.js utilities
│   ├── taxCalculator.ts     # Federal tax calculations
│   ├── rmdCalculator.ts     # Required Minimum Distributions
│   ├── accounts/            # Account models (Taxable, Traditional, Roth)
│   ├── withdrawalCoordinator.ts  # Multi-account orchestration
│   ├── projectionEngine.ts  # Deterministic simulations
│   ├── monteCarlo.ts        # Stochastic simulations
│   ├── chartDataBuilder.ts  # Chart data transformation
│   ├── csvExport.ts         # CSV generation
│   └── explanationGenerator.ts  # Human-readable analysis
├── utils/                   # UI utilities
│   ├── scenarioBuilder.ts   # Form data → Scenario transformation
│   ├── storage.ts           # localStorage keys
│   ├── export.ts            # Data export
│   └── validation.ts        # Input validation
├── tests/                   # Test suites (325 tests)
├── App.tsx                  # Main application
└── main.tsx                 # Entry point
```

## Data & Privacy

All data is stored **locally in the browser** using the localStorage API:
- User profile data
- Account information (balances, types, cost basis)
- Social Security benefit information

**Privacy Guarantee**: Financial data never leaves your browser. All calculations happen client-side with no server transmission.

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

## Testing

Run the comprehensive test suite:

```bash
pnpm test run
```

**325 tests** covering:
- big.js helpers (53 tests)
- Tax calculator (34 tests) - validated against IRS examples
- RMD calculator (44 tests) - SECURE Act 2.0 compliant
- Account models (54 tests)
- Withdrawal coordinator (27 tests)
- Projection engine (25 tests)
- Monte Carlo (28 tests)
- Visualization & export (33 tests)
- UI integration (27 tests)

## Architecture

This is a **pure client-side application**. All retirement calculations run in the browser using:
- **big.js** for arbitrary precision decimal arithmetic (no floating-point errors)
- **TypeScript** for type safety and code quality
- **IRS-compliant calculations** for taxes, RMDs, and Social Security

See `.github/copilot-instructions.md` for detailed architecture documentation.

## Deployment

Deploy as a static site to any hosting provider:

```bash
pnpm build
# Deploy dist/ directory to Netlify, Vercel, S3, etc.
```

**Build output**: ~686KB (minified, includes all business logic)

## Coding Conventions

This project follows strict conventions defined in `.github/instructions/CodingConventions.instructions.md`:
- Semicolons required for all statements
- Explicit return types for all functions
- Big.js for all monetary calculations (never use `number` for currency)
- Destructuring preferred over direct property access
- No inline CSS styles
- No console.log in production code

## License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2026 François Rouaix
