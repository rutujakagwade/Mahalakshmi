import { Customer } from './customer';

export type RootStackParamList = {
  Splash: undefined;
  PinLogin: undefined;
  Dashboard: undefined;
  KamaiEntry: undefined;
  KharchEntry: undefined;
  MachineEntry: undefined;
  NavinKam: undefined;
  CustomerList: undefined;
  CustomerDetail: { customer: Customer };
  AddCustomer: undefined;
  EditCustomer: { customerId: string };
  DateReport: undefined;
  CalendarView: undefined;
  MonthlyReport: undefined;
  MachineReport: undefined;
  UdharReport: undefined;
  NotificationList: undefined;
  Settings: undefined;
};



export type ActiveScreen = keyof RootStackParamList;
