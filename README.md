# Espargne - Retirement Planning Application

[![Deploy to GitHub Pages](https://github.com/frouaix/espargne-web/actions/workflows/deploy.yml/badge.svg)](https://github.com/frouaix/espargne-web/actions/workflows/deploy.yml)

A pure TypeScript SPA for US retirement planning with comprehensive financial simulations. All calculations run in the browser with no backend required.

**🚀 [Live Demo](https://frouaix.github.io/espargne-web/)** | **📖 [Documentation](https://github.com/frouaix/espargne-web)** | **⚖️ [MIT License](LICENSE)**

## ⚠️ DISCLAIMER

**THIS SOFTWARE IS PROVIDED FOR EDUCATIONAL AND INFORMATIONAL PURPOSES ONLY.**

- **NOT FINANCIAL ADVICE**: This application does NOT provide financial, investment, tax, or legal advice.
- **NO WARRANTIES**: The software is provided "AS IS" without any warranties or guarantees of accuracy.
- **USE AT YOUR OWN RISK**: Any decisions you make based on this tool are entirely your own responsibility.
- **CONSULT PROFESSIONALS**: Always consult with qualified financial advisors, tax professionals, and legal counsel before making retirement planning decisions.
- **NO LIABILITY**: The authors and contributors accept NO LIABILITY for any financial losses, damages, or consequences arising from the use of this software.

Tax laws, retirement regulations, and financial markets are complex and constantly changing. This tool uses simplified models that may not accurately represent your specific situation.

---

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

### Branch Protection

The `main` branch is protected with the following rules:
- ✅ **Required CI/CD checks**: Deployment workflow must pass before merge
- 🚫 **Force pushes blocked**: Git history is protected
- 🚫 **Branch deletion blocked**: Main branch cannot be deleted
- 👤 **Admin bypass available**: Owner can override in emergencies

This ensures code quality while maintaining development velocity for solo maintenance.

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

## Important Disclaimers & Limitations

### Not Financial Advice
This application is a **planning tool only** and does not constitute professional financial, investment, tax, or legal advice. The calculations and projections are simplified models that cannot account for the full complexity of:
- Individual financial circumstances
- Tax law nuances and state-specific regulations
- Market volatility and economic conditions
- Changes in legislation (e.g., tax brackets, RMD ages, Social Security rules)
- Personal risk tolerance and goals

### Known Limitations
- **Federal taxes only** - State and local taxes not modeled
- **Simplified tax calculations** - Does not model all deductions, credits, or phase-outs
- **No early withdrawal penalties** - Assumes withdrawals after age 59.5
- **IRMAA not fully implemented** - Medicare surcharge avoidance strategy incomplete
- **Fixed assumptions** - Uses simplified models for inflation, returns, and expenses
- **No estate planning** - Does not model inheritance, trusts, or estate taxes
- **Social Security estimates** - Based on user input, not actual SSA records

### Your Responsibility
- **Verify all inputs** - Garbage in, garbage out
- **Review outputs carefully** - Check calculations against other tools
- **Consult professionals** - CPA, CFP®, or financial advisor before making decisions
- **Update regularly** - Tax laws and regulations change frequently
- **Understand limitations** - This is not a substitute for professional advice

### No Warranties
This software is provided "AS IS" under the MIT License, WITHOUT WARRANTY OF ANY KIND, express or implied. The authors accept NO LIABILITY for financial losses, missed opportunities, or other damages resulting from use of this software.

**By using this application, you acknowledge that you understand these limitations and accept full responsibility for your financial decisions.**

## License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2026 François Rouaix
