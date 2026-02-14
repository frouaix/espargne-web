# Withdrawal Coordinator

TypeScript implementation of the retirement withdrawal orchestrator, ported from the Python backend.

## Overview

The `WithdrawalCoordinator` class manages the complex task of planning withdrawals from multiple retirement accounts to meet income needs while optimizing for taxes and complying with IRS rules.

## Key Features

### 1. Multiple Withdrawal Sequencing Strategies

Four strategies are available to optimize withdrawal order:

#### TAXABLE_FIRST
- **Order**: Taxable → Traditional → Roth
- **Optimization**: Within taxable accounts, withdraws from lowest unrealized gains first
- **Use case**: Tax-efficient wealth preservation, minimizing LTCG taxes
- **Trade-off**: Maximizes Roth preservation, may increase Traditional RMDs later

#### TRADITIONAL_FIRST  
- **Order**: Traditional → Taxable → Roth
- **Optimization**: Depletes tax-deferred accounts first
- **Use case**: Maximize Roth compounding, reduce future RMDs
- **Trade-off**: Higher ordinary income taxes early in retirement

#### ROTH_FIRST
- **Order**: Roth → Taxable → Traditional
- **Optimization**: Preserves Traditional for RMD management
- **Use case**: Estate planning (Roth to heirs), tax bracket management
- **Trade-off**: Loses tax-free growth potential in Roth

#### PRO_RATA
- **Order**: Proportional from all accounts
- **Optimization**: Balanced depletion based on account values
- **Use case**: Diversified tax exposure, simplicity
- **Trade-off**: No specific tax optimization

### 2. RMD Enforcement

The coordinator automatically:
- Calculates Required Minimum Distributions for Traditional accounts
- Enforces RMDs regardless of sequencing strategy
- Uses IRS Uniform Lifetime Table (2022+)
- Applies SECURE Act 2.0 age thresholds:
  - Born before 1951: RMDs start at 72
  - Born 1951-1959: RMDs start at 73
  - Born 1960+: RMDs start at 75

**Important**: RMDs count toward withdrawal need, so if RMDs exceed your target income, you'll receive more than requested.

### 3. Social Security Integration

The `SSABenefitCalculator` handles:
- Early claiming adjustments (age 62-66): ~5.56% reduction per year
- Full Retirement Age benefit (age 67): 100% of FRA amount
- Delayed claiming credits (age 68-70): ~8% increase per year
- Automatic benefit calculation reduces withdrawal needs

### 4. Tax-Aware Planning

The coordinator:
- Aggregates income by type (ordinary, LTCG, qualified dividends, SSA)
- Calculates federal taxes using `FederalTaxCalculator`
- Accounts for:
  - Progressive ordinary income brackets
  - Preferential LTCG/QD rates (0%, 15%, 20%)
  - Social Security taxation (up to 85% taxable)
  - Standard deduction by filing status
  - MAGI calculation (for future IRMAA checks)

## Usage

### Basic Setup

```typescript
import { WithdrawalCoordinator } from './lib/withdrawalCoordinator';
import { TaxableAccount, TraditionalAccount, RothAccount } from './lib/accounts';
import { SequencingStrategy, FilingStatus } from './lib/types';

// Create accounts
const accounts = [
  new TaxableAccount('brokerage', 300000, 200000),
  new TraditionalAccount('trad-ira', 500000, 1960),
  new RothAccount('roth-ira', 200000),
];

// Define policy
const policy = {
  targetNetIncome: new Big(80000), // $80k after-tax income desired
  sequencingStrategy: SequencingStrategy.TAXABLE_FIRST,
  inflationAdjust: true,
  inflationRate: new Big(0.025), // 2.5% annual inflation
  avoidIRMAA: true,
};

// User profile
const userProfile = {
  birthYear: 1960,
  retirementAge: 65,
  filingStatus: FilingStatus.SINGLE,
};

// Social Security (optional)
const ssaIncome = {
  fraMonthlyBenefit: new Big(3000),
  claimingAge: 67,
};

// Initialize coordinator
const coordinator = new WithdrawalCoordinator({
  accounts,
  policy,
  ssaIncome,
  userProfile,
  startingYear: 2025,
  startingAge: 65,
});
```

### Single Year Planning

```typescript
const plan = coordinator.planYear(2025, 65, userProfile, ssaIncome);

console.log('Year:', plan.year);
console.log('Age:', plan.age);
console.log('Guaranteed Income (SSA):', plan.guaranteedIncome.toFixed(2));
console.log('Total Gross Income:', plan.totalGrossIncome.toFixed(2));
console.log('Estimated Taxes:', plan.totalTaxes.toFixed(2));
console.log('Net Income:', plan.totalNetIncome.toFixed(2));

// Account withdrawals
for (const [accountId, amount] of Object.entries(plan.accountWithdrawals)) {
  console.log(`  ${accountId}: $${amount.toFixed(2)}`);
}

// Ending balances
for (const [accountId, balance] of Object.entries(plan.accountBalances)) {
  console.log(`  ${accountId}: $${balance.toFixed(2)}`);
}
```

### Multi-Year Projection

```typescript
const projectionYears = 30;
const annualReturn = new Big(0.05); // 5% growth

for (let i = 0; i < projectionYears; i++) {
  const year = 2025 + i;
  const age = 65 + i;
  
  // Plan year
  const plan = coordinator.planYear(year, age, userProfile, ssaIncome);
  
  // Store or visualize results
  savePlanToDatabase(plan);
  
  // Apply growth for next year
  coordinator.applyGrowth(annualReturn);
  
  // Check for portfolio depletion
  if (coordinator.getPortfolioValue().lte(0)) {
    console.log(`Portfolio depleted at age ${age}`);
    break;
  }
}

// Review history
const history = coordinator.getWithdrawalHistory();
console.log(`Total taxes paid over ${history.length} years:`, 
  history.reduce((sum, p) => sum.plus(p.totalTaxes), new Big(0)).toFixed(2)
);
```

## Policy Configuration

### Target Net Income
```typescript
const policy = {
  targetNetIncome: new Big(100000), // Desired after-tax income
  sequencingStrategy: SequencingStrategy.TAXABLE_FIRST,
  inflationAdjust: true,
  inflationRate: new Big(0.03),
  avoidIRMAA: true,
};
```

- **inflationAdjust**: If true, target increases by inflationRate each year
- **Note**: Coordinator estimates gross need (simplified 25% tax assumption), then calculates actual taxes

### Withdrawal Rate (Safe Withdrawal Rate)
```typescript
const policy = {
  withdrawalRate: new Big(0.04), // 4% of portfolio annually
  sequencingStrategy: SequencingStrategy.PRO_RATA,
  inflationAdjust: false, // Rate is always % of current portfolio
  inflationRate: new Big(0.025),
  avoidIRMAA: true,
};
```

- Dynamically adjusts to portfolio value
- Natural inflation protection (if portfolio grows with inflation)
- Popular for perpetual portfolios

### Minimum Required Income Floor
```typescript
const policy = {
  minRequiredIncome: new Big(60000), // At least $60k gross per year
  minIncomeInflationRate: new Big(0.03), // Separate inflation for minimum
  sequencingStrategy: SequencingStrategy.TAXABLE_FIRST,
  inflationAdjust: false,
  inflationRate: new Big(0.025),
  avoidIRMAA: true,
};
```

- Ensures minimum gross income even if other policies would suggest less
- Useful for covering fixed expenses
- Can be combined with targetNetIncome or withdrawalRate (takes maximum)

## Advanced Features

### Inflation Adjustment

When `inflationAdjust: true`:
- Target net income grows by `inflationRate` each year
- Calculation: `adjustedTarget = targetNetIncome * (1 + inflationRate) ^ yearsElapsed`
- Year 0 (first year) uses base target
- Year 1: target * 1.025
- Year 2: target * 1.025²
- etc.

### Account-Level Growth

Apply different growth rates per account:
```typescript
// Instead of coordinator.applyGrowth(rate), apply individually
for (const [accountId, account] of coordinator.accounts) {
  if (account instanceof TaxableAccount) {
    account.applyGrowth(new Big(0.04)); // Conservative for taxable
  } else {
    account.applyGrowth(new Big(0.06)); // Aggressive for tax-advantaged
  }
}
coordinator.currentYear += 1;
coordinator.currentAge += 1;
```

### Custom Tax Calculator

Override default tax calculator:
```typescript
import { FederalTaxCalculator } from './lib/taxCalculator';

class Custom2025TaxCalculator extends FederalTaxCalculator {
  // Override bracket calculations for future tax law changes
}

const coordinator = new WithdrawalCoordinator({
  accounts,
  policy,
  userProfile,
  startingYear: 2025,
  startingAge: 65,
});

// Replace calculator
coordinator.taxCalculator = new Custom2025TaxCalculator();
```

## Limitations

### Not Yet Implemented

1. **IRMAA Threshold Management**
   - `avoidIRMAA: true` flag exists but not enforced
   - Would need withdrawal capping when approaching Medicare surcharge thresholds
   - 2-year lookback MAGI calculation required

2. **Tax Bracket Filling**
   - `TAX_BRACKET_OPTIMIZATION` strategy defined but not implemented
   - Would optimize Roth conversions and Traditional withdrawals to fill brackets

3. **Dividend Income**
   - `dividendIncome` field in plan but always 0
   - Need to model dividend yield on taxable accounts
   - Would reduce withdrawal needs like SSA

4. **State Taxes**
   - Only federal taxes calculated
   - State tax impact on strategy could be significant

5. **Roth Conversions**
   - Not modeled as a planning strategy
   - Would need separate conversion planning module

6. **Early Withdrawal Penalties**
   - 10% penalty for pre-59.5 withdrawals not enforced
   - Assumes all withdrawals are post-59.5

### Known Edge Cases

1. **Insufficient Funds**: Withdraws maximum available, may not meet target
2. **Negative Net Income**: Possible if taxes exceed gross (very high SSA, low withdrawals)
3. **Very Large Portfolios**: May hit IRMAA thresholds without mitigation
4. **Tax Estimate Iteration**: Uses simplified 25% estimate for net-to-gross conversion

## Testing

The withdrawal coordinator has comprehensive test coverage:

```bash
pnpm test withdrawalCoordinator
```

Test categories:
- Sequencing strategies (TAXABLE_FIRST, TRADITIONAL_FIRST, ROTH_FIRST, PRO_RATA)
- RMD enforcement at correct ages
- SSA income integration
- Tax calculations by account type
- Multi-year projections with growth
- Edge cases (insufficient funds, zero balances, high SSA)
- Inflation adjustments
- Withdrawal history tracking

## References

- **Python Source**: `espargne-core/models/strategies/withdrawal_coordinator.py`
- **IRS RMD Rules**: Publication 590-B
- **SSA Claiming**: https://www.ssa.gov/benefits/retirement/planner/agereduction.html
- **Tax Brackets**: IRS Publication 17 (2024)

## Future Enhancements

1. Monte Carlo simulation integration
2. Roth conversion optimizer
3. Tax-loss harvesting in taxable accounts
4. Charitable giving strategies (QCD from Traditional IRA)
5. Healthcare cost modeling (premiums, IRMAA, expenses)
6. Estate planning features (beneficiary RMDs)
7. Part-time work income sources
8. Rental property income
