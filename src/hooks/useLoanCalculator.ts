import { useState, ChangeEvent, FormEvent } from "react";
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
import { LoanFormData, LoanFormErrors, LoanScheduleRow } from "../types";
import { formatCurrencyInput } from "../lib/formatters";
import { buildLoanSchedule } from "../lib/loan";

export {
  MONTHS_PER_YEAR,
  PERCENT_DIVISOR,
  MAX_PRINCIPAL,
  MIN_TERM_MONTHS,
  MAX_TERM_MONTHS,
  MIN_INTEREST_RATE,
  MAX_INTEREST_RATE,
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

  const isFormValid = (): boolean => {
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
    e?.preventDefault();

    if (!isFormValid()) return;

    const newSchedule = buildLoanSchedule(formData);
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
