export interface DailyLedgerEntry {
  id: string;
  date: string;
  type: 'earnings' | 'expense';
  description: string;
  amount: number;
  paymentType: 'रोख' | 'ऑनलाइन' | 'उधारी';
  notes?: string;
}

export interface DatewiseReportRow {
  id: string;
  date: string;
  earnings: number;
  expense: number;
  profit: number;
}

export interface MachineReportRow {
  id: string;
  machineName: string;
  hoursOrTrips: string;
  totalEarnings: number;
}

export interface MonthlyChartData {
  day: number;
  earnings: number;
  expense: number;
}
