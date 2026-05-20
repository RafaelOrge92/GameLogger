/**
 * Statistical utility to detect and filter out price outliers using the IQR (Interquartile Range) method.
 */

export interface PriceStatsResult {
  originalPrices: number[];
  cleanedPrices: number[];
  outliers: number[];
  q1: number;
  q3: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
  average: number;
  min: number;
  max: number;
}

/**
 * Filters out price outliers using the IQR method.
 * Q1 = 25th percentile
 * Q3 = 75th percentile
 * IQR = Q3 - Q1
 * Lower Bound = Q1 - 1.5 * IQR
 * Upper Bound = Q3 + 1.5 * IQR
 */
export function cleanPricesIQR(rawPrices: number[]): PriceStatsResult {
  if (!rawPrices || rawPrices.length === 0) {
    return {
      originalPrices: [],
      cleanedPrices: [],
      outliers: [],
      q1: 0,
      q3: 0,
      iqr: 0,
      lowerBound: 0,
      upperBound: 0,
      average: 0,
      min: 0,
      max: 0,
    };
  }

  // 1. Sort prices ascending
  const sorted = [...rawPrices].sort((a, b) => a - b);

  // Helper to calculate percentile values (linear interpolation)
  const getPercentile = (arr: number[], percentile: number): number => {
    const index = (percentile / 100) * (arr.length - 1);
    const low = Math.floor(index);
    const high = Math.ceil(index);
    if (low === high) return arr[low];
    return arr[low] + (arr[high] - arr[low]) * (index - low);
  };

  // 2. Calculate Q1 (25%), Q3 (75%), and IQR
  const q1 = getPercentile(sorted, 25);
  const q3 = getPercentile(sorted, 75);
  const iqr = q3 - q1;

  // 3. Establish Thresholds
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  // 4. Evaluate each price against bounds to separate cleaned data and outliers
  const cleanedPrices: number[] = [];
  const outliers: number[] = [];

  for (const price of sorted) {
    if (price < lowerBound || price > upperBound) {
      outliers.push(price);
    } else {
      cleanedPrices.push(price);
    }
  }

  // 5. Final Metrics Calculation on Cleaned Data
  const sum = cleanedPrices.reduce((acc, p) => acc + p, 0);
  const average = cleanedPrices.length > 0 ? sum / cleanedPrices.length : 0;
  const min = cleanedPrices.length > 0 ? cleanedPrices[0] : 0;
  const max = cleanedPrices.length > 0 ? cleanedPrices[cleanedPrices.length - 1] : 0;

  return {
    originalPrices: sorted,
    cleanedPrices,
    outliers,
    q1,
    q3,
    iqr,
    lowerBound,
    upperBound,
    average,
    min,
    max,
  };
}
