# Edge Case Test Plan

This document outlines specific test cases to verify the system handles edge cases correctly without fallback corruption.

---

## 🧪 **Test Case 1: Multiple Numeric Metrics**

### **Test Dataset**
```csv
Region,Revenue,Cost,Profit,Discount,Quantity
North,10000,7000,3000,500,100
South,12000,8000,4000,600,120
East,15000,9000,6000,700,150
West,8000,6000,2000,400,80
```

### **Test Scenarios**

#### **Scenario 1.1: Revenue Analysis**
**Input**: "Total Revenue by Region"

**Expected `analyticalIntent`:**
```json
{
  "metric": {
    "column": "Revenue",
    "aggregation": "sum"
  },
  "group_by": ["Region"]
}
```

**Expected Chart:**
- X-axis: Region
- Y-axis: Total Revenue
- Aggregation: `sum`
- Values: 10000, 12000, 15000, 8000

**Validation:**
- ✅ Metric column = "Revenue" (not "Cost" or "Profit")
- ✅ Aggregation = "sum" (not "avg" or "count")
- ✅ No fallback to wrong metric

---

#### **Scenario 1.2: Cost Analysis**
**Input**: "Average Cost by Region"

**Expected `analyticalIntent`:**
```json
{
  "metric": {
    "column": "Cost",
    "aggregation": "avg"
  },
  "group_by": ["Region"]
}
```

**Expected Chart:**
- X-axis: Region
- Y-axis: Average Cost
- Aggregation: `avg`
- Values: 7000, 8000, 9000, 6000

**Validation:**
- ✅ Metric column = "Cost" (not "Revenue")
- ✅ Aggregation = "avg" (not "sum" or "count")

---

#### **Scenario 1.3: Profit Margin**
**Input**: "Profit by Region"

**Expected `analyticalIntent`:**
```json
{
  "metric": {
    "column": "Profit",
    "aggregation": "sum"
  },
  "group_by": ["Region"]
}
```

**Expected Chart:**
- X-axis: Region
- Y-axis: Total Profit
- Aggregation: `sum`
- Values: 3000, 4000, 6000, 2000

**Validation:**
- ✅ Metric column = "Profit" (explicitly chosen, not guessed)
- ✅ Aggregation = "sum" (for totals)

---

### **Failure Modes to Check**
- ❌ System defaults to "first numeric column" (Revenue) for all charts
- ❌ Metric binding fails and falls back to count
- ❌ Wrong metric selected (e.g., "Cost" when "Revenue" intended)

---

## 🧪 **Test Case 2: Ambiguous Metric Names**

### **Test Dataset**
```csv
Category,Value,Score,Index,Rating,Level
A,85,92,7,4.5,3
B,90,88,8,4.2,4
C,75,95,6,4.8,2
D,88,90,9,4.0,5
```

### **Test Scenarios**

#### **Scenario 2.1: "Value" Metric**
**Input**: "Average Value by Category"

**Expected `analyticalIntent`:**
```json
{
  "metric": {
    "column": "Value",
    "aggregation": "avg"
  },
  "group_by": ["Category"]
}
```

**Validation:**
- ✅ Metric column = "Value" (exact match, not "Score" or "Index")
- ✅ Title extraction correctly identifies "Value" from "Average Value"

---

#### **Scenario 2.2: "Score" Metric**
**Input**: "Total Score by Category"

**Expected `analyticalIntent`:**
```json
{
  "metric": {
    "column": "Score",
    "aggregation": "sum"
  },
  "group_by": ["Category"]
}
```

**Validation:**
- ✅ Metric column = "Score" (not "Value" or "Index")
- ✅ Aggregation = "sum" (from "Total")

---

#### **Scenario 2.3: "Index" Metric**
**Input**: "Index by Category"

**Expected `analyticalIntent`:**
```json
{
  "metric": {
    "column": "Index",
    "aggregation": "avg" // or "sum" depending on context
  },
  "group_by": ["Category"]
}
```

**Validation:**
- ✅ Metric column = "Index" (exact match)
- ✅ No confusion with "Value" or "Score"

---

### **Failure Modes to Check**
- ❌ Title extraction picks wrong column (e.g., "Value" → selects "Score")
- ❌ Metric binding fails due to ambiguous name
- ❌ System falls back to first numeric column

---

## 🧪 **Test Case 3: No Numeric Columns**

### **Test Dataset**
```csv
Status,Category,Name,Description
Active,Electronics,Product A,High quality
Inactive,Clothing,Product B,Standard quality
Active,Food,Product C,Premium quality
Pending,Electronics,Product D,Basic quality
```

### **Test Scenarios**

#### **Scenario 3.1: Distribution Chart**
**Input**: "Status Distribution"

**Expected `analyticalIntent`:**
```json
{
  "analysis_type": "distribution",
  "metric": {
    "column": "Status",
    "aggregation": "count"
  },
  "group_by": ["Status"],
  "chart_type": "pie"
}
```

**Expected Chart:**
- Type: Pie chart
- Aggregation: `count` only
- Values: Count of each status

**Validation:**
- ✅ Only `count` aggregation allowed
- ✅ Chart type = "pie" or "bar" (distribution)
- ✅ No attempt to use "avg" or "sum"

---

#### **Scenario 3.2: Category Count**
**Input**: "Category Count by Status"

**Expected `analyticalIntent`:**
```json
{
  "analysis_type": "comparison",
  "metric": {
    "column": "Category",
    "aggregation": "count"
  },
  "group_by": ["Status"],
  "chart_type": "bar"
}
```

**Validation:**
- ✅ Aggregation = "count" (only option)
- ✅ No numeric aggregation attempted

---

#### **Scenario 3.3: Invalid Request**
**Input**: "Average Status by Category"

**Expected Behavior:**
- ❌ `validateAnalyticalIntent()` should reject
- ❌ Error: "Cannot use avg aggregation on categorical column 'Status'"
- ❌ Chart should not be generated

**Validation:**
- ✅ Validation catches invalid aggregation
- ✅ System fails gracefully (no chart generated)
- ✅ Error message is clear

---

### **Failure Modes to Check**
- ❌ System attempts to use "avg" on categorical data
- ❌ Silent fallback to count without validation
- ❌ Chart generated with invalid aggregation

---

## 🧪 **Test Case 4: Time Series + Multiple Metrics**

### **Test Dataset**
```csv
Date,Revenue,Cost,Profit,Quantity
2024-01-01,10000,7000,3000,100
2024-01-02,12000,8000,4000,120
2024-01-03,15000,9000,6000,150
2024-01-04,8000,6000,2000,80
2024-01-05,11000,7500,3500,110
```

### **Test Scenarios**

#### **Scenario 4.1: Revenue Trend**
**Input**: "Revenue Trend Over Time"

**Expected `analyticalIntent`:**
```json
{
  "analysis_type": "trend",
  "metric": {
    "column": "Revenue",
    "aggregation": "sum"
  },
  "group_by": ["Date"],
  "chart_type": "line"
}
```

**Expected Chart:**
- X-axis: Date
- Y-axis: Revenue
- Type: Line chart
- Aggregation: `sum` (total revenue per day)

**Validation:**
- ✅ Time column correctly identified
- ✅ Metric = "Revenue" (not "Cost" or "Profit")
- ✅ Aggregation = "sum" (for totals over time)

---

#### **Scenario 4.2: Average Cost by Month**
**Input**: "Average Cost by Month"

**Expected `analyticalIntent`:**
```json
{
  "analysis_type": "trend",
  "metric": {
    "column": "Cost",
    "aggregation": "avg"
  },
  "group_by": ["Date"], // Grouped by month
  "chart_type": "line"
}
```

**Validation:**
- ✅ Metric = "Cost" (not "Revenue")
- ✅ Aggregation = "avg" (for averages)
- ✅ Time grouping works correctly

---

#### **Scenario 4.3: Profit Over Time**
**Input**: "Profit Over Time"

**Expected `analyticalIntent`:**
```json
{
  "analysis_type": "trend",
  "metric": {
    "column": "Profit",
    "aggregation": "sum"
  },
  "group_by": ["Date"],
  "chart_type": "line"
}
```

**Validation:**
- ✅ Metric = "Profit" (explicitly chosen)
- ✅ Time series correctly rendered
- ✅ Correct metric used (not defaulting to first numeric)

---

### **Failure Modes to Check**
- ❌ Wrong metric selected (e.g., "Cost" when "Revenue" intended)
- ❌ Time column not recognized
- ❌ Aggregation mismatch (e.g., "count" instead of "sum")

---

## 🧪 **Test Case 5: Column Name Variations**

### **Test Dataset**
```csv
Age Group,Income Level,Education Num,Capital Gain
18-25,Low,12,0
26-35,Medium,14,1000
36-45,High,16,5000
46-55,Medium,13,2000
```

### **Test Scenarios**

#### **Scenario 5.1: Hyphenated Names**
**Input**: "Average Capital Gain by Age Group"

**Expected Behavior:**
- ✅ Column matching handles hyphens: "Capital Gain" vs "capital-gain"
- ✅ Case-insensitive matching works
- ✅ Metric = "Capital Gain" (or "capital-gain")

**Validation:**
- ✅ Column resolution works with hyphens
- ✅ No fallback due to name mismatch

---

#### **Scenario 5.2: Space vs Hyphen**
**Input**: "Average Education Num by Income Level"

**Expected Behavior:**
- ✅ Handles "Education Num" vs "education-num"
- ✅ Partial matching works if needed

**Validation:**
- ✅ Column found despite naming differences
- ✅ No silent failure

---

## 📋 **Test Execution Checklist**

### **Pre-Test Setup**
- [ ] Clear cache to ensure fresh analysis
- [ ] Use strict mode (temperature = 0.2)
- [ ] Enable console logging for debugging

### **For Each Test Case**
- [ ] Upload test dataset
- [ ] Trigger analysis
- [ ] Check console logs for metric binding
- [ ] Verify `analyticalIntent` in response
- [ ] Inspect rendered chart
- [ ] Verify aggregation matches intent
- [ ] Verify metric column matches intent
- [ ] Check for any fallback warnings

### **Success Criteria**
- ✅ All charts use correct metric column
- ✅ All aggregations match intent
- ✅ No fallback logic triggered
- ✅ No count hijacking
- ✅ Fail-fast on invalid configurations

### **Failure Indicators**
- ❌ Console warnings about fallback
- ❌ Wrong metric column in chart
- ❌ Wrong aggregation (especially count when should be avg/sum)
- ❌ Silent failures (charts not rendered without error)

---

## 🐛 **Debugging Commands**

### **Check Intent in Console**
```javascript
// In browser console after analysis
const views = insights.dashboardViews;
views.forEach((view, idx) => {
  console.log(`Chart ${idx}:`, {
    title: view.title,
    intent: view.analyticalIntent,
    variables: view.variables,
    aggregation: view.aggregation
  });
});
```

### **Verify Column Resolution**
```javascript
// Check if columns are found correctly
const headers = data[0];
const metricCol = view.analyticalIntent.metric.column;
const found = headers.find(h => h.toLowerCase() === metricCol.toLowerCase());
console.log('Metric column found:', found);
```

---

## 📊 **Expected Results Summary**

| Test Case | Metric Column | Aggregation | Should Pass |
|-----------|--------------|-------------|-------------|
| Multiple Metrics - Revenue | Revenue | sum | ✅ |
| Multiple Metrics - Cost | Cost | avg | ✅ |
| Ambiguous - Value | Value | avg | ✅ |
| Ambiguous - Score | Score | sum | ✅ |
| No Numeric - Status | Status | count | ✅ |
| Time Series - Revenue | Revenue | sum | ✅ |
| Time Series - Cost | Cost | avg | ✅ |
| Hyphenated Names | Capital Gain | avg | ✅ |

---

**Status**: Ready for testing

Run these test cases to verify pipeline integrity holds under edge conditions.
