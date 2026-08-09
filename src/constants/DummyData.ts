import dashboardData from '../data/dashboard.json';
import customersData from '../data/customers.json';
import machinesData from '../data/machines.json';
import reportsData from '../data/reports.json';

// In-memory data store to persist modifications across screen switches
let persistedCustomers = [...customersData];
let persistedMachines = [...machinesData];

export const DummyData = {
  dashboard: dashboardData,
  get customers() {
    return persistedCustomers;
  },
  set customers(val) {
    persistedCustomers = val;
  },
  get machines() {
    return persistedMachines;
  },
  set machines(val) {
    persistedMachines = val;
  },
  reports: reportsData,
};

