export type RootStackParamList = {
  Splash: undefined;
  PinLogin: undefined;
  Dashboard: undefined;
  DailyEntry: undefined;
  MachineEntry: undefined;
  CustomerList: undefined;
  AddCustomer: undefined;
  EditCustomer: { customerId: string };
  DateReport: undefined;
  MonthlyReport: undefined;
  MachineReport: undefined;
  Settings: undefined;
};

export type ActiveScreen = keyof RootStackParamList;
