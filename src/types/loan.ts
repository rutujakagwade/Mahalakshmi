export type LoanStatus = 'active' | 'payment_due' | 'overdue' | 'completed';
export type InstallmentStatus = 'pending' | 'paid' | 'overdue';
export type LoanFrequency = 'monthly' | 'quarterly' | 'yearly';

export interface LoanInstallment {
  id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: string; // YYYY-MM-DD
  amount: number;
  status: InstallmentStatus;
  paidDate?: string | null;
  paidAmount?: number | null;
  paymentMethod?: string | null;
  notes?: string | null;
}

export interface NextInstallmentInfo {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: InstallmentStatus;
}

export interface Loan {
  id: string;
  name: string;
  loanType?: string | null;
  lenderName: string;
  accountNumber?: string | null;
  totalAmount: number;
  interestRate?: number | null;
  startDate: string;
  endDate?: string | null;
  tenureMonths?: number | null;
  emiAmount: number;
  frequency: LoanFrequency;
  firstInstallmentDate: string;
  totalInstallments: number;
  status: LoanStatus;
  reminderDaysBefore: number;
  notes?: string | null;

  // Calculated values
  paidAmount: number;
  remainingAmount: number;
  paidInstallmentsCount: number;
  pendingInstallmentsCount: number;
  progressPercentage: number;
  nextInstallment?: NextInstallmentInfo | null;
  installments?: LoanInstallment[];
  createdAt?: string | null;
}

export interface UpcomingInstallmentItem {
  loanId: string;
  loanName: string;
  lenderName: string;
  installmentId: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: InstallmentStatus;
  daysLeft: number;
}

export interface LoanDashboardSummary {
  totalLoanAmount: number;
  totalPaidAmount: number;
  totalRemainingAmount: number;
  overallProgress: number;
  activeLoansCount: number;
  completedLoansCount: number;
  overdueCount: number;
  upcomingInstallments: UpcomingInstallmentItem[];
}

export interface CreateLoanPayload {
  name: string;
  loan_type?: string;
  lender_name: string;
  account_number?: string;
  total_amount: number;
  interest_rate?: number;
  start_date: string;
  end_date?: string;
  tenure_months?: number;
  emi_amount: number;
  frequency?: LoanFrequency;
  first_installment_date: string;
  total_installments: number;
  reminder_days_before?: number;
  notes?: string;
}

export interface PayInstallmentPayload {
  paid_date?: string;
  paid_amount?: number;
  payment_method?: 'cash' | 'online' | 'bank_transfer' | 'cheque';
  notes?: string;
}

// ─── CC Karj (Cash Credit / Overdraft) Interfaces ─────────────────────────
export type CCTransactionType = 'withdraw' | 'deposit' | 'interest';

export interface CCTransaction {
  id: string;
  ccLoanId: string;
  date: string; // YYYY-MM-DD or DD/MM/YYYY
  type: CCTransactionType; // 'withdraw' (उचल), 'deposit' (जमा), 'interest' (व्याज)
  amount: number;
  description?: string;
  balanceAfter?: number;
  paymentMethod?: 'cash' | 'online' | 'cheque' | 'bank_transfer';
  createdAt?: string;
}

export interface CCLoanAccount {
  id: string;
  bankName: string; // उदा. बँक ऑफ महाराष्ट्र
  accountNumber?: string;
  sanctionLimit: number; // एकूण CC मर्यादा (₹)
  currentOutstanding: number; // वापरलेली रक्कम (₹)
  interestRate?: number; // वार्षिक व्याज दर (%)
  renewalDate?: string; // रिन्यूअल तारीख
  linkedMachine?: string; // संबंधित मशीन / तारण
  notes?: string;
  transactions: CCTransaction[];
  createdAt?: string;
}

export interface CCDashboardSummary {
  totalSanctionLimit: number;
  totalUsedAmount: number;
  totalAvailableLimit: number;
  utilizationPercentage: number;
  estimatedMonthlyInterest: number;
  totalAccountsCount: number;
}
