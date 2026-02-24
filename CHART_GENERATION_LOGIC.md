# Complete Chart Generation Logic

This document explains the entire pipeline from dataset upload to rendered charts.

---

## 📊 **Overview: End-to-End Flow**

```
Dataset Upload → Data Cleaning → LLM Analysis → Intent Validation → Metric Binding → Chart Rendering
```

---

## 🔄 **Phase 1: Dataset Upload & Initialization**

### **Location**: `src/pages/Dashboard.tsx`

**Flow:**
1. User uploads CSV/Excel file or selects sample dataset
2. File is parsed into `string[][]` format (rows and columns)
3. Data stored in React state: `data: string[][]`
4. User selects persona (common, accountant, engineer, policy, custom)
5. User clicks "Analyze" button

**Key Functions:**
- `handleFileSelect()` - Processes uploaded file
- `handleSampleSelect()` - Loads sample dataset
- `handleAnalyze()` - Triggers analysis pipeline

---

## 🧹 **Phase 2: Data Cleaning & Preprocessing**

### **Location**: `src/lib/dataCleaning.ts`

**Purpose**: Clean, normalize, and analyze raw data before LLM processing

**Process:**

1. **Column Type Detection** (`detectColumnType()`)
   - Analyzes sample values to determine: `numeric`, `text`, `date`, `boolean`, `mixed`
   - Uses pattern matching and statistical analysis

2. **Value Cleaning** (`cleanValue()`)
   - Removes control characters
   - Strips currency symbols (`$`, `€`, `£`, `¥`, `₹`)
   - Removes commas from numbers
   - Normalizes boolean values (`yes/no` → `true/false`)

3. **Statistical Analysis** (`calculateStats()`)
   - For numeric columns: calculates `min`, `max`, `mean`, `median`, `stdDev`
   - Detects outliers (values > 3 standard deviations from mean)
   - Counts null values and unique values

4. **Data Cleaning** (`cleanAndPrepareData()`)
   - Removes empty rows
   - Removes duplicate rows
   - Handles null values (replaces with empty string or default)
   - Flags outliers
   - Generates `CleaningReport` with statistics

**Output:**
```typescript
{
  cleanedData: string[][],      // Cleaned dataset
  report: CleaningReport,         // Cleaning statistics
  columnStats: Record<string, ColumnStats>  // Per-column statistics
}
```

---

## 🤖 **Phase 3: LLM Analysis**

### **Location**: `src/lib/api.ts` → `analyzeDataset()`

**Purpose**: Generate insights, patterns, and chart specifications using OpenAI API

### **3.1 Cache Check**
- Generates dataset hash using FNV-1a algorithm
- Checks localStorage cache for existing analysis
- If cached, returns immediately (no API call)

### **3.2 Persona Selection**
- Loads persona-specific prompt from `PERSONA_PROMPTS`
- Custom personas use user-defined analytical focus
- Persona affects insight generation style

### **3.3 System Prompt Construction**

**Key Components:**

1. **Persona Context** - Analytical perspective (common, accountant, engineer, etc.)

2. **Data Cleaning Report** - Informs LLM about data quality:
   ```
   - Original rows: X
   - Cleaned rows: Y
   - Duplicates removed: Z
   - Outliers flagged: N
   ```

3. **Column Statistics** - For each column:
   ```
   - Column name (type): X unique values
   - Range: min to max, Mean: X, Median: Y
   - WARNING: N outliers detected
   ```

4. **Sample Data** - First 20 rows for context

5. **Chart Validation Rules** - Critical constraints:
   - Title-variable consistency
   - Aggregation type rules (data-type aware)
   - Relationship chart requirements
   - Axis label accuracy
   - Variable mapping rules

6. **Analytical Intent Structure** - Forces LLM to output structured JSON:
   ```json
   {
     "insight_text": "...",
     "analysis_type": "comparison" | "distribution" | "relationship" | "trend" | "correlation",
     "metric": {
       "column": "exact_column_name",
       "aggregation": "avg" | "sum" | "count" | "median" | "min" | "max",
       "display_name": "..."
     },
     "group_by": ["column_name"],
     "relationship_variables": {
       "independent": "x_axis_column",
       "dependent": "y_axis_column"
     },
     "chart_type": "bar" | "line" | "pie" | "scatter" | "area" | "table",
     "expected_output": "..."
   }
   ```

### **3.4 API Call**
- Endpoint: `https://api.openai.com/v1/chat/completions`
- Model: User-selected (default: `gpt-5-chat-latest`)
- Temperature: `0.2` (strict mode) or `0.7` (normal mode)
- Max tokens: `4000`

### **3.5 Response Parsing**
- Extracts JSON from response (removes markdown code blocks)
- Validates structure
- Falls back to default views if parsing fails

**Output:**
```typescript
{
  dataSummary: string[],
  patterns: string[],
  insights: string[],
  dashboardViews: DashboardView[],  // Chart specifications
  cleaningNotes: string[],
  warning?: string
}
```

---

## 🔍 **Phase 4: Column Metadata Building**

### **Location**: `src/lib/analyticalIntent.ts` → `buildColumnMetadata()`

**Purpose**: Create explicit column type definitions with allowed aggregations

**Process:**

1. **Type Classification**
   - `continuous` - Numeric with many unique values (e.g., `age`, `revenue`)
   - `ordinal` - Numeric with limited unique values (e.g., `education-num`, `rating`)
   - `categorical` - Text with limited unique values (e.g., `status`, `category`)
   - `text` - Free-form text
   - `boolean` - True/false values
   - `date` - Date values

2. **Role Assignment**
   - `is_metric_variable` - Can be aggregated (numeric columns)
   - `is_grouping_variable` - Can be used for grouping (categorical/ordinal)

3. **Allowed Aggregations**
   - `continuous`: `['avg', 'sum', 'count', 'median', 'min', 'max']`
   - `ordinal`: `['avg', 'median', 'count', 'sum']` (can average numeric ordinals)
   - `categorical`: `['count']` only
   - `text`: `['count']` only
   - `boolean`: `['count']` only

**Output:**
```typescript
Record<string, ColumnMetadata>  // Column name → metadata mapping
```

---

## 🎯 **Phase 5: Analytical Intent Processing**

### **Location**: `src/lib/api.ts` → `analyzeDataset()` (lines 628-784)

**Purpose**: Extract, validate, and fix analytical intent for each chart

### **5.1 Intent Extraction**

For each `dashboardView`:

1. **If LLM provided `analyticalIntent`**:
   - Use it directly
   - Normalize `group_by` to ensure it's an array

2. **If no intent provided** (fallback):
   - Use `extractIntentFromText()` to parse from title/purpose
   - Infer metric, aggregation, and grouping from text

### **5.2 Metric Binding** ⚠️ **CRITICAL STEP**

**Location**: `src/lib/metricBinding.ts` → `bindMetricColumn()`

**Purpose**: Ensure correct metric column and aggregation are selected

**Priority Order:**

1. **Explicit Intent** (Highest Priority)
   - If `intent.metric.column` exists and is valid → use it

2. **Title Extraction** (Second Priority) ⭐ **NEW**
   - `extractMetricFromTitle()` parses title patterns:
     - "Average X by Y" → metric = "X", aggregation = "avg"
     - "Total X by Y" → metric = "X", aggregation = "sum"
     - "X by Y" → metric = "X" (infer aggregation from context)

3. **Variable Checking**
   - Check if any variable is a valid metric column
   - Exclude grouping variables

4. **Keyword Ranking** (Fallback)
   - `rankMetricColumns()` scores numeric columns by:
     - Keyword match (amount, revenue, sales, etc.)
     - Variance (higher variance = more likely metric)
     - Magnitude (larger values = more likely metric)

5. **First Available Numeric Column**
   - Use first continuous/ordinal column if nothing else works

6. **Count as Last Resort**
   - Only if `analysis_type === 'distribution'` OR no numeric metric exists

**Key Function:**
```typescript
bindMetricColumn(
  intent,           // Current intent (may have missing metric)
  variables,        // Chart variables
  columnMetadata,   // Column type definitions
  title,            // Chart title
  insightText       // Chart purpose/description
) → { column: string, aggregation: 'sum' | 'avg' | 'count' | ... }
```

### **5.3 Metric Binding Validation**

**Location**: `src/lib/metricBinding.ts` → `validateMetricBinding()`

**Purpose**: Catch and fix count hijacking

**Checks:**

1. **Title-Aggregation Mismatch**
   - Title says "Average" but aggregation is "count" → force "avg"
   - Title says "Total" but aggregation is "count" → force "sum"

2. **Numeric Metric Using Count**
   - If metric is numeric and title doesn't say "count" → prefer "sum"/"avg"

3. **Amount/Revenue Keywords**
   - If title mentions amount/revenue/sales → must use "sum", not "count"

**Output:**
```typescript
{
  isValid: boolean,
  errors: string[],
  fixedMetric?: { column: string, aggregation: string }
}
```

### **5.4 Analytical Intent Validation**

**Location**: `src/lib/analyticalIntent.ts` → `validateAnalyticalIntent()`

**Purpose**: Ensure intent is logically correct

**Checks:**

1. **Metric Column Exists**
   - Column must exist in dataset
   - Must be a valid metric variable (numeric)

2. **Aggregation Allowed**
   - Check if aggregation is in `columnMetadata[metric].aggregation_allowed`
   - Auto-fix if invalid (use context-aware aggregation)

3. **Grouping Variables Valid**
   - `group_by` columns must exist
   - Must be categorical/ordinal (grouping variables)

4. **Relationship Variables**
   - If `analysis_type === 'relationship'` → must have `relationship_variables`
   - Both independent and dependent must exist

5. **Chart Type Consistency**
   - `analysis_type` must match `chart_type`
   - Example: "relationship" → "scatter" or "bar"

**Output:**
```typescript
{
  isValid: boolean,
  errors: string[],
  fixedIntent?: AnalyticalIntent
}
```

### **5.5 Title Regeneration**

**Location**: `src/lib/analyticalIntent.ts` → `generateTitleFromIntent()`

**Purpose**: Generate title from structured intent to prevent drift

**Logic:**
- `aggregation + metric.column + "by" + group_by[0]`
- Example: `avg(age)` grouped by `salary` → "Average Age by salary"
- Prevents double words ("Total Total", "Average Average")
- Ensures title matches actual aggregation

### **5.6 View Updates**

After validation, update `dashboardView`:
- `view.title` = regenerated from intent
- `view.aggregation` = intent.metric.aggregation
- `view.variables` = [group_by[0], metric.column]
- `view.chartType` = intent.chart_type
- `view.analyticalIntent` = validated intent (stored for rendering)

---

## ✅ **Phase 6: Structural Chart Validation**

### **Location**: `src/lib/chartValidation.ts` → `validateChartViews()`

**Purpose**: Final structural checks before rendering

**Validations:**

1. **Title-Variable Consistency**
   - Keywords in title must match variables
   - "X by Y" pattern must have X and Y in variables

2. **Aggregation Type Rules**
   - Categorical data → count only
   - Ordinal data → count or median (avg allowed for numeric ordinals)
   - Continuous data → avg, sum, count, etc.

3. **Relationship Chart Requirements**
   - Pie charts cannot show relationships (need 2+ variables)
   - Scatter plots must have relationship_variables

4. **Axis Label Accuracy**
   - Labels must match actual data being plotted

5. **Variable Mapping**
   - Variables must exist in dataset
   - Correct order (X-axis, Y-axis)

**Output:**
```typescript
{
  validViews: DashboardView[],    // Passed validation
  invalidViews: DashboardView[]   // Failed (filtered out)
}
```

---

## 🎨 **Phase 7: Chart Data Generation**

### **Location**: `src/components/dashboard/tabs/ChartsTab.tsx` → `generateChartData()`

**Purpose**: Transform raw data into chart-ready format

### **7.1 Special Handling: Scatter Plots**

If `chartType === 'scatter'` AND `analyticalIntent.relationship_variables` exists:

1. Find column indices for `independent` and `dependent` variables
2. Sample data (up to 1000 points for performance)
3. Extract raw values (no aggregation)
4. Filter out invalid values (NaN, Infinity)
5. Return array of `{ x: number, y: number }` points

**Key Point**: Scatter plots use RAW data, not aggregated data.

### **7.2 Standard Aggregation (Bar, Line, Pie, Area)**

1. **Column Index Resolution**
   - Find indices for `variables[0]` (label/X-axis) and `variables[1]` (value/Y-axis)
   - Fallback to first text/numeric columns if not found

2. **Data Sampling**
   - Sample up to 500 rows for performance
   - Use step sampling for large datasets

3. **Aggregation Logic**

   ```typescript
   aggregated: Record<string, { sum: number, count: number, values: number[] }>
   ```

   For each row:
   - Extract label (from label column)
   - Extract value (from value column, parse as number)
   - Group by label
   - Accumulate: `sum += value`, `count++`, `values.push(value)`

4. **Final Value Calculation**

   Based on `aggregation`:
   - `'count'` → `count`
   - `'avg'` → `sum / count`
   - `'sum'` → `sum`
   - `'median'` → median of `values` array
   - `'min'` → min of `values` array
   - `'max'` → max of `values` array

5. **Data Cleaning**
   - Filter out invalid labels (`?`, `null`, `undefined`, empty)
   - Filter out invalid values (NaN, Infinity)
   - Limit to top 10 items (for cleaner charts)
   - Sort by value (descending) for bar/pie charts

**Output:**
```typescript
[
  { name: "Category A", value: 123.45, count: 10, fullName: "Category A" },
  { name: "Category B", value: 98.76, count: 8, fullName: "Category B" },
  ...
]
```

---

## 🖼️ **Phase 8: Chart Rendering**

### **Location**: `src/components/dashboard/tabs/ChartsTab.tsx` → `renderChart()`

**Purpose**: Render chart using Recharts library

### **8.1 Chart Type Selection**

Based on `view.chartType`:

1. **Bar Chart** (`'bar'`)
   - `<BarChart>` with `<Bar>` component
   - X-axis: categories (from `variables[0]`)
   - Y-axis: aggregated values
   - Color: Teal gradient

2. **Line Chart** (`'line'`)
   - `<LineChart>` with `<Line>` component
   - Shows trends over ordered categories
   - Smooth curve

3. **Pie Chart** (`'pie'`)
   - `<PieChart>` with `<Pie>` component
   - Shows distribution/proportions
   - Color-coded segments

4. **Scatter Plot** (`'scatter'`)
   - `<ScatterChart>` with `<Scatter>` component
   - X-axis: independent variable (raw values)
   - Y-axis: dependent variable (raw values)
   - Each point = one data row

5. **Area Chart** (`'area'`)
   - `<AreaChart>` with `<Area>` component
   - Shows cumulative/stacked trends

6. **Table** (`'table'`)
   - HTML table with aggregated data
   - Sortable columns

### **8.2 Axis Labels**

- **X-Axis**: `view.xAxisLabel` or `variables[0]` or "Category"
- **Y-Axis**: Generated from aggregation:
  - `count` → "Count"
  - `avg` → "Average {metric.column}"
  - `sum` → "Total {metric.column}"

### **8.3 Tooltip Formatting**

- Large numbers: `1.2M` (millions), `1.5K` (thousands)
- Shows aggregation type (Count, Average, Total)
- Custom styling (dark theme)

### **8.4 Chart Metadata Display**

Below each chart:
```
X-Axis: {xAxisLabel} • Y-Axis: {yAxisLabel} • Aggregated by {aggregation}
```

---

## 🔄 **Complete Flow Diagram**

```
┌─────────────────┐
│  Dataset Upload │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Data Cleaning  │ → Remove duplicates, handle nulls, detect types
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cache Check    │ → Check localStorage for existing analysis
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  LLM Analysis   │ → Generate insights + chart specs (with analyticalIntent)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Build Metadata  │ → Create column type definitions
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Extract Intent  │ → Get analyticalIntent from LLM or parse from text
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Metric Binding  │ → ⚠️ CRITICAL: Ensure correct metric + aggregation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validate Intent │ → Check metric exists, aggregation allowed, etc.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Regenerate Title│ → Generate title from intent (prevent drift)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Chart Validation│ → Structural checks (title-variable consistency, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate Data   │ → Aggregate raw data into chart format
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Render Chart    │ → Display using Recharts
└─────────────────┘
```

---

## 🎯 **Key Design Principles**

### **1. Explicit Over Implicit**
- LLM must explicitly declare `metric.column` in `analyticalIntent`
- No guessing - if missing, extract from title or fail

### **2. Single Source of Truth**
- `analyticalIntent` is the contract between insight and visualization
- Title, aggregation, variables derived from intent
- Prevents semantic drift

### **3. Fail Fast, Fix Automatically**
- Validation catches errors early
- Auto-fix when possible (e.g., wrong aggregation → correct it)
- Filter out invalid charts if unfixable

### **4. Data-Type Aware**
- Different aggregations for different column types
- Categorical → count only
- Continuous → avg, sum, count, etc.
- Ordinal → avg allowed (if numeric)

### **5. Context-Aware Metric Binding**
- Title extraction prioritizes explicit declarations
- Keyword matching as fallback
- Count only for distributions or when no numeric metric exists

---

## 🐛 **Common Issues & Fixes**

### **Issue 1: Count Hijacking**
**Problem**: System uses `count` instead of `avg`/`sum` for numeric metrics

**Fix**: 
- Title extraction (`extractMetricFromTitle()`)
- Metric binding validation (`validateMetricBinding()`)
- Explicit metric declaration in LLM prompt

### **Issue 2: Title Drift**
**Problem**: Title doesn't match actual aggregation

**Fix**:
- Title regeneration from intent (`generateTitleFromIntent()`)
- Prevents "Total Total" or "Average Average"

### **Issue 3: Wrong Metric Column**
**Problem**: Using categorical column as metric

**Fix**:
- Column metadata validation (`validateAnalyticalIntent()`)
- Metric binding prioritizes numeric columns

### **Issue 4: Scatter Plot Aggregation**
**Problem**: Scatter plots showing aggregated data instead of raw points

**Fix**:
- Special handling in `generateChartData()` for scatter plots
- Uses `relationship_variables` to extract raw data

---

## 📝 **Summary**

The chart generation pipeline is a **multi-stage validation and transformation system** that:

1. **Cleans** raw data
2. **Analyzes** with LLM to generate insights
3. **Validates** analytical intent (metric, aggregation, grouping)
4. **Binds** metrics explicitly (prevents count hijacking)
5. **Generates** chart data (aggregates raw data)
6. **Renders** charts (using Recharts)

The key innovation is the **Analytical Intent Layer** - a structured JSON contract that ensures consistency between insights, chart specifications, and rendered visualizations. This prevents semantic drift and ensures analytically correct charts.
