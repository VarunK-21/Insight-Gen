/**
 * Advanced Analytics Module
 * 
 * Provides statistical enhancements beyond basic aggregations:
 * - Weighted averages
 * - Confidence intervals
 * - Median vs mean comparison (skewness detection)
 * - Outlier detection and handling
 */

/**
 * Calculates weighted average
 * @param values Array of values
 * @param weights Array of weights (must match values length)
 * @returns Weighted average
 */
export function calculateWeightedAverage(values: number[], weights: number[]): number {
  if (values.length === 0 || weights.length === 0) return 0;
  if (values.length !== weights.length) {
    console.warn('Values and weights arrays must have same length');
    return 0;
  }

  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const weight = weights[i];
    
    if (isFinite(value) && isFinite(weight) && weight > 0) {
      weightedSum += value * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Calculates confidence interval for a sample mean
 * @param values Array of values
 * @param confidenceLevel Confidence level (default: 0.95 for 95% CI)
 * @returns Object with mean, lowerBound, upperBound, and standardError
 */
export function calculateConfidenceInterval(
  values: number[],
  confidenceLevel: number = 0.95
): {
  mean: number;
  lowerBound: number;
  upperBound: number;
  standardError: number;
  sampleSize: number;
} {
  if (values.length === 0) {
    return { mean: 0, lowerBound: 0, upperBound: 0, standardError: 0, sampleSize: 0 };
  }

  const n = values.length;
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate sample standard deviation (Bessel's correction: n-1)
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);
  
  // Standard error of the mean
  const standardError = stdDev / Math.sqrt(n);
  
  // Z-score for confidence level (approximation for large samples)
  // For 95% CI: z = 1.96, for 99% CI: z = 2.576
  const zScore = confidenceLevel === 0.95 ? 1.96 : 
                 confidenceLevel === 0.99 ? 2.576 :
                 confidenceLevel === 0.90 ? 1.645 : 1.96;
  
  const marginOfError = zScore * standardError;
  
  return {
    mean: Math.round(mean * 100) / 100,
    lowerBound: Math.round((mean - marginOfError) * 100) / 100,
    upperBound: Math.round((mean + marginOfError) * 100) / 100,
    standardError: Math.round(standardError * 100) / 100,
    sampleSize: n
  };
}

/**
 * Calculates median and compares with mean to detect skewness
 * @param values Array of values
 * @returns Object with mean, median, skewness indicator, and recommendation
 */
export function calculateMedianAndSkewness(values: number[]): {
  mean: number;
  median: number;
  skewness: number; // Normalized difference (0 = no skew, >0.5 = significant skew)
  isSkewed: boolean;
  recommendation: 'mean' | 'median' | 'both';
} {
  if (values.length === 0) {
    return { mean: 0, median: 0, skewness: 0, isSkewed: false, recommendation: 'mean' };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  // Calculate median
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
  
  // Calculate standard deviation for normalization
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Normalized skewness measure (difference between mean and median relative to stdDev)
  const skewness = stdDev > 0 ? Math.abs(mean - median) / stdDev : 0;
  const isSkewed = skewness > 0.5; // Threshold: significant skew
  
  // Recommendation
  let recommendation: 'mean' | 'median' | 'both';
  if (skewness < 0.3) {
    recommendation = 'mean'; // Low skew, mean is fine
  } else if (skewness > 0.7) {
    recommendation = 'median'; // High skew, prefer median
  } else {
    recommendation = 'both'; // Moderate skew, show both
  }
  
  return {
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    skewness: Math.round(skewness * 100) / 100,
    isSkewed,
    recommendation
  };
}

/**
 * Detects outliers using Interquartile Range (IQR) method
 * @param values Array of values
 * @param multiplier IQR multiplier (default: 1.5, standard for outlier detection)
 * @returns Object with filtered values, outliers, and statistics
 */
export function detectOutliersIQR(
  values: number[],
  multiplier: number = 1.5
): {
  filteredValues: number[];
  outliers: number[];
  q1: number;
  q3: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
  outlierCount: number;
  outlierPercentage: number;
} {
  if (values.length === 0) {
    return {
      filteredValues: [],
      outliers: [],
      q1: 0,
      q3: 0,
      iqr: 0,
      lowerBound: 0,
      upperBound: 0,
      outlierCount: 0,
      outlierPercentage: 0
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  // Calculate quartiles
  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  // Calculate bounds
  const lowerBound = q1 - multiplier * iqr;
  const upperBound = q3 + multiplier * iqr;
  
  // Separate outliers from normal values
  const outliers: number[] = [];
  const filteredValues: number[] = [];
  
  for (const value of values) {
    if (value < lowerBound || value > upperBound) {
      outliers.push(value);
    } else {
      filteredValues.push(value);
    }
  }
  
  const outlierCount = outliers.length;
  const outlierPercentage = (outlierCount / values.length) * 100;
  
  return {
    filteredValues,
    outliers,
    q1: Math.round(q1 * 100) / 100,
    q3: Math.round(q3 * 100) / 100,
    iqr: Math.round(iqr * 100) / 100,
    lowerBound: Math.round(lowerBound * 100) / 100,
    upperBound: Math.round(upperBound * 100) / 100,
    outlierCount,
    outlierPercentage: Math.round(outlierPercentage * 100) / 100
  };
}

/**
 * Calculates robust statistics (using median and IQR) for skewed data
 * @param values Array of values
 * @returns Robust statistics with outlier handling
 */
export function calculateRobustStatistics(values: number[]): {
  mean: number;
  median: number;
  robustMean: number; // Mean after outlier removal
  outlierInfo: ReturnType<typeof detectOutliersIQR>;
  skewnessInfo: ReturnType<typeof calculateMedianAndSkewness>;
  recommendation: string;
} {
  const outlierInfo = detectOutliersIQR(values);
  const skewnessInfo = calculateMedianAndSkewness(values);
  
  // Calculate robust mean (mean after removing outliers)
  const robustMean = outlierInfo.filteredValues.length > 0
    ? outlierInfo.filteredValues.reduce((sum, val) => sum + val, 0) / outlierInfo.filteredValues.length
    : skewnessInfo.mean;
  
  // Generate recommendation
  let recommendation = '';
  if (outlierInfo.outlierPercentage > 10) {
    recommendation += `High outlier rate (${outlierInfo.outlierPercentage}%). `;
  }
  if (skewnessInfo.isSkewed) {
    recommendation += `Data is skewed (skewness: ${skewnessInfo.skewness}). `;
  }
  if (outlierInfo.outlierPercentage > 10 || skewnessInfo.isSkewed) {
    recommendation += `Consider using median (${skewnessInfo.median}) instead of mean (${skewnessInfo.mean}).`;
  } else {
    recommendation = 'Data distribution is normal. Mean is appropriate.';
  }
  
  return {
    mean: skewnessInfo.mean,
    median: skewnessInfo.median,
    robustMean: Math.round(robustMean * 100) / 100,
    outlierInfo,
    skewnessInfo,
    recommendation
  };
}

/**
 * Calculates percentile
 * @param sortedValues Sorted array of values
 * @param percentile Percentile (0-100)
 * @returns Percentile value
 */
export function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  if (percentile <= 0) return sortedValues[0];
  if (percentile >= 100) return sortedValues[sortedValues.length - 1];
  
  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}
