# Visualization Modules - TypeScript Port

## Overview

Successfully ported 3 Python visualization and export utilities to TypeScript. These modules transform `ProjectionResult` data into user-facing outputs: charts, CSV files, and human-readable explanations.

## Modules Created

### 1. `chartDataBuilder.ts`
**Purpose**: Transform projection results into Recharts-compatible format

**Key Function**: `buildChartData(result: ProjectionResult): ChartDataset`

**Features**:
- Aggregates account withdrawals by type (taxable, traditional, roth)
- Aggregates account balances by type
- Converts Big.js values to numbers for charting
- Provides max income/wealth for axis scaling
- Includes sample data generator for testing

**Data Output**:
- Year, age
- Income sources: socialSecurity, taxableWithdrawal, traditionalWithdrawal, rothWithdrawal
- Taxes (negative for display below X-axis)
- Balance by account type: taxableBalance, traditionalBalance, rothBalance, totalPortfolio

### 2. `csvExport.ts`
**Purpose**: Generate CSV file content from projection results

**Key Function**: `generateCSV(result: ProjectionResult, scenarioName: string): string`

**Features**:
- Header row with scenario name
- Column headers for all data fields
- Year-by-year data rows with 2 decimal precision
- Summary statistics section (total taxes, withdrawals, portfolio change, success)
- Filename generator with timestamp
- Browser download trigger function

**CSV Format**:
```
Retirement Projection: {scenarioName}

Year,Age,Social Security,Taxable Withdrawal,...
2025,65,36000.00,20000.00,...

Summary Statistics
Total Years,30
Total Federal Taxes Paid,150000.00
...
Success,Yes
```

### 3. `explanationGenerator.ts`
**Purpose**: Generate human-readable analysis of projection

**Key Function**: `generateExplanation(result: ProjectionResult): ExplanationResult`

**Features**:
- Executive summary with portfolio trajectory
- Success/failure analysis with sustainability metrics
- Tax efficiency rating (Excellent/Good/Fair/Poor)
- Withdrawal strategy identification
- Key milestone detection (RMD, Medicare, account depletion)
- Actionable recommendations

**Analysis Sections**:
- `summary`: High-level overview
- `successAnalysis`: Portfolio sustainability
- `taxAnalysis`: Effective tax rate, efficiency rating
- `withdrawalAnalysis`: Strategy pattern, source breakdown
- `keyMilestones`: Age-based events, account depletions
- `recommendations`: Tax optimization, portfolio adjustments

**Calculations**:
- Effective tax rate: totalTaxes / totalGrossIncome
- Tax efficiency: Excellent (<5%), Good (5-10%), Fair (10-15%), Poor (>15%)
- Portfolio trajectory: growing/stable/declining
- Withdrawal strategy from usage patterns

## Testing

Created comprehensive test suites:
- `chartDataBuilder.test.ts` - 9 tests for data transformation
- `csvExport.test.ts` - 9 tests for CSV generation and formatting
- `explanationGenerator.test.ts` - 9 tests for explanation sections
- `visualizationIntegration.test.ts` - 6 integration tests

**Test Coverage**:
- Single-year and multi-year projections
- Account type aggregation
- Successful and failed scenarios
- Tax efficiency ratings
- Milestone detection
- Recommendation generation

**All 325 tests pass** ✅

## Key Design Decisions

### Big.js Usage
- All financial calculations use Big.js for precision
- Convert to number only at display boundary (charts)
- Use `toNumber()` from `bigHelpers` for consistency

### Account Type Inference
- Infers type from account ID naming conventions:
  - "taxable" or "brokerage" → Taxable
  - "trad", "401k", "ira" (not "roth") → Traditional
  - "roth" → Roth
  - Unknown → defaults to Traditional

### Type Safety
- Uses `type` imports for TypeScript types
- Follows `verbatimModuleSyntax` requirement
- Explicit return types on all functions

### Number Formatting
- CSV: 2 decimal places (e.g., "36000.00")
- Text: thousands separators (e.g., "$36,000")
- Percentages: 1-2 decimal places (e.g., "4.5%")

## Usage Examples

### Chart Data
```typescript
import { buildChartData } from './lib/chartDataBuilder';

const chartData = buildChartData(projectionResult);
// Use chartData.dataPoints with Recharts
// Use chartData.maxIncome for Y-axis domain
```

### CSV Export
```typescript
import { generateCSV, downloadCSV, generateCSVFilename } from './lib/csvExport';

const csv = generateCSV(projectionResult, 'My Scenario');
const filename = generateCSVFilename('My Scenario');
downloadCSV(csv, filename); // Triggers browser download
```

### Explanation
```typescript
import { generateExplanation, formatExplanationAsText } from './lib/explanationGenerator';

const explanation = generateExplanation(projectionResult);
console.log(explanation.summary);
console.log(explanation.recommendations);

// Or get full formatted text
const text = formatExplanationAsText(explanation);
```

## Differences from Python

1. **No dataclasses** - Uses TypeScript interfaces instead
2. **Type-only imports** - Required by `verbatimModuleSyntax`
3. **Number formatting** - Uses `toLocaleString()` instead of Python's f-strings
4. **No StringIO** - Builds CSV as string directly
5. **Browser download** - Added `downloadCSV()` function for web usage

## Integration Points

These modules work with existing types in `types.ts`:
- `ProjectionResult` - Main input type
- `WithdrawalPlan` - Year-by-year data
- `ChartDataset`, `ChartDataPoint` - Chart output types

Ready for integration with:
- React components for chart visualization
- CSV export buttons
- Explanation display panels
- API endpoints that return formatted output

## Next Steps

To use these modules in the UI:
1. Import into `ScenarioRunner` component
2. Call `buildChartData()` and pass to `ProjectionChart`
3. Add CSV export button that calls `downloadCSV()`
4. Display explanation in collapsible panel
5. Consider adding explanation API endpoint for backend generation
