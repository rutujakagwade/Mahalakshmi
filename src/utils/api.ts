/**
 * API Client & Network Service for Mahalakshmi App
 * Connects React Native frontend with Laravel 10 Backend
 */

// Configure base URL: change to your machine's LAN IP when testing on real Android/iOS device
// e.g. 'http://192.168.1.100:8000/api' or 'http://10.0.2.2:8000/api' for Android emulator
// export const API_BASE_URL = 'http://35.154.122.181/mahalaxmiEMbackend-/public/index.php/api';
// export const API_BASE_URL = 'http://10.147.238.128:8000/api';

// export const API_BASE_URL = 'http://35.154.122.181/mahalakshmi-api/public/index.php/api';
// export const API_BASE_URL = 'http://10.0.2.2:8000/api'; // For Android Emulator
export const API_BASE_URL = 'http://192.168.1.7:8000/api'; // For Physical Device on LAN





import { SafeStorage } from './storage';

const AUTH_TOKEN_KEY = '@mahalaxmi_auth_token';

let authToken: string | null = null;

/**
 * Persist token to SafeStorage AND update in-memory cache.
 * Pass null to clear (logout).
 */
export const setAuthToken = async (token: string | null): Promise<void> => {
  authToken = token;
  try {
    if (token) {
      await SafeStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      await SafeStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // In-memory token is always preserved
  }
};

/**
 * Restore token on app startup.
 */
export const initAuthToken = async (): Promise<string | null> => {
  try {
    const stored = await SafeStorage.getItem(AUTH_TOKEN_KEY);
    if (stored) {
      authToken = stored;
    }
    return authToken;
  } catch {
    return null;
  }
};

export const getAuthToken = () => authToken;

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...restOptions } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (authToken) {
    defaultHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error: any) {
    console.warn(`[API Error] ${endpoint}:`, error.message || error);
    throw error;
  }
}

// ---------------- API Services ---------------- //

export const AuthService = {
  login: async (pin: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
    if (response.token) {
      await setAuthToken(response.token);
    }
    return response;
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      await setAuthToken(null);
    }
  },

  updatePin: async (current_pin: string, new_pin: string) => {
    return apiRequest('/auth/pin', {
      method: 'PUT',
      body: JSON.stringify({ current_pin, new_pin }),
    });
  },

  getProfile: async () => {
    return apiRequest('/auth/me');
  },
};

export const DashboardService = {
  getSummary: async (date?: string) => {
    const res = await apiRequest('/dashboard', {
      params: date ? { date } : undefined,
    });
    return res.data;
  },
};

export const CustomerService = {
  getAll: async (search?: string) => {
    const res = await apiRequest('/customers', {
      params: search ? { q: search } : undefined,
    });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await apiRequest(`/customers/${id}`);
    return res.data;
  },

  create: async (payload: { name: string; location?: string; phone?: string; notes?: string }) => {
    const res = await apiRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  update: async (id: string, payload: { name: string; location?: string; phone?: string; notes?: string }) => {
    const res = await apiRequest(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  delete: async (id: string) => {
    return apiRequest(`/customers/${id}`, { method: 'DELETE' });
  },

  getLedger: async (id: string) => {
    const res = await apiRequest(`/customers/${id}/ledger`);
    return res.data;
  },

  addPayment: async (id: string, payload: { payment_date: string; amount: number; payment_type: 'cash' | 'online'; notes?: string }) => {
    const res = await apiRequest(`/customers/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  deletePayment: async (paymentId: string) => {
    return apiRequest(`/customer-payments/${paymentId}`, { method: 'DELETE' });
  },

  updateExpectedPaymentDate: async (id: string, expected_payment_date: string | null) => {
    const res = await apiRequest(`/customers/${id}/expected-payment-date`, {
      method: 'PUT',
      body: JSON.stringify({ expected_payment_date }),
    });
    return res.data;
  },
};



export const MachineService = {
  getAll: async () => {
    const res = await apiRequest('/machines');
    return res.data;
  },

  create: async (payload: {
    name: string;
    model_number?: string;
    registration_number?: string;
    hourly_rate?: number;
  }) => {
    const res = await apiRequest('/machines', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  update: async (id: string, payload: any) => {
    const res = await apiRequest(`/machines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  delete: async (id: string) => {
    return apiRequest(`/machines/${id}`, { method: 'DELETE' });
  },
};

export const DailyLedgerService = {
  getAll: async (filters?: { date?: string; type?: 'earnings' | 'expense' }) => {
    const res = await apiRequest('/daily-entries', { params: filters });
    return res.data;
  },

  create: async (payload: {
    entry_date: string;
    type: 'earnings' | 'expense';
    description: string;
    amount: number;
    payment_type?: 'cash' | 'online' | 'credit';
    notes?: string;
  }) => {
    const res = await apiRequest('/daily-entries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  update: async (
    id: string | number,
    payload: Partial<{
      entry_date: string;
      type: 'earnings' | 'expense';
      description: string;
      amount: number;
      payment_type: 'cash' | 'online' | 'credit';
      notes: string;
    }>
  ) => {
    const res = await apiRequest(`/daily-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  delete: async (id: string | number) => {
    return apiRequest(`/daily-entries/${id}`, { method: 'DELETE' });
  },

  getSummary: async (date?: string) => {
    const res = await apiRequest('/daily-entries/summary', {
      params: date ? { date } : undefined,
    });
    return res.data;
  },
};

export const MachineEntryService = {
  /**
   * Get machine entries with flexible filtering:
   *   - { date }              → single-day (backward compat)
   *   - { from_date, to_date } → date range (multi-day)
   *   - { machine_id }        → filter by machine
   *   - { customer_id }       → filter by customer
   *   - { status }            → filter by work status ('ongoing' | 'completed')
   *   - { q }                 → search term
   */
  getAll: async (filters?: {
    date?: string;
    from_date?: string;
    to_date?: string;
    machine_id?: string;
    customer_id?: string;
    status?: 'ongoing' | 'completed';
    q?: string;
  }) => {
    const res = await apiRequest('/machine-entries', { params: filters });
    return res.data;
  },

  /**
   * Create a machine / work entry.
   */
  create: async (payload: {
    machine_id: string | number;
    customer_id?: string | number | null;
    entry_date: string;          // पासून तारीख (from date)
    to_date?: string | null;     // पर्यंत तारीख (to date) — null for single day
    location?: string;
    work_description?: string;
    work_type?: 'foot' | 'hours' | 'theka';
    rate?: number;
    quantity?: number;
    hours_or_trips?: number;
    hours_unit?: 'hours' | 'trips';
    amount: number;
    advance_amount?: number;
    balance_amount?: number;
    payment_type?: 'cash' | 'online' | 'credit';
    status?: 'ongoing' | 'completed';
    notes?: string;
  }) => {
    const res = await apiRequest('/machine-entries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  update: async (id: string | number, payload: {
    machine_id?: string | number;
    customer_id?: string | number | null;
    entry_date?: string;
    to_date?: string | null;
    location?: string;
    work_description?: string;
    work_type?: 'foot' | 'hours' | 'theka';
    rate?: number;
    quantity?: number;
    hours_or_trips?: number;
    hours_unit?: 'hours' | 'trips';
    amount?: number;
    advance_amount?: number;
    balance_amount?: number;
    payment_type?: 'cash' | 'online' | 'credit';
    status?: 'ongoing' | 'completed';
    notes?: string;
  }) => {
    const res = await apiRequest(`/machine-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  delete: async (id: string | number) => {
    return apiRequest(`/machine-entries/${id}`, { method: 'DELETE' });
  },

  getSummary: async (date?: string) => {
    const res = await apiRequest('/machine-entries/summary', {
      params: date ? { date } : undefined,
    });
    return res.data;
  },
};

export const ReportService = {
  getDateReport: async (from?: string, to?: string) => {
    const res = await apiRequest('/reports/date-range', {
      params: { from, to },
    });
    return res.data;
  },

  getMonthlyReport: async (year?: number, month?: number) => {
    const res = await apiRequest('/reports/monthly', {
      params: { year, month },
    });
    return res.data;
  },

  getUdharReport: async () => {
    const res = await apiRequest('/reports/udhar');
    return res.data;
  },
};

export const NotificationService = {
  saveFcmToken: async (fcm_token: string) => {
    return apiRequest('/user/fcm-token', {
      method: 'POST',
      body: JSON.stringify({ fcm_token }),
    });
  },

  getAll: async () => {
    const res = await apiRequest('/notifications');
    return res.data;
  },

  markAllRead: async () => {
    return apiRequest('/notifications/read-all', {
      method: 'POST',
    });
  },

  sendTestNotification: async () => {
    return apiRequest('/notifications/send-test', {
      method: 'POST',
    });
  },
};

export const LoanService = {
  getAll: async (status?: string) => {
    const res = await apiRequest('/loans', {
      params: status ? { status } : undefined,
    });
    return res.data;
  },

  getDashboardSummary: async () => {
    const res = await apiRequest('/loans/summary/dashboard');
    return res.data;
  },

  getById: async (id: string | number) => {
    const res = await apiRequest(`/loans/${id}`);
    return res.data;
  },

  create: async (data: any) => {
    const res = await apiRequest('/loans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  update: async (id: string | number, data: any) => {
    const res = await apiRequest(`/loans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  delete: async (id: string | number) => {
    return apiRequest(`/loans/${id}`, {
      method: 'DELETE',
    });
  },

  payInstallment: async (loanId: string | number, installmentId: string | number, payload: any) => {
    const res = await apiRequest(`/loans/${loanId}/installments/${installmentId}/pay`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res;
  },

  unpayInstallment: async (loanId: string | number, installmentId: string | number) => {
    const res = await apiRequest(`/loans/${loanId}/installments/${installmentId}/unpay`, {
      method: 'POST',
    });
    return res;
  },
};



