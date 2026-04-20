export interface SalesData {
  date: string;
  storeId: string;
  productId: string;
  sales: number;
  promotion: number; // 0 or 1
  holiday: number; // 0 or 1
  temperature: number;
  fuelPrice: number;
  cpi: number;
  unemployment: number;
}

export interface MetricResults {
  mae: number;
  rmse: number;
  r2: number;
}

export interface ModelPerformance {
  modelName: string;
  metrics: MetricResults;
}

export interface ForecastResult {
  date: string;
  actual?: number;
  predicted: number;
}
