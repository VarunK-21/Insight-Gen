# Project Handbook - Insight Gen

## 📊 Project Summary

**Insight Gen** is a persona-driven analytics application that transforms raw CSV/Excel datasets into intelligent insights and visualizations. It's a **frontend-only** application that runs entirely in the browser, using each user's own OpenAI API key for AI-powered analysis.

### Core Value Proposition
- **No Backend Required**: Everything runs in the browser
- **User Privacy**: API keys stored locally, never sent to our servers
- **Intelligent Analysis**: AI generates context-aware insights based on data structure
- **Production-Grade**: Advanced analytics with statistical validation

---

## 🏗️ Architecture

### **Frontend-Only Architecture**

**Why Frontend-Only?**
- **Privacy**: User API keys never leave their browser
- **Cost**: No server costs, no API key management
- **Simplicity**: No backend infrastructure to maintain
- **Scalability**: Each user's browser handles their own requests

**Trade-offs:**
- ✅ Pros: Privacy, cost-effective, simple deployment
- ⚠️ Cons: No cross-device sync, limited by browser storage

### **Technology Stack**

#### **Core Framework**
- **React 18** + **TypeScript**: Modern, type-safe UI development
- **Vite**: Fast build tool and dev server (faster than Create React App)
- **React Router**: Client-side routing for SPA navigation

#### **Styling & UI**
- **Tailwind CSS**: Utility-first CSS framework (faster development)
- **shadcn/ui**: High-quality, accessible component library
- **Radix UI**: Unstyled, accessible primitives (used by shadcn)

#### **Data Visualization**
- **Recharts**: React charting library (bar, line, pie, scatter, area charts)
- **xlsx**: Excel file parsing (reads .xlsx and .csv files)

#### **AI Integration**
- **OpenAI API**: Direct API calls from browser (user's API key)
- **Structured JSON Output**: LLM returns structured analytical intent

#### **State Management**
- **React Hooks**: useState, useMemo, useCallback for local state
- **localStorage**: User profiles, API keys, saved analyses, cache

---

## 🔄 Workflow and Pipeline

### **1. Data Upload & Cleaning**
- User uploads CSV/Excel file
- **dataCleaning.ts** processes raw data:
  - Removes duplicates
  - Handles null values
  - Detects column types (numeric, text, date, boolean)
  - Calculates statistics (mean, median, stdDev, outliers)

### **2. LLM Analysis**
- **api.ts** sends cleaned data to OpenAI
- System prompt includes:
  - Persona context (accountant, engineer, etc.)
  - Data cleaning report
  - Column statistics
  - Chart validation rules
- LLM returns structured JSON with insights and chart specifications

### **3. Analytical Intent Processing**
- **analyticalIntent.ts** extracts structured intent from LLM response
- **metricBinding.ts** ensures correct metric column selection
- **chartValidation.ts** validates chart specifications
- Prevents semantic drift (title matches variables, aggregation matches type)

### **4. Advanced Analytics**
- **advancedAnalytics.ts** calculates:
  - Confidence intervals (95% CI for averages)
  - Median vs mean comparison (skewness detection)
  - Outlier detection (IQR method)
- Warnings shown when data is skewed or has outliers

### **5. Chart Rendering**
- **ChartsTab.tsx** generates chart data from raw dataset
- Uses Recharts to render interactive visualizations
- Shows statistical warnings and enhanced tooltips

---

## 📈 Project Status

### **✅ Completed Features**

1. **Data Processing**
   - CSV/Excel upload and parsing
   - Automatic data cleaning
   - Column type detection
   - Statistical analysis

2. **AI Analysis**
   - Persona-driven insights
   - Structured chart generation
   - Analytical intent validation
   - Metric binding (prevents count hijacking)

3. **Visualization**
   - Multiple chart types (bar, line, pie, scatter, area)
   - Interactive tooltips
   - Statistical warnings
   - Confidence intervals

4. **User Management**
   - Local authentication
   - Profile management
   - API key storage
   - Saved analyses history

5. **Advanced Analytics**
   - Confidence intervals
   - Skewness detection
   - Outlier detection
   - Median comparison

### **🚀 Recent Improvements**

1. **Pipeline Integrity** (Major Milestone)
   - Removed fallback logic that corrupted metrics
   - Analytical intent is now immutable source of truth
   - Fail-fast validation prevents silent errors

2. **Metric Binding Fix**
   - Title extraction for metric columns
   - Explicit metric declaration required
   - Prevents count from hijacking actual metrics

3. **Advanced Statistics**
   - Automatic confidence interval calculation
   - Skewness detection and warnings
   - Outlier identification

---

## 💼 Market Usefulness

### **Target Users**
- **Business Analysts**: Quick insights from data without SQL/Python
- **Data Scientists**: Rapid exploratory data analysis
- **Managers**: Understand data without technical expertise
- **Students**: Learn data analysis concepts

### **Competitive Advantages**
1. **No Backend**: Privacy-first, cost-effective
2. **AI-Powered**: Context-aware insights, not just basic charts
3. **Production-Grade**: Statistical validation, not just pretty charts
4. **Persona-Driven**: Insights tailored to user role

### **Market Position**
- **vs Tableau/Power BI**: Simpler, AI-powered, no installation
- **vs Python/R**: No coding required, instant results
- **vs Excel**: Automated insights, not just manual analysis

---

## 🎯 Features

### **Core Features**
1. **File Upload**: CSV/Excel support with automatic parsing
2. **Data Cleaning**: Removes duplicates, handles nulls, detects types
3. **Persona Selection**: Common, Accountant, Engineer, Policy, Custom
4. **AI Analysis**: Generates insights, patterns, and chart suggestions
5. **Interactive Charts**: Bar, line, pie, scatter, area with tooltips
6. **Statistical Warnings**: Alerts for skewed data or outliers
7. **Saved Analyses**: Local storage of analysis history
8. **API Key Management**: Secure local storage of OpenAI keys

### **Advanced Features**
1. **Confidence Intervals**: Shows uncertainty in averages
2. **Skewness Detection**: Warns when median is better than mean
3. **Outlier Detection**: Identifies and flags outliers
4. **Metric Binding**: Ensures correct metric column selection
5. **Chart Validation**: Prevents misleading visualizations

---

## 🔮 Future Improvements

### **Short-Term (Next Sprint)**
1. **Error Bars**: Visual representation of confidence intervals
2. **Export Charts**: Download charts as PNG/SVG
3. **Data Export**: Export cleaned data as CSV
4. **More Chart Types**: Heatmaps, box plots, histograms

### **Medium-Term (Next Quarter)**
1. **Weighted Averages**: Support for weighted aggregations
2. **Statistical Tests**: T-tests, ANOVA for group comparisons
3. **Time Series Analysis**: Trend detection, seasonality
4. **Correlation Matrix**: Visual correlation analysis

### **Long-Term (Future)**
1. **Cloud Sync**: Optional cloud storage for analyses
2. **Collaboration**: Share analyses with team members
3. **Custom Models**: Support for other LLM providers
4. **API Integration**: Connect to databases, APIs

---

## ⚠️ Potential Cons and Fixes

### **Current Limitations**

1. **No Cross-Device Sync**
   - **Issue**: Data stored locally, not synced across devices
   - **Fix**: Optional cloud storage (future feature)
   - **Workaround**: Export/import analyses manually

2. **Browser Storage Limits**
   - **Issue**: localStorage has ~5-10MB limit
   - **Fix**: Implement IndexedDB for larger datasets
   - **Current**: Large datasets are sampled (500 rows max)

3. **API Key Security**
   - **Issue**: API keys stored in localStorage (accessible to scripts)
   - **Fix**: Consider browser extension for secure storage
   - **Current**: User responsibility (never share browser)

4. **No Real-Time Collaboration**
   - **Issue**: Single-user only
   - **Fix**: Cloud sync + sharing features (future)

5. **Limited Chart Customization**
   - **Issue**: Charts use default styling
   - **Fix**: Add theme customization, color picker

### **Technical Debt**

1. **Large Bundle Size**: 1.3MB+ JavaScript
   - **Fix**: Code splitting, lazy loading
   - **Priority**: Medium

2. **No Unit Tests**: Limited test coverage
   - **Fix**: Add tests for critical functions
   - **Priority**: High

3. **Error Handling**: Basic error messages
   - **Fix**: Better error boundaries, user-friendly messages
   - **Priority**: Medium

---

## 🛠️ Development Setup

### **Prerequisites**
- Node.js 18+ and npm
- Git

### **Installation**
```bash
npm install
```

### **Development**
```bash
npm run dev
```
Opens at `http://localhost:5173`

### **Build**
```bash
npm run build
```
Outputs to `dist/` folder

### **Deploy**
```bash
npm run deploy
```
Deploys to GitHub Pages

---

## 📚 Documentation

- **CHART_GENERATION_LOGIC.md**: Complete chart generation pipeline
- **ANALYTICAL_INTENT_ARCHITECTURE.md**: Intent layer architecture
- **PIPELINE_INTEGRITY_MILESTONE.md**: Pipeline integrity achievements
- **ADVANCED_ANALYTICS_IMPLEMENTATION.md**: Statistical features
- **EDGE_CASE_TEST_PLAN.md**: Testing strategy
- **CODEBASE_EXPLANATION.md**: File-by-file code explanation

---

## 🎓 Key Learnings

1. **Structured Intent > Free Text**: Structured JSON prevents semantic drift
2. **Fail Fast > Silent Fallback**: Errors should be visible, not hidden
3. **Immutable Intent**: Once validated, intent should not change
4. **Pipeline Integrity**: Every stage must respect the contract
5. **Statistical Rigor**: Charts need validation, not just pretty visuals

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Production Ready ✅
