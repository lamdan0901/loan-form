import { z } from "zod";
import {
  MONTHS_PER_YEAR,
  MAX_PRINCIPAL,
  MIN_TERM_MONTHS,
  MAX_TERM_MONTHS,
  MIN_INTEREST_RATE,
  MAX_INTEREST_RATE,
} from "../constants/loan";
import { formatCurrencyDisplay } from "../lib/formatters";

const getRawNumber = (value: string): string => {
  if (!value) return "";
  return value.replace(/,/g, "");
};

export const loanRegSchema = z
  .object({
    principal: z.string(),
    term: z.string(),
    interestRate: z.string(),
  })
  .superRefine((data, ctx) => {
    const rawPrincipal = getRawNumber(data.principal);
    const principalNumber = Number(rawPrincipal);
    const termNumber = Number(data.term);
    const interestRateNumber = Number(data.interestRate);

    if (
      !rawPrincipal ||
      Number.isNaN(principalNumber) ||
      principalNumber <= 0
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["principal"],
        message: "Vui lòng nhập số tiền vay hợp lệ (lớn hơn 0).",
      });
    } else if (principalNumber > MAX_PRINCIPAL) {
      ctx.addIssue({
        code: "custom",
        path: ["principal"],
        message: `Số tiền vay tối đa là ${formatCurrencyDisplay(MAX_PRINCIPAL)}.`,
      });
    }

    if (
      !data.term ||
      Number.isNaN(termNumber) ||
      !Number.isInteger(termNumber) ||
      termNumber < MIN_TERM_MONTHS
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["term"],
        message: "Kỳ hạn phải là số nguyên dương (tháng).",
      });
    } else if (termNumber > MAX_TERM_MONTHS) {
      ctx.addIssue({
        code: "custom",
        path: ["term"],
        message: `Kỳ hạn tối đa là ${MAX_TERM_MONTHS} tháng (${MAX_TERM_MONTHS / MONTHS_PER_YEAR} năm).`,
      });
    }

    if (
      !data.interestRate ||
      Number.isNaN(interestRateNumber) ||
      interestRateNumber < MIN_INTEREST_RATE
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["interestRate"],
        message: `Lãi suất phải lớn hơn hoặc bằng ${MIN_INTEREST_RATE}%/năm.`,
      });
    } else if (interestRateNumber > MAX_INTEREST_RATE) {
      ctx.addIssue({
        code: "custom",
        path: ["interestRate"],
        message: `Lãi suất tối đa là ${MAX_INTEREST_RATE}%/năm.`,
      });
    }
  });
