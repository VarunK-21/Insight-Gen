export type ColumnStats = {
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
};

export type CleaningReport = {
  totalRows: number;
  cleanedRows: number;
  removedRows: number;
  nullsHandled: number;
  duplicatesRemoved: number;
  dataTypeCorrections: number;
  outliersFlagged: number;
  columnsAnalyzed: { name: string; type: string; nullCount: number; uniqueCount: number }[];
};

type CleanedResult = {
  cleanedData: string[][];
  report: CleaningReport;
  columnStats: Record<string, ColumnStats>;
};

const DATE_PATTERN_1 = /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}$/;
const DATE_PATTERN_2 = /^\d{4}-\d{2}-\d{2}/;

/**
 * Detects if a column contains year values (4-digit numbers in reasonable year range)
 */
export function isYearColumn(values: string[], columnName?: string): boolean {
  // Check column name for year keywords
  if (columnName) {
    const name = columnName.toLowerCase();
    if (name.includes('year') || name.includes('launchyear') || name.includes('birthyear')) {
      return true;
    }
  }

  // Check if values are years (4-digit numbers in 1900-2100 range)
  const nonEmpty = values.filter((v) => v && v.trim());
  if (nonEmpty.length === 0) return false;

  let yearCount = 0;
  for (const v of nonEmpty) {
    const cleaned = v.replace(/,/g, "").replace(/[$€£]/g, "").trim();
    const num = Number(cleaned);
    // Check if it's a 4-digit number in reasonable year range
    if (!Number.isNaN(num) && Number.isInteger(num) && num >= 1900 && num <= 2100 && cleaned.length === 4) {
      yearCount += 1;
    }
  }

  // If 80%+ of values are years, consider it a year column
  return yearCount >= nonEmpty.length * 0.8;
}

export function detectColumnType(values: string[], columnName?: string): string {
  const nonEmpty = values.filter((v) => v && v.trim());
  if (nonEmpty.length === 0) return "text";

  // Check for year column first
  if (isYearColumn(values, columnName)) {
    return "year";
  }

  let numericCount = 0;
  let dateCount = 0;
  let boolCount = 0;

  for (const v of nonEmpty) {
    const cleaned = v.replace(/,/g, "").replace(/[$€£]/g, "");
    if (!Number.isNaN(Number(cleaned))) numericCount += 1;
    if (DATE_PATTERN_1.test(v) || DATE_PATTERN_2.test(v)) dateCount += 1;
    if (["true", "false", "yes", "no", "1", "0"].includes(v.toLowerCase())) boolCount += 1;
  }

  if (numericCount === nonEmpty.length) return "numeric";
  if (dateCount > nonEmpty.length * 0.7) return "date";
  if (boolCount > nonEmpty.length * 0.8) return "boolean";
  if (numericCount > nonEmpty.length * 0.5) return "mixed";
  return "text";
}

export function cleanValue(value: string, colType: string): string {
  if (!value || !value.trim()) return "";

  let cleaned = value.trim();
  cleaned = cleaned.replace(/[\x00-\x1f\x7f-\x9f]/g, "");

  if (colType === "numeric") {
    cleaned = cleaned.replace(/[$€£¥₹,]/g, "");
    cleaned = cleaned.replace(/\s+/g, "");
    if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
      cleaned = `-${cleaned.slice(1, -1)}`;
    }
  }

  if (colType === "boolean") {
    const lower = cleaned.toLowerCase();
    if (["true", "yes", "1"].includes(lower)) cleaned = "true";
    if (["false", "no", "0"].includes(lower)) cleaned = "false";
  }

  return cleaned;
}

export function calculateStats(values: string[], colType: string): Record<string, number> {
  if (colType !== "numeric") return {};

  const numbers: number[] = [];
  for (const v of values) {
    const num = Number(v);
    if (!Number.isNaN(num)) numbers.push(num);
  }

  if (numbers.length === 0) return {};

  const sorted = [...numbers].sort((a, b) => a - b);
  const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  const variance = numbers.reduce((sum, n) => sum + (n - mean) ** 2, 0) / numbers.length;
  const stdDev = Math.sqrt(variance);

  return {
    min: Math.round(sorted[0] * 100) / 100,
    max: Math.round(sorted[sorted.length - 1] * 100) / 100,
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
  };
}

export function detectOutliers(values: string[], colType: string): number[] {
  if (colType !== "numeric") return [];

  const numbers: Array<[number, number]> = [];
  for (let i = 0; i < values.length; i += 1) {
    const num = Number(values[i]);
    if (!Number.isNaN(num)) numbers.push([num, i]);
  }

  if (numbers.length < 4) return [];

  const sorted = numbers.map((n) => n[0]).sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length / 4)];
  const q3 = sorted[Math.floor((3 * sorted.length) / 4)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;

  return numbers.filter(([val]) => val < lower || val > upper).map(([, idx]) => idx);
}

export function cleanAndPrepareData(data: string[][]): CleanedResult {
  const headers = data[0] || [];
  const rows = data.slice(1);

  const columnTypes = headers.map((_, idx) => {
    const values = rows.map((row) => (idx < row.length ? row[idx] : ""));
    return detectColumnType(values, headers[idx]);
  });

  let nullsHandled = 0;
  let duplicatesRemoved = 0;
  let dataTypeCorrections = 0;
  let outliersFlagged = 0;

  const seenRows = new Set<string>();
  const cleanedRows: string[][] = [];

  for (const row of rows) {
    if (row.every((cell) => !cell || !cell.trim())) continue;

    const cleanedRow: string[] = [];
    for (let idx = 0; idx < row.length; idx += 1) {
      const original = row[idx] || "";
      const colType = columnTypes[idx] || "text";
      const cleaned = cleanValue(original, colType);

      if (!original || !original.trim()) nullsHandled += 1;
      if (cleaned !== original && original) dataTypeCorrections += 1;

      cleanedRow.push(cleaned);
    }

    const rowKey = cleanedRow.join("|");
    if (seenRows.has(rowKey)) {
      duplicatesRemoved += 1;
      continue;
    }
    seenRows.add(rowKey);
    cleanedRows.push(cleanedRow);
  }

  const columnStats: Record<string, ColumnStats> = {};
  const columnsAnalyzed: CleaningReport["columnsAnalyzed"] = [];

  headers.forEach((header, idx) => {
    const values = cleanedRows.map((row) => (idx < row.length ? row[idx] : ""));
    const nonEmpty = values.filter((v) => v && v.trim());
    const unique = new Set(nonEmpty);
    const colType = columnTypes[idx];
    const stats = calculateStats(values, colType);
    const outliers = detectOutliers(values, colType);
    outliersFlagged += outliers.length;

    columnStats[header] = {
      type: colType,
      stats,
      outlierCount: outliers.length,
      nullCount: values.length - nonEmpty.length,
      uniqueCount: unique.size,
      sampleValues: Array.from(unique).slice(0, 5),
    };

    columnsAnalyzed.push({
      name: header,
      type: colType,
      nullCount: values.length - nonEmpty.length,
      uniqueCount: unique.size,
    });
  });

  const report: CleaningReport = {
    totalRows: rows.length,
    cleanedRows: cleanedRows.length,
    removedRows: rows.length - cleanedRows.length,
    nullsHandled,
    duplicatesRemoved,
    dataTypeCorrections,
    outliersFlagged,
    columnsAnalyzed,
  };

  return {
    cleanedData: [headers, ...cleanedRows],
    report,
    columnStats,
  };
}
