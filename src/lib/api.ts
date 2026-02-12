import { cleanAndPrepareData, CleaningReport, ColumnStats } from "@/lib/dataCleaning";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const API_KEY_STORAGE = "insight_weaver_openai_key";
const MODEL_STORAGE = "insight_weaver_openai_model";
const STRICT_MODE_STORAGE = "insight_weaver_strict_mode";
const ANALYSIS_CACHE_PREFIX = "insight_gen_analysis_cache_v1";
const RECOMMENDATION_CACHE_PREFIX = "insight_gen_reco_cache_v1";
const DEFAULT_MODEL = "gpt-5-chat-latest";

interface CustomPersona {
  name: string;
  description: string;
  analyticalFocus: string;
  customPrompt?: string;
}

interface AnalysisRequest {
  data: string[][];
  persona: string;
  customPersona?: CustomPersona;
}

export type { CleaningReport, ColumnStats };

interface DashboardView {
  title: string;
  purpose: string;
  chartType: 'line' | 'bar' | 'scatter' | 'table' | 'pie';
  variables: string[];
  aggregation?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export interface AnalysisResult {
  dataSummary: string[];
  patterns: string[];
  insights: string[];
  dashboardViews: DashboardView[];
  cleaningNotes?: string[];
  warning?: string;
  cleaningReport: CleaningReport;
  columnStats: Record<string, ColumnStats>;
}

export interface RecommendationResult {
  persona: string;
  kpis: string[];
}

function fnv1aHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function canonicalizeData(data: string[][]): string {
  return data
    .map((row) => row.map((cell) => String(cell ?? "").trim()).join("\u001f"))
    .join("\u001e");
}

export function getDatasetHash(data: string[][]): string {
  return fnv1aHash(canonicalizeData(data));
}

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore localStorage quota errors and continue without cache.
  }
}

function inferLikelyPersonaFromHeaders(headers: string[]): string | null {
  const joined = headers.join(" ").toLowerCase();
  if (/(revenue|profit|margin|expense|invoice|ledger|balance|cost)/.test(joined)) return "accountant";
  if (/(user|session|retention|feature|conversion|churn|engagement)/.test(joined)) return "product_manager";
  if (/(regulation|legal|contract|claim|penalty|compliance|policy)/.test(joined)) return "lawyer";
  if (/(latency|uptime|throughput|error|incident|cpu|memory|system)/.test(joined)) return "engineer";
  if (/(experiment|variance|correlation|model|score|prediction)/.test(joined)) return "data_scientist";
  if (/(region|sales|customer|market|segment|campaign)/.test(joined)) return "business";
  return null;
}

const PERSONA_PROMPTS: Record<string, string> = {
  common: `You are analyzing data from the perspective of a Common Citizen.
How this persona thinks:
- Cares about daily life impact, jobs, prices, fairness, trust
- Thinks in cause-and-effect terms, not statistics
- Focuses on "why this affects people like me"
- Is skeptical of policy claims and wants tangible outcomes

Tone: Simple, grounded, human, relatable
Avoid: Technical jargon, statistical language, abstract theory`,
  accountant: `You are analyzing data from the perspective of a Chartered Accountant.
How this persona thinks:
- Focuses on risk, compliance, predictability, and financial stability
- Cares about long-term impact on businesses and capital
- Looks for volatility, consistency, and governance-related exposure
- Thinks in terms of balance sheets, incentives, and accountability

Tone: Professional, precise, structured
Avoid: Emotional framing, oversimplified explanations`,
  engineer: `You are analyzing data from the perspective of a Systems Engineer.
How this persona thinks:
- Views the dataset as a system with inputs, delays, and feedback loops
- Looks for inefficiencies, bottlenecks, and lag effects
- Cares about structure, dependencies, and failure points
- Comfortable with abstract reasoning

Tone: Analytical, neutral, logical
Avoid: Emotional framing, policy rhetoric`,
  policy: `You are analyzing data from the perspective of a Policy Strategist.
How this persona thinks:
- Focuses on prioritization and sequencing
- Asks "what lever matters most?"
- Cares about feasibility, timing, and unintended consequences
- Thinks in trade-offs, not absolutes

Tone: Strategic, balanced, decision-oriented
Avoid: Overconfidence, deterministic claims`,
  lawyer: `You are analyzing data from the perspective of a Legal Advisor.
How this persona thinks:
- Focuses on regulatory compliance and legal risk exposure
- Looks for patterns that could indicate liability or contractual issues
- Cares about documentation, precedent, and due diligence
- Thinks in terms of risk mitigation and legal defensibility

Tone: Cautious, thorough, evidence-based
Avoid: Speculation, definitive statements without evidence`,
  business: `You are analyzing data from the perspective of a Business Analyst.
How this persona thinks:
- Focuses on revenue drivers, market trends, and competitive positioning
- Looks for growth opportunities and operational efficiencies
- Cares about ROI, market share, and customer behavior
- Thinks in terms of business metrics and strategic value

Tone: Results-oriented, strategic, actionable
Avoid: Technical implementation details, non-business considerations`,
  data_scientist: `You are analyzing data from the perspective of a Data Scientist.
How this persona thinks:
- Focuses on statistical significance, correlations, and predictive patterns
- Looks for data quality issues, biases, and modeling opportunities
- Cares about reproducibility, accuracy, and feature engineering
- Comfortable with uncertainty quantification and hypothesis testing

Tone: Technical, precise, methodological
Avoid: Overgeneralization, causation claims without evidence`,
  product_manager: `You are analyzing data from the perspective of a Product Manager.
How this persona thinks:
- Focuses on user behavior, feature adoption, and product-market fit
- Looks for user pain points, engagement patterns, and growth opportunities
- Cares about prioritization, user value, and roadmap implications
- Thinks in terms of user stories and product outcomes

Tone: User-centric, pragmatic, prioritization-focused
Avoid: Technical implementation complexity, non-user considerations`,
};

export function getStoredApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE);
}

export function getStoredModel(): string {
  return localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL;
}

export function setStoredApiKey(value: string): void {
  localStorage.setItem(API_KEY_STORAGE, value.trim());
}

export function setStoredModel(value: string): void {
  localStorage.setItem(MODEL_STORAGE, value.trim());
}

export function clearStoredModel(): void {
  localStorage.removeItem(MODEL_STORAGE);
}

export function getStrictMode(): boolean {
  return localStorage.getItem(STRICT_MODE_STORAGE) === "true";
}

export function setStrictMode(enabled: boolean): void {
  localStorage.setItem(STRICT_MODE_STORAGE, enabled ? "true" : "false");
}

function requestApiKey(): string {
  const key = window.prompt("Enter your OpenAI API key (stored locally in this browser):");
  if (!key) throw new Error("Missing OpenAI API key.");
  setStoredApiKey(key);
  return key.trim();
}

function getApiKey(): string {
  return getStoredApiKey() || requestApiKey();
}

export async function analyzeDataset(request: AnalysisRequest): Promise<AnalysisResult> {
  if (!request.data || request.data.length < 2) {
    throw new Error("Invalid dataset: requires at least headers and one data row");
  }

  const { cleanedData, report, columnStats } = cleanAndPrepareData(request.data);
  const headers = cleanedData[0];
  const rows = cleanedData.slice(1);
  const sampleRows = rows.slice(0, 20);
  const datasetHash = getDatasetHash(cleanedData);

  let personaPrompt = PERSONA_PROMPTS[request.persona] || PERSONA_PROMPTS.common;
  if (request.persona === "custom" && request.customPersona) {
    const custom = request.customPersona;
    personaPrompt = `You are analyzing data from the perspective of: ${custom.name}

Description: ${custom.description}

Analytical Focus: ${custom.analyticalFocus}

${custom.customPrompt ? `Additional Instructions: ${custom.customPrompt}` : ""}

Approach: Tailor all insights, patterns, and recommendations specifically to this persona's needs and interests.`;
  }

  const cleaningInfo = `Data Cleaning Report:
- Original rows: ${report.totalRows}
- Cleaned rows: ${report.cleanedRows}
- Removed rows (empty/duplicates): ${report.removedRows}
- Null values handled: ${report.nullsHandled}
- Duplicates removed: ${report.duplicatesRemoved}
- Data type corrections: ${report.dataTypeCorrections}
- Outliers flagged: ${report.outliersFlagged}`;

  const columnInfo = Object.entries(columnStats)
    .map(([name, stats]) => {
      let info = `  - ${name} (${stats.type}): ${stats.uniqueCount} unique values`;
      if (stats.nullCount > 0) info += `, ${stats.nullCount} nulls`;
      if (stats.stats?.min !== undefined) {
        const s = stats.stats;
        info += `\n    Range: ${s.min} to ${s.max}, Mean: ${s.mean}, Median: ${s.median}`;
      }
      if (stats.outlierCount > 0) info += `\n    WARNING: ${stats.outlierCount} outliers detected`;
      return info;
    })
    .join("\n");

  const sampleData = sampleRows
    .map((row, idx) => `  Row ${idx + 1}: ${row.join(" | ")}`)
    .join("\n");

  const dataSummary = `${cleaningInfo}

Column Analysis:
${columnInfo}

Sample Data (${sampleRows.length} of ${rows.length} rows):
${sampleData}`;

  const systemPrompt = `You are an AI analytical system that generates perspective-driven insights from datasets.

${personaPrompt}

You are provided with a CLEANED and PREPROCESSED dataset. The cleaning process has:
- Removed empty and duplicate rows
- Standardized data formats
- Detected and flagged outliers
- Identified column types (numeric, text, date, boolean)

Analyze the provided dataset and generate insights from this persona's perspective.

RULES:
- Do NOT claim causality or certainty
- Generate 8-12 distinct hypotheses/insights that THIS persona would naturally form
- Each insight must be a plausible interpretation, NOT a fact
- Reference specific column names and statistics when making observations
- Suggest chart types that would best visualize each pattern (bar, line, pie, scatter, area, radar)
- Include at least 6-8 dashboard view suggestions with varied chart types
- For each dashboard view, specify clear variable names that exist in the dataset
- IMPORTANT: Only suggest charts where you have valid data - if data is sparse or unclear, suggest fewer charts
- For each chart, provide clear xAxisLabel and yAxisLabel that explain what is being shown

Respond with ONLY a JSON object (no markdown, no code blocks) in this exact format:
{
  "dataSummary": ["cleaning observation 1", "data quality finding 2", "structure observation 3"],
  "patterns": ["statistical pattern 1", "trend 2", "correlation 3", "anomaly 4"],
  "insights": ["persona-specific insight 1", "insight 2", "insight 3", "insight 4", "insight 5", "insight 6", "insight 7", "insight 8"],
  "dashboardViews": [
    {"title": "Chart Title", "purpose": "What this visualization reveals", "chartType": "bar", "variables": ["column1", "column2"], "aggregation": "sum", "xAxisLabel": "X Axis Description", "yAxisLabel": "Y Axis Description"},
    {"title": "Another View", "purpose": "Purpose", "chartType": "line", "variables": ["col1"], "aggregation": "avg", "xAxisLabel": "X Axis", "yAxisLabel": "Y Axis"},
    {"title": "Distribution View", "purpose": "Show distribution", "chartType": "pie", "variables": ["category_column"], "aggregation": "count", "xAxisLabel": "Categories", "yAxisLabel": "Count"}
  ],
  "cleaningNotes": ["note about data quality 1", "note 2"],
  "warning": "optional warning if data quality is concerning"
}`;

  const userPrompt = `Analyze this cleaned dataset as ${
    request.persona === "custom" && request.customPersona
      ? request.customPersona.name
      : request.persona
  }:

${dataSummary}

Respond with ONLY the JSON object, no other text.`;

  const strictMode = getStrictMode();
  const customFingerprint =
    request.persona === "custom" && request.customPersona
      ? fnv1aHash(
          `${request.customPersona.name}|${request.customPersona.description}|${request.customPersona.analyticalFocus}|${request.customPersona.customPrompt || ""}`
        )
      : "none";
  const cacheKey = `${ANALYSIS_CACHE_PREFIX}:${datasetHash}:${request.persona}:${customFingerprint}`;
  const cached = readCache<AnalysisResult>(cacheKey);
  if (cached) {
    return cached;
  }

  const response = await fetch(OPENAI_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: getStoredModel(),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: strictMode ? 0.2 : 0.7,
      max_completion_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
    throw new Error(error?.error?.message || `HTTP error ${response.status}`);
  }

  const result = await response.json();
  const content = result?.choices?.[0]?.message?.content ?? "";
  let cleanContent = String(content).trim();
  if (cleanContent.startsWith("```json")) cleanContent = cleanContent.slice(7);
  else if (cleanContent.startsWith("```")) cleanContent = cleanContent.slice(3);
  if (cleanContent.endsWith("```")) cleanContent = cleanContent.slice(0, -3);
  cleanContent = cleanContent.trim();

  const parsed = JSON.parse(cleanContent || "{}");
  if (!parsed.dataSummary) parsed.dataSummary = ["Data analyzed successfully"];
  if (!parsed.patterns) parsed.patterns = ["Patterns identified in the dataset"];
  if (!parsed.insights) parsed.insights = ["Insights generated based on the data"];
  const fallbackViews = (() => {
    const numericColumns = Object.entries(columnStats)
      .filter(([, stats]) => stats.type === "numeric")
      .map(([name]) => name);
    const categoryColumns = Object.entries(columnStats)
      .filter(([, stats]) => stats.type !== "numeric")
      .map(([name]) => name);

    const category = categoryColumns[0] || headers[0] || "Category";
    const value = numericColumns[0] || headers[1] || headers[0] || "Value";

    return [
      {
        title: `${value} by ${category}`,
        purpose: "Compare totals by category",
        chartType: "bar",
        variables: [category, value],
        aggregation: "sum",
        xAxisLabel: category,
        yAxisLabel: value,
      },
      {
        title: `${value} trend by ${category}`,
        purpose: "See changes across categories",
        chartType: "line",
        variables: [category, value],
        aggregation: "avg",
        xAxisLabel: category,
        yAxisLabel: value,
      },
      {
        title: `${value} share by ${category}`,
        purpose: "Show proportional contribution",
        chartType: "pie",
        variables: [category, value],
        aggregation: "sum",
        xAxisLabel: category,
        yAxisLabel: value,
      },
      {
        title: `${category} vs ${value}`,
        purpose: "Tabular comparison",
        chartType: "table",
        variables: [category, value],
        aggregation: "sum",
        xAxisLabel: category,
        yAxisLabel: value,
      },
    ];
  })();

  if (!parsed.dashboardViews) {
    parsed.dashboardViews = [];
  }

  // Strict schema checks: keep only known columns and valid chart types.
  const headerSet = new Set(headers.map((h) => (h || "").toLowerCase()));
  parsed.dashboardViews = parsed.dashboardViews
    .filter((view: any) => view && typeof view === "object")
    .map((view: any) => ({
      ...view,
      variables: Array.isArray(view.variables)
        ? view.variables.filter((v: string) => headerSet.has(String(v).toLowerCase()))
        : [],
      chartType: normalizeChartType(view.chartType),
      aggregation: normalizeAggregation(view.aggregation),
    }))
    .filter((view: any) => view.variables.length >= 1);

  if (parsed.dashboardViews.length < 4) {
    const existing = new Set(
      parsed.dashboardViews.map((view: any) => `${view.chartType}:${view.variables?.join("|")}`)
    );
    for (const view of fallbackViews) {
      const key = `${view.chartType}:${view.variables.join("|")}`;
      if (!existing.has(key)) {
        parsed.dashboardViews.push(view);
      }
      if (parsed.dashboardViews.length >= 4) break;
    }
  }

  parsed.cleaningReport = report;
  parsed.columnStats = columnStats;
  
  // Post-check pass for unsupported text claims.
  const hasTimeColumn = headers.some((h) => /date|month|year|quarter|week|day|time/i.test(h || ""));
  if (!hasTimeColumn && Array.isArray(parsed.insights)) {
    parsed.insights = parsed.insights.filter(
      (item: string) => !/month-over-month|year-over-year|over time|temporal/i.test(String(item))
    );
  }
  
  const finalResult = parsed as AnalysisResult;
  writeCache(cacheKey, finalResult);
  return finalResult;
}

function normalizeChartType(type: string): 'line' | 'bar' | 'scatter' | 'table' | 'pie' {
  const normalized = type?.toLowerCase() || 'bar';
  if (['line', 'bar', 'scatter', 'table', 'pie'].includes(normalized)) {
    return normalized as 'line' | 'bar' | 'scatter' | 'table' | 'pie';
  }
  // Map other chart types to supported ones
  if (normalized === 'area') return 'line';
  if (normalized === 'radar') return 'bar';
  return 'bar';
}

function normalizeAggregation(agg?: string): "sum" | "avg" | "count" {
  const normalized = (agg || "sum").toLowerCase();
  if (normalized === "avg" || normalized === "average" || normalized === "mean") return "avg";
  if (normalized === "count" || normalized === "distribution" || normalized === "frequency") return "count";
  return "sum";
}

export function clearStoredApiKey(): void {
  localStorage.removeItem(API_KEY_STORAGE);
}

export async function recommendPersonaAndKpis(data: string[][]): Promise<RecommendationResult> {
  const { cleanedData, report, columnStats } = cleanAndPrepareData(data);
  const headers = cleanedData[0] || [];
  const datasetHash = getDatasetHash(cleanedData);
  const recoCacheKey = `${RECOMMENDATION_CACHE_PREFIX}:${datasetHash}`;
  const cachedRecommendation = readCache<RecommendationResult>(recoCacheKey);
  if (cachedRecommendation?.persona && cachedRecommendation?.kpis?.length) {
    return cachedRecommendation;
  }

  const heuristicPersona = inferLikelyPersonaFromHeaders(headers);
  const summary = {
    headers,
    rows: report.cleanedRows,
    numericColumns: Object.entries(columnStats).filter(([, c]) => c.type === "numeric").map(([name]) => name),
    categoricalColumns: Object.entries(columnStats).filter(([, c]) => c.type !== "numeric").map(([name]) => name),
  };

  const fallbackPersona = heuristicPersona || (summary.numericColumns.length >= 2 ? "data_scientist" : "business");
  const fallbackKpis = [
    `Total rows: ${report.cleanedRows.toLocaleString()}`,
    `Columns analyzed: ${headers.length}`,
    `Duplicates removed: ${report.duplicatesRemoved}`,
    `Null values handled: ${report.nullsHandled}`,
  ];

  try {
    const response = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: getStoredModel(),
        messages: [
          {
            role: "system",
            content:
              "You are a dataset triage assistant. Pick the single most appropriate persona for this dataset based on column semantics and business context, then recommend 4 KPI cards. Output JSON only: { persona: string, kpis: string[] }. Personas: common, accountant, engineer, policy, lawyer, business, data_scientist, product_manager. You must choose from only these personas.",
          },
          {
            role: "user",
            content: `Dataset summary: ${JSON.stringify(summary)}. Heuristic likely persona: ${heuristicPersona || "none"}. Use the heuristic only if dataset context supports it.`,
          },
        ],
        temperature: getStrictMode() ? 0.1 : 0.3,
        max_completion_tokens: 300,
      }),
    });

    if (!response.ok) throw new Error("recommendation failed");
    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content ?? "";
    let cleaned = String(content).trim();
    if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
    else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
    if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();
    const parsed = JSON.parse(cleaned || "{}");
    const persona = String(parsed.persona || fallbackPersona);
    const kpis = Array.isArray(parsed.kpis) ? parsed.kpis.slice(0, 4).map(String) : fallbackKpis;
    const resultPayload = { persona, kpis: kpis.length ? kpis : fallbackKpis };
    writeCache(recoCacheKey, resultPayload);
    return resultPayload;
  } catch {
    const fallbackPayload = { persona: fallbackPersona, kpis: fallbackKpis };
    writeCache(recoCacheKey, fallbackPayload);
    return fallbackPayload;
  }
}
