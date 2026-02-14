# Copilot Instructions - Espargne Retirement Planning Application

## Project Overview
Pure TypeScript SPA for US retirement planning with comprehensive financial simulations. All calculations run in the browser with no backend required.

## Tech Stack
- **React 19.2** with TypeScript 5.9
- **Vite 7.3** for dev server and production builds
- **big.js 7.0.1** for arbitrary precision financial calculations
- **Recharts 2.12.7** for interactive visualizations
- **CSS Modules** for component styling
- **localStorage API** for data persistence

## Architecture Overview

### Pure Client-Side Application
All retirement calculations happen in the browser:
- Tax calculations (2024 IRS brackets, LTCG/QD stacking, SSA taxation)
- RMD calculations (SECURE Act 2.0, IRS Uniform Lifetime Table)
- Multi-account withdrawal coordination
- Deterministic projections (30-year simulations)
- Monte Carlo analysis (1000+ stochastic runs)
- Chart data generation, CSV export, textual explanations

### Business Logic (`src/lib/`)
Complete financial calculation engine:
- `types.ts` - Core financial types
- `bigHelpers.ts` - Big.js utilities for precision arithmetic
- `taxCalculator.ts` - Federal tax calculations
- `rmdCalculator.ts` - Required Minimum Distributions
- `accounts/` - TaxableAccount, TraditionalAccount, RothAccount models
- `withdrawalCoordinator.ts` - Multi-account orchestration with 4 sequencing strategies
- `projectionEngine.ts` - Deterministic simulations
- `monteCarlo.ts` - Stochastic simulations with percentiles
- `chartDataBuilder.ts` - Transform results for Recharts
- `csvExport.ts` - Generate downloadable CSV
- `explanationGenerator.ts` - Human-readable analysis

## Architecture Principles

### Client-Side Data Model
Three primary data entities stored independently:
1. **User Profile** (`STORAGE_KEYS.USER_PROFILE`) - Birth year, filing status, retirement age
2. **Accounts** (`STORAGE_KEYS.ACCOUNTS`) - Array of retirement/taxable accounts with balances
3. **SSA Income** (`STORAGE_KEYS.SSA_INCOME`) - Social Security benefit planning data

Each persisted separately in localStorage for independent updates.

### Component Organization Pattern
Each account type follows consistent structure:
- Form component (e.g., `RothAccountForm.tsx`) handles creation/editing
- Type definition exported from form (e.g., `export type RothAccountData`)
- Parent `App.tsx` manages state and persistence
- Utility modules in [src/utils/](src/utils/) for export, validation, storage keys

### Form Visibility Toggle Pattern
```tsx
const [showRothForm, setShowRothForm] = useState(false);

// Button to show form
<button onClick={() => setShowRothForm(true)}>Add Roth Account</button>

// Conditional rendering
{showRothForm && <RothAccountForm onSave={handleSave} onCancel={() => setShowRothForm(false)} />}
```
Used consistently across all account types to avoid cluttered UI.

## Developer Workflows

### Development
```bash
pnpm install    # Install dependencies
pnpm dev        # Start Vite dev server on http://localhost:5174
pnpm build      # TypeScript check + production build
pnpm preview    # Preview production build locally
pnpm test       # Run 325 unit tests
```

### Testing
```bash
pnpm test run              # Run all tests once
pnpm test                  # Watch mode
pnpm test:ui               # UI for test results
pnpm test:coverage         # Coverage report
```

**325 tests** covering all business logic:
- 53 big.js helpers
- 34 tax calculator (validated against IRS)
- 44 RMD calculator
- 54 account models
- 27 withdrawal coordinator
- 25 projection engine
- 28 Monte Carlo
- 33 visualization/export
- 27 UI integration

### Data Import/Export
Users can export all data to JSON file and reimport later:
- Export button triggers [export.ts](src/utils/export.ts) `createExportFile()`
- Import validates version compatibility and structure via [validation.ts](src/utils/validation.ts)
- Export format includes version, timestamp, all entities

## Code Patterns & Conventions

### Big.js for Financial Calculations
**CRITICAL**: Always use Big.js for monetary values:
```typescript
import { toBig, add, multiply } from '../lib/bigHelpers';

// Correct
const balance = toBig(100000);
const growth = multiply(balance, 0.05);

// WRONG - Never use number for currency
const balance = 100000;
const growth = balance * 0.05;  // ❌ Floating-point errors
```

Convert to number **only** for display:
```typescript
import { toCurrency, toNumber } from '../lib/bigHelpers';

const displayValue = toCurrency(balance, 2);  // "100000.00"
const chartValue = toNumber(balance);         // 100000 (for Recharts)
```

### Account Type Discrimination
All accounts share common fields but type-discriminated via `accountType`:
```typescript
type Account = 
  | RothAccountData 
  | TraditionalAccountData 
  | TaxableAccountData 
  | RealEstateAccountData 
  | MortgageAccountData;

// Type guard pattern
if (account.accountType === 'roth') {
  // TypeScript narrows to RothAccountData
}
```

### localStorage Persistence Pattern
```typescript
// Initialize from localStorage
const [accounts, setAccounts] = useState<Account[]>(() => {
  const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
  return saved ? JSON.parse(saved) : [];
});

// Effect to sync state changes back to localStorage
useEffect(() => {
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
}, [accounts]);
```
Applied to all persisted entities. **No debouncing** - writes occur on every state change.

### Account List Rendering with Collapse
```tsx
const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});

const toggleCard = (accountId: string) => {
  setCollapsedCards(prev => ({ ...prev, [accountId]: !prev[accountId] }));
};

// In render
<div onClick={() => toggleCard(account.id)}>
  {!collapsedCards[account.id] && <AccountDetails account={account} />}
</div>
```
Tracks collapsed state per-account ID; used for both section headers and individual cards.

### Portfolio Summary Calculation
Real-time aggregation across all accounts:
```typescript
const totalRetirement = accounts
  .filter(a => ['roth', 'traditional'].includes(a.accountType))
  .reduce((sum, a) => sum + (a.currentBalance || 0), 0);

const totalTaxable = accounts
  .filter(a => a.accountType === 'taxable')
  .reduce((sum, a) => sum + (a.currentBalance || 0), 0);
```
Displayed in summary section, updates reactively on account changes.

### Form Callback Pattern
Forms receive callbacks for save and cancel actions:
```typescript
interface AccountFormProps {
  onSave: (data: AccountData) => void;
  onCancel: () => void;
  initialData?: AccountData;  // For editing existing
}
```
Parent handles state management and visibility toggling.

## Common Pitfalls

### Big.js Precision
- **Never mix Big and number** in arithmetic operations
- Always use `toBig()` before calculations
- Only convert to number for display/charting
- Use helper functions from bigHelpers.ts

### Financial Calculations
- RMDs don't apply to Roth IRAs (owner's lifetime)
- RMDs calculated on prior year-end balance
- Social Security up to 85% taxable based on combined income
- LTCG/QD use preferential rates, stack on top of ordinary income

### Data Migration on Schema Changes
- Export format includes `version` field for compatibility checks
- When adding new account types, update `Account` union type in types.ts
- Validate imported data structure before applying to state

### localStorage Limits
- Current approach has no size management
- Browser localStorage typically limited to 5-10MB
- Large portfolios with many accounts could approach limits
- Consider compression or IndexedDB migration if needed

### Account ID Uniqueness
- Account IDs currently use `Date.now()` or similar simple schemes
- **Not collision-safe** for rapid additions
- Consider UUID library if concurrency becomes issue

### TypeScript Strict Mode
- Project uses strict TypeScript (`strict: true`)
- Form data must explicitly handle undefined/null cases
- All number inputs need validation before Big conversion

## Key Files & Entry Points

- `src/App.tsx` - Main component, state management, persistence logic
- `src/components/ScenarioRunner.tsx` - Simulation control, runs calculations
- `src/lib/` - Complete financial calculation engine (see Architecture Overview)
- `src/utils/scenarioBuilder.ts` - Transform form data to Scenario type
- `src/utils/storage.ts` - localStorage key constants
- `src/tests/` - 325 comprehensive tests
- `.github/copilot-instructions.md` - This file
- `.github/instructions/CodingConventions.instructions.md` - Code style rules

## Deployment

Deploy as static site to any hosting provider:

```bash
pnpm build
# Deploy dist/ directory to Netlify, Vercel, GitHub Pages, S3, etc.
```

**Build output**: ~686KB (minified)  
**Requirements**: Node.js 20.19+ or 22.12+  
**Environment variables**: None (all calculation client-side)

## Performance

- Deterministic projections: <100ms (30 years)
- Monte Carlo (1000 runs): 1-3 seconds
- Consider Web Worker for Monte Carlo if UI blocks

## Node Version Requirement
Vite 7.3.1 requires Node.js 20.19+ or 22.12+. Check with:
```bash
node --version
```
