import { Customer } from '../types/customer';
import { DummyData } from '../constants/DummyData';

export interface CustomerState {
  customers: Customer[];
}

export const initialCustomerState: CustomerState = {
  customers: DummyData.customers as Customer[],
};
