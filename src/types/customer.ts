export interface Customer {
  id: string;
  name: string;
  location: string;
  phone: string;
  createdAt?: string;
}

export interface CustomerFormData {
  name: string;
  location: string;
  phone: string;
}
