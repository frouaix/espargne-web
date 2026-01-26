# Espargne Frontend-Backend Integration

## Complete! ✅

All integration components have been created. Follow these steps to start using the full-stack application:

### 1. Install Dependencies

```bash
cd /Users/francoisrouaix/Documents/Repos/espargne-web
pnpm install
```

This will install the new dependency: **recharts** (for chart visualization)

### 2. Configure Environment

Create a `.env` file (optional - defaults work for local development):

```bash
cp .env.example .env
```

The default API URL is `http://localhost:8000`.

### 3. Start the Backend API Server

In a terminal:

```bash
cd /Users/francoisrouaix/Documents/Repos/espargne
python3 api/server.py
```

The server will start on `http://localhost:8000` with:
- API docs at http://localhost:8000/docs
- Health check at http://localhost:8000/health

### 4. Start the Frontend Dev Server

In another terminal:

```bash
cd /Users/francoisrouaix/Documents/Repos/espargne-web
pnpm dev
```

The frontend will start on `http://localhost:5173` (or 5174 if 5173 is busy).

### 5. Use the Application

1. **Configure your profile**: Fill in user profile information (age, filing status, etc.)
2. **Add accounts**: Create Roth, Traditional, and/or Taxable accounts
3. **Add SSA income** (optional): Configure Social Security benefits
4. **Run simulation**: Scroll to the "Run Retirement Simulation" section at the bottom
5. **Choose your output**:
   - **📈 View Charts** - Interactive visualizations of your retirement projection
   - **📄 View Analysis** - Comprehensive textual explanation with recommendations
   - **💾 Download CSV** - Export data for Excel analysis

## What Was Created

### New Files

#### Data Transformation Layer
- `src/utils/apiTransform.ts` - Converts frontend data → backend API format

#### API Service Layer
- `src/services/api.ts` - Fetch wrappers for all 3 API endpoints

#### React Components
- `src/components/ScenarioRunner.tsx` - Main simulation control panel
- `src/components/ProjectionChart.tsx` - Chart visualizations (Recharts)
- `src/components/ExplanationView.tsx` - Textual analysis display

#### Configuration
- `.env.example` - Environment variable template

### Modified Files
- `src/App.tsx` - Added ScenarioRunner integration
- `package.json` - Added recharts dependency

## Features

### Scenario Configuration
- **Withdrawal Rate**: 1% - 10% of initial portfolio
- **Withdrawal Strategy**: Taxable-first, Traditional-first, Roth-first, or Pro-rata
- **Real Return**: 0% - 15% (after inflation)
- **Projection Years**: 5 - 50 years

### Three Output Formats
1. **Interactive Charts**:
   - Portfolio balance over time (stacked area chart)
   - Total portfolio value trend
   - Annual income & taxes (bar chart)
   - Year-by-year details table

2. **CSV Export**:
   - Year-by-year income breakdown
   - Tax calculations
   - Account balances
   - Summary statistics
   - Excel-ready format

3. **Textual Explanation**:
   - Executive summary
   - Success probability analysis
   - Tax efficiency rating
   - Withdrawal strategy identification
   - Key milestones (RMD age, Medicare, account depletion)
   - Actionable recommendations

## Architecture

```
Frontend (espargne-web)                Backend (espargne)
┌─────────────────────┐               ┌──────────────────────┐
│   User Profile      │               │   FastAPI Server     │
│   + Accounts        │               │   (port 8000)        │
│   + SSA Income      │               │                      │
└──────────┬──────────┘               └──────────┬───────────┘
           │                                     │
           ▼                                     │
    ┌─────────────────┐                        │
    │ apiTransform.ts │                        │
    │ (Data Mapper)   │                        │
    └──────────┬──────┘                        │
               │                                 │
               ▼                                 │
        ┌──────────────┐                       │
        │  api.ts      │◄──────────────────────┘
        │ (API Client) │    HTTP POST /api/scenarios/*
        └──────┬───────┘
               │
               ▼
    ┌──────────────────────┐
    │  ScenarioRunner      │
    │  (UI Component)      │
    └──────────┬───────────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
┌─────────────┐  ┌──────────────┐
│Projection   │  │Explanation   │
│Chart        │  │View          │
└─────────────┘  └──────────────┘
```

## Next Steps (Optional Enhancements)

1. **Add Monte Carlo simulation UI** - Use `/api/scenarios/monte-carlo` endpoint
2. **Save/load scenarios** - Persist multiple scenario configurations
3. **Compare scenarios** - Side-by-side scenario comparison
4. **Advanced settings**:
   - IRMAA avoidance toggle
   - Custom inflation rate
   - Volatility for Monte Carlo
5. **Error boundary** - Better error handling UI
6. **Loading states** - Progress indicators for long-running projections
7. **Responsive design** - Mobile-friendly charts

## Troubleshooting

### Backend not responding
- Check backend is running: `curl http://localhost:8000/health`
- Check backend logs in terminal
- Verify port 8000 is not in use

### CORS errors
- Verify frontend is on port 5173 or 5174
- Check backend CORS settings in `api/server.py`

### Charts not displaying
- Verify recharts installed: `pnpm list recharts`
- Check browser console for errors
- Ensure projection returns valid data

### Type errors
- Run `pnpm build` to check TypeScript compilation
- Verify all new files compile successfully

## Testing the Integration

Quick test to verify everything works:

1. Start backend: `cd espargne && python3 api/server.py`
2. Start frontend: `cd espargne-web && pnpm dev`
3. Open http://localhost:5173
4. Create test profile:
   - Current age: 60
   - Retirement age: 65
   - Filing status: Single
5. Add account:
   - Traditional IRA: $500,000
6. Click "Run Retirement Simulation" → "View Charts"
7. Should see 30-year projection with charts

If you see charts and data, **integration is complete!** 🎉
