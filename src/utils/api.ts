/**
 * API Client & Network Service for Mahalakshmi App
 * Connects React Native frontend with Laravel 10 Backend
 */

// Configure base URL: change to your machine's LAN IP when testing on real Android/iOS device
// e.g. 'http://192.168.1.100:8000/api' or 'http://10.0.2.2:8000/api' for Android emulator
export const API_BASE_URL = 'http://10.0.2.2:8000/api';

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
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
      setAuthToken(response.token);
    }
    return response;
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      setAuthToken(null);
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

  create: async (payload: { name: string; location?: string; phone?: string }) => {
    const res = await apiRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  update: async (id: string, payload: { name: string; location?: string; phone?: string }) => {
    const res = await apiRequest(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  delete: async (id: string) => {
    return apiRequest(`/customers/${id}`, { method: 'DELETE' });
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

  getSummary: async (date?: string) => {
    const res = await apiRequest('/daily-entries/summary', {
      params: date ? { date } : undefined,
    });
    return res.data;
  },
};

export const MachineEntryService = {
  getAll: async (filters?: { date?: string; machine_id?: string; customer_id?: string }) => {
    const res = await apiRequest('/machine-entries', { params: filters });
    return res.data;
  },

  create: async (payload: {
    machine_id: string | number;
    customer_id?: string | number | null;
    entry_date: string;
    location?: string;
    work_description?: string;
    hours_or_trips?: number;
    hours_unit?: 'hours' | 'trips';
    amount: number;
    payment_type?: 'cash' | 'online' | 'credit';
  }) => {
    const res = await apiRequest('/machine-entries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
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
};
