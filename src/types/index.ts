export type LoanFormData = {
  principal: string;
  term: string;
  interestRate: string;
};

export type LoanFormErrors = Partial<LoanFormData>;

export type LoanScheduleRow = {
  month: number;
  principalPayment: number;
  interestPayment: number;
  totalPayment: number;
  remainingBalance: number;
};

export type LoanRegistrationSummary = {
  firstMonthPayment: number;
  totalInterest: number;
  totalPayment: number;
};

export type LoanRegistrationPayload = LoanFormData & {
  schedule: LoanScheduleRow[];
  summary: LoanRegistrationSummary;
};

export type JsonBinSaveResult = {
  recordId: string;
};

export type JsonBinResponse = {
  metadata?: {
    id?: string;
  };
  message?: string;
};
