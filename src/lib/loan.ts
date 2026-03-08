import BigNumber from "bignumber.js";
import { LoanFormData, LoanScheduleRow } from "../types";
import { MONTHS_PER_YEAR, PERCENT_DIVISOR } from "../constants/loan";
import { getRawNumber } from "./formatters";

export const buildLoanSchedule = ({
  principal,
  term,
  interestRate,
}: LoanFormData): LoanScheduleRow[] => {
  const principalStr = getRawNumber(principal);
  let currentBalance = new BigNumber(principalStr);
  const months = new BigNumber(term);
  const annualRate = new BigNumber(interestRate);

  const monthlyRate = annualRate
    .dividedBy(MONTHS_PER_YEAR)
    .dividedBy(PERCENT_DIVISOR);
  const principalPayment = currentBalance.dividedBy(months);

  const newSchedule: LoanScheduleRow[] = [];
  const termNumber = Number(term);

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

  return newSchedule;
};
