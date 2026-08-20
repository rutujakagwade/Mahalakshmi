export interface Customer {
  id: string;
  name: string;
  location: string;
  phone: string;
  totalWork?: number;
  totalPaid?: number;
  udhariBalance?: number;
  expectedPaymentDate?: string | null;
  createdAt?: string;
}


export interface CustomerFormData {
  name: string;
  location: string;
  phone: string;
}

export interface CustomerPaymentItem {
  id: string;
  paymentDate: string;
  amount: number;
  paymentType: 'cash' | 'online';
  notes?: string;
  isMachineEntry?: boolean;
  createdAt?: string;
}


export interface CustomerWorkHistoryItem {
  id: string;
  machineId: string;
  machineName: string;
  entryDate: string;
  toDate?: string | null;
  location?: string;
  workDescription?: string;
  hoursOrTrips: number;
  hoursUnit: 'hours' | 'trips';
  amount: number;
  paymentType: 'cash' | 'online' | 'credit';
}

export interface CustomerLedgerData {
  customer: Customer;
  workHistory: CustomerWorkHistoryItem[];
  paymentHistory: CustomerPaymentItem[];
}
