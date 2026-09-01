import { Customer } from './customer';

export type RootStackParamList = {
  Splash: undefined;
  PinLogin: undefined;
  Dashboard: undefined;
  KamaiEntry: undefined;
  KharchEntry: undefined;
  MachineEntry: undefined;
  MajurYadi: undefined;
  LabourList: undefined;
  NavinKam: undefined;
  ChaluKamList: undefined;
  CustomerList: undefined;
  CustomerDetail: { customer: Customer };
  AddCustomer: undefined;
  EditCustomer: { customerId: string };
  DateReport: undefined;
  KharchReport: undefined;
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

