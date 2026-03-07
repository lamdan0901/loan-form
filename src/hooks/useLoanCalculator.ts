import { useState, ChangeEvent, FormEvent } from "react";
import BigNumber from "bignumber.js";
import {
  MONTHS_PER_YEAR,
  PERCENT_DIVISOR,
  MAX_PRINCIPAL,
  MIN_TERM_MONTHS,
  MAX_TERM_MONTHS,
  MIN_INTEREST_RATE,
  MAX_INTEREST_RATE,
} from "../constants/loan";
import { loanRegSchema } from "../schemas/loanRegSchema";

export {
  MONTHS_PER_YEAR,
  PERCENT_DIVISOR,
  MAX_PRINCIPAL,
  MIN_TERM_MONTHS,
  MAX_TERM_MONTHS,
  MIN_INTEREST_RATE,
  MAX_INTEREST_RATE,
};

export interface LoanFormData {
  principal: string;
  term: string;
  interestRate: string;
}

export interface LoanFormErrors {
  principal?: string;
  term?: string;
  interestRate?: string;
}

export interface LoanScheduleRow {
  month: number;
  principalPayment: number;
  interestPayment: number;
  totalPayment: number;
  remainingBalance: number;
}

export const formatCurrencyInput = (value: string): string => {
  if (!value) return "";
  const cleanValue = value.replace(/[^0-9]/g, "");
  return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const getRawNumber = (value: string): string => {
  if (!value) return "";
  return value.replace(/,/g, "");
};

export const useLoanCalculator = (
  initialData: LoanFormData = { principal: "", term: "", interestRate: "" },
) => {
  const [formData, setFormData] = useState<LoanFormData>(initialData);
  const [errors, setErrors] = useState<LoanFormErrors>({});
  const [schedule, setSchedule] = useState<LoanScheduleRow[]>([]);
  const [isCalculated, setIsCalculated] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let newValue = value;
    if (name === "principal") {
      newValue = formatCurrencyInput(value);
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    if (errors[name as keyof LoanFormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const parsed = loanRegSchema.safeParse(formData);

    if (parsed.success) {
      setErrors({});
      return true;
    }

    const fieldErrors = parsed.error.flatten().fieldErrors;
    const newErrors: LoanFormErrors = {
      principal: fieldErrors.principal?.[0],
      term: fieldErrors.term?.[0],
      interestRate: fieldErrors.interestRate?.[0],
    };

    setErrors(newErrors);
    return false;
  };

  const calculateLoan = (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    const principalStr = getRawNumber(formData.principal);
    let currentBalance = new BigNumber(principalStr);
    const months = new BigNumber(formData.term);
    const annualRate = new BigNumber(formData.interestRate);

    const monthlyRate = annualRate
      .dividedBy(MONTHS_PER_YEAR)
      .dividedBy(PERCENT_DIVISOR);
    const principalPayment = currentBalance.dividedBy(months);

    const newSchedule: LoanScheduleRow[] = [];
    const termNumber = Number(formData.term);

    for (let i = 1; i <= termNumber; i++) {
      const interestPayment = currentBalance.multipliedBy(monthlyRate);
      const totalPayment = principalPayment.plus(interestPayment);
      currentBalance = currentBalance.minus(principalPayment);

      if (currentBalance.isLessThan(0)) {
        currentBalance = new BigNumber(0);
      }

      newSchedule.push({
        month: i,
        principalPayment: principalPayment.toNumber(),
        interestPayment: interestPayment.toNumber(),
        totalPayment: totalPayment.toNumber(),
        remainingBalance: currentBalance.toNumber(),
      });
    }

    setSchedule(newSchedule);
    setIsCalculated(true);
  };

  return {
    formData,
    errors,
    schedule,
    isCalculated,
    handleChange,
    calculateLoan,
  };
};
