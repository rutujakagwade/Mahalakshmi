import { DummyData } from '../constants/DummyData';

export interface AuthState {
  isAuthenticated: boolean;
  pin: string;
}

export const initialAuthState: AuthState = {
  isAuthenticated: false,
  pin: '',
};

export interface DashboardState {
  todayEarnings: number;
  todayExpense: number;
  todayProfit: number;
  isOffline: boolean;
}

export const initialDashboardState: DashboardState = {
  todayEarnings: DummyData.dashboard.todaySummary.earnings,
  todayExpense: DummyData.dashboard.todaySummary.expense,
  todayProfit: DummyData.dashboard.todaySummary.profit,
  isOffline: true,
};
