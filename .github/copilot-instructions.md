# Copilot Instructions - Retirement Savings Calculator Web App

## Project Overview
React + TypeScript web application for managing retirement account portfolios and Social Security planning. Client-side only with localStorage persistence. Companion to the Python-based `espargne` calculation engine (separate repository).

## Tech Stack
- **React 19.2** with TypeScript 5.9
- **Vite 7.3** for dev server and production builds
- **CSS Modules** for component styling
- **localStorage API** for data persistence (no backend)

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
```

### Data Import/Export
Users can export all data to JSON file and reimport later:
- Export button triggers [export.ts](src/utils/export.ts) `createExportFile()`
- Import validates version compatibility and structure via [validation.ts](src/utils/validation.ts)
- Export format includes version, timestamp, all entities

## Code Patterns & Conventions

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

### Data Migration on Schema Changes
- Export format includes `version` field for compatibility checks
- When adding new account types, update `Account` union type in [export.ts](src/utils/export.ts)
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
- All number inputs need validation before Decimal/number conversion

## Key Files & Entry Points

- [src/App.tsx](src/App.tsx) - Main component, state management, persistence logic
- [src/components/](src/components/) - All form components (account types, user profile, SSA income)
- [src/utils/export.ts](src/utils/export.ts) - Export data structure and file download
- [src/utils/validation.ts](src/utils/validation.ts) - Import validation, schema checks
- [src/utils/storage.ts](src/utils/storage.ts) - localStorage key constants
- [vite.config.ts](vite.config.ts) - Vite configuration (React plugin only)

## Styling Approach
- CSS Modules for component-scoped styles
- Global styles in [src/index.css](src/index.css) and [src/App.css](src/App.css)
- No CSS framework (custom styles throughout)
- Responsive design not prioritized (desktop-first approach)

## Future Integration Points
This frontend is designed to work with Python calculation engine in `espargne` repository:
- Export JSON format **should align** with Python model schemas
- Future: POST user data to calculation API for scenario simulations
- Current: Standalone portfolio tracking only, no projections yet

## Node Version Requirement
Vite 7.3.1 requires Node.js 20.19+ or 22.12+. Check with:
```bash
node --version
```
