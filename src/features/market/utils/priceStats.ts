

 

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

  
  const sorted = [...rawPrices].sort((a, b) => a - b);

  
  const getPercentile = (arr: number[], percentile: number): number => {
    const index = (percentile / 100) * (arr.length - 1);
    const low = Math.floor(index);
    const high = Math.ceil(index);
    if (low === high) return arr[low];
    return arr[low] + (arr[high] - arr[low]) * (index - low);
  };

  
  const q1 = getPercentile(sorted, 25);
  const q3 = getPercentile(sorted, 75);
  const iqr = q3 - q1;

  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  
  const cleanedPrices: number[] = [];
  const outliers: number[] = [];

  for (const price of sorted) {
    if (price < lowerBound || price > upperBound) {
      outliers.push(price);
    } else {
      cleanedPrices.push(price);
    }
  }

  
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
