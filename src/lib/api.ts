// API configuration for the Python backend
// Update this URL to your deployed backend URL

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://triumphant-manifestation-production-c678.up.railway.app';

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

interface ColumnStats {
  type: string;
  stats: {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    stdDev?: number;
  };
  outlierCount: number;
  nullCount: number;
  uniqueCount: number;
  sampleValues: string[];
}

export interface CleaningReport {
  totalRows: number;
  cleanedRows: number;
  removedRows: number;
  nullsHandled: number;
  duplicatesRemoved: number;
  dataTypeCorrections: number;
  outliersFlagged: number;
  columnsAnalyzed: { name: string; type: string; nullCount: number; uniqueCount: number }[];
}

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

export async function analyzeDataset(request: AnalysisRequest): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP error ${response.status}`);
  }

  const result = await response.json();
  
  // Normalize chartType to match expected types
  if (result.dashboardViews) {
    result.dashboardViews = result.dashboardViews.map((view: any) => ({
      ...view,
      chartType: normalizeChartType(view.chartType)
    }));
  }
  
  return result;
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

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
