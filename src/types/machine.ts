export interface Machine {
  id: string;
  name: string;
  modelNumber: string;
  registrationNumber: string;
  hourlyRate: number;
}

export interface MachineEntry {
  id: string;
  date: string;
  machineId: string;
  machineName: string;
  customerId: string;
  customerName: string;
  location: string;
  workDescription: string;
  hoursOrTrips: string;
  amount: number;
  paymentType: 'रोख' | 'ऑनलाइन' | 'उधारी';
  createdAt?: string;
}
