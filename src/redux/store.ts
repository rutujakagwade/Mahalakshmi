import { initialAuthState } from './authSlice';
import { initialDashboardState } from './dashboardSlice';
import { initialCustomerState } from './customerSlice';
import { initialMachineState } from './machineSlice';
import { initialReportState } from './reportSlice';

export const store = {
  auth: initialAuthState,
  dashboard: initialDashboardState,
  customer: initialCustomerState,
  machine: initialMachineState,
  report: initialReportState,
};

export type RootState = typeof store;
