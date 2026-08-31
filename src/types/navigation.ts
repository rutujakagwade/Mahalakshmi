import { Customer } from './customer';

export type RootStackParamList = {
  Splash: undefined;
  PinLogin: undefined;
  Dashboard: undefined;
  DailyEntry: undefined;
  MachineEntry: undefined;
  CustomerList: undefined;
  CustomerDetail: { customer: Customer };
  AddCustomer: undefined;
  EditCustomer: { customerId: string };
  DateReport: undefined;
  CalendarView: undefined;
  MonthlyReport: undefined;
  MachineReport: undefined;
  UdharReport: undefined;
  MyLoan: undefined;
  LoanDetail: { loanId: string };
  AddLoan: undefined;
  EditLoan: { loanId: string };
  NotificationList: undefined;
  Settings: undefined;
};

export type ActiveScreen = keyof RootStackParamList;

