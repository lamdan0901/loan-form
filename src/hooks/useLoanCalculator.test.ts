import { renderHook, act } from "@testing-library/react";
import {
  useLoanCalculator,
  MONTHS_PER_YEAR,
  PERCENT_DIVISOR,
  MAX_PRINCIPAL,
  MIN_TERM_MONTHS,
  MAX_TERM_MONTHS,
  MIN_INTEREST_RATE,
  MAX_INTEREST_RATE,
} from "./useLoanCalculator";
import { formatCurrencyInput, getRawNumber } from "../lib/formatters";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
describe("Exported constants", () => {
  it("MONTHS_PER_YEAR is 12", () => expect(MONTHS_PER_YEAR).toBe(12));
  it("PERCENT_DIVISOR is 100", () => expect(PERCENT_DIVISOR).toBe(100));
  it("MAX_PRINCIPAL is 100_000_000_000", () =>
    expect(MAX_PRINCIPAL).toBe(100_000_000_000));
  it("MIN_TERM_MONTHS is 1", () => expect(MIN_TERM_MONTHS).toBe(1));
  it("MAX_TERM_MONTHS is 360", () => expect(MAX_TERM_MONTHS).toBe(360));
  it("MIN_INTEREST_RATE is 0.1", () => expect(MIN_INTEREST_RATE).toBe(0.1));
  it("MAX_INTEREST_RATE is 100", () => expect(MAX_INTEREST_RATE).toBe(100));
});

// ---------------------------------------------------------------------------
// formatCurrencyInput
// ---------------------------------------------------------------------------
describe("formatCurrencyInput", () => {
  it("returns empty string for empty input", () => {
    expect(formatCurrencyInput("")).toBe("");
  });

  it("returns the number as-is when under a thousand", () => {
    expect(formatCurrencyInput("999")).toBe("999");
  });

  it("formats thousands with a single comma", () => {
    expect(formatCurrencyInput("1000")).toBe("1,000");
  });

  it("formats millions correctly", () => {
    expect(formatCurrencyInput("12000000")).toBe("12,000,000");
  });

  it("strips non-digit characters before formatting", () => {
    expect(formatCurrencyInput("1,234,567")).toBe("1,234,567");
  });

  it("strips letters and symbols", () => {
    expect(formatCurrencyInput("abc123def")).toBe("123");
  });
});

// ---------------------------------------------------------------------------
// getRawNumber
// ---------------------------------------------------------------------------
describe("getRawNumber", () => {
  it("returns empty string for empty input", () => {
    expect(getRawNumber("")).toBe("");
  });

  it("passes through a plain number string", () => {
    expect(getRawNumber("12000000")).toBe("12000000");
  });

  it("strips all commas", () => {
    expect(getRawNumber("12,000,000")).toBe("12000000");
  });

  it("strips commas from a thousands-formatted string", () => {
    expect(getRawNumber("1,234")).toBe("1234");
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const validFormData = {
  principal: "12,000,000",
  term: "12",
  interestRate: "12",
};

const renderCalculator = (data = validFormData) =>
  renderHook(() => useLoanCalculator(data));

// ---------------------------------------------------------------------------
// validateForm — tested via calculateLoan which calls validateForm internally.
// We inspect errors state after calling calculateLoan with bad inputs.
// ---------------------------------------------------------------------------
describe("validateForm — principal", () => {
  it("sets error when principal is empty", () => {
    const { result } = renderCalculator({ ...validFormData, principal: "" });
    act(() => result.current.calculateLoan());
    expect(result.current.errors.principal).toBe(
      "Vui lòng nhập số tiền vay hợp lệ (lớn hơn 0).",
    );
  });

  it("sets error when principal is zero", () => {
    const { result } = renderCalculator({ ...validFormData, principal: "0" });
    act(() => result.current.calculateLoan());
    expect(result.current.errors.principal).toBeTruthy();
  });

  it("sets error when principal is non-numeric", () => {
    const { result } = renderCalculator({ ...validFormData, principal: "abc" });
    act(() => result.current.calculateLoan());
    expect(result.current.errors.principal).toBeTruthy();
  });

  it("sets error when principal exceeds MAX_PRINCIPAL", () => {
    const { result } = renderCalculator({
      ...validFormData,
      principal: String(MAX_PRINCIPAL + 1),
    });
    act(() => result.current.calculateLoan());
    expect(result.current.errors.principal).toBeTruthy();
  });

  it("accepts a valid principal", () => {
    const { result } = renderCalculator();
    act(() => result.current.calculateLoan());
    expect(result.current.errors.principal).toBeUndefined();
  });
});

describe("validateForm — term", () => {
  it("sets error when term is empty", () => {
    const { result } = renderCalculator({ ...validFormData, term: "" });
    act(() => result.current.calculateLoan());
    expect(result.current.errors.term).toBe(
      "Kỳ hạn phải là số nguyên dương (tháng).",
    );
  });

  it("sets error when term is zero", () => {
    const { result } = renderCalculator({ ...validFormData, term: "0" });
    act(() => result.current.calculateLoan());
    expect(result.current.errors.term).toBeTruthy();
  });

  it("sets error when term is a non-integer float", () => {
    const { result } = renderCalculator({ ...validFormData, term: "6.5" });
    act(() => result.current.calculateLoan());
    expect(result.current.errors.term).toBeTruthy();
  });

  it("sets error when term exceeds MAX_TERM_MONTHS", () => {
    const { result } = renderCalculator({
      ...validFormData,
      term: String(MAX_TERM_MONTHS + 1),
    });
    act(() => result.current.calculateLoan());
    expect(result.current.errors.term).toBeTruthy();
  });

  it("accepts a valid term", () => {
    const { result } = renderCalculator();
    act(() => result.current.calculateLoan());
    expect(result.current.errors.term).toBeUndefined();
  });
});

describe("validateForm — interestRate", () => {
  it("sets error when interestRate is empty", () => {
    const { result } = renderCalculator({ ...validFormData, interestRate: "" });
    act(() => result.current.calculateLoan());
    expect(result.current.errors.interestRate).toBe(
      `Lãi suất phải lớn hơn hoặc bằng ${MIN_INTEREST_RATE}%/năm.`,
    );
  });

  it("sets error when interestRate is zero", () => {
    const { result } = renderCalculator({
      ...validFormData,
      interestRate: "0",
    });
    act(() => result.current.calculateLoan());
    expect(result.current.errors.interestRate).toBeTruthy();
  });

  it("sets error when interestRate is below the minimum", () => {
    const { result } = renderCalculator({
      ...validFormData,
      interestRate: "0.05",
    });
    act(() => result.current.calculateLoan());
    expect(result.current.errors.interestRate).toBe(
      `Lãi suất phải lớn hơn hoặc bằng ${MIN_INTEREST_RATE}%/năm.`,
    );
  });

  it("sets error when interestRate exceeds MAX_INTEREST_RATE", () => {
    const { result } = renderCalculator({
      ...validFormData,
      interestRate: String(MAX_INTEREST_RATE + 1),
    });
    act(() => result.current.calculateLoan());
    expect(result.current.errors.interestRate).toBeTruthy();
  });

  it("accepts a valid interestRate", () => {
    const { result } = renderCalculator();
    act(() => result.current.calculateLoan());
    expect(result.current.errors.interestRate).toBeUndefined();
  });
});

describe("validateForm — all valid", () => {
  it("returns no errors and produces a schedule when all fields are valid", () => {
    const { result } = renderCalculator();
    act(() => result.current.calculateLoan());
    expect(result.current.errors).toEqual({});
    expect(result.current.schedule.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// calculateLoan — amortisation schedule
// ---------------------------------------------------------------------------
describe("calculateLoan", () => {
  const principal = 12_000_000;
  const termMonths = 12;
  const annualRate = 12;

  it("calls preventDefault when triggered by form submit", () => {
    const { result } = renderCalculator();
    let isPrevented = false;

    act(() =>
      result.current.calculateLoan({
        preventDefault: () => {
          isPrevented = true;
        },
      } as React.FormEvent<HTMLFormElement>),
    );

    expect(isPrevented).toBe(true);
  });

  it("does not produce a schedule when the form is invalid", () => {
    const { result } = renderCalculator({
      principal: "",
      term: "",
      interestRate: "",
    });
    act(() => result.current.calculateLoan());
    expect(result.current.schedule).toHaveLength(0);
    expect(result.current.isCalculated).toBe(false);
  });

  it("schedule length equals the term in months", () => {
    const { result } = renderCalculator();
    act(() => result.current.calculateLoan());
    expect(result.current.schedule).toHaveLength(termMonths);
  });

  it("sets isCalculated to true after a successful calculation", () => {
    const { result } = renderCalculator();
    act(() => result.current.calculateLoan());
    expect(result.current.isCalculated).toBe(true);
  });

  it("principal payment per month equals principal / term", () => {
    const { result } = renderCalculator();
    act(() => result.current.calculateLoan());
    const expectedPrincipalPayment = principal / termMonths;
    result.current.schedule.forEach((row) => {
      expect(row.principalPayment).toBeCloseTo(expectedPrincipalPayment, 5);
    });
  });

  it("first month interest equals principal * monthly rate", () => {
    const { result } = renderCalculator();
    act(() => result.current.calculateLoan());
    const monthlyRate = annualRate / MONTHS_PER_YEAR / PERCENT_DIVISOR;
    const expectedFirstInterest = principal * monthlyRate;
    expect(result.current.schedule[0].interestPayment).toBeCloseTo(
      expectedFirstInterest,
      5,
    );
  });

  it("totalPayment equals principalPayment + interestPayment for each row", () => {
    const { result } = renderCalculator();
    act(() => result.current.calculateLoan());
    result.current.schedule.forEach((row) => {
      expect(row.totalPayment).toBeCloseTo(
        row.principalPayment + row.interestPayment,
        5,
      );
    });
  });

  it("remaining balance after the last month is 0", () => {
    const { result } = renderCalculator();
    act(() => result.current.calculateLoan());
    const last = result.current.schedule[termMonths - 1];
    expect(last.remainingBalance).toBeCloseTo(0, 5);
  });

  it("remaining balance decreases by exactly principalPayment each month", () => {
    const { result } = renderCalculator();
    act(() => result.current.calculateLoan());
    const { schedule } = result.current;
    for (let i = 1; i < schedule.length; i++) {
      expect(
        schedule[i - 1].remainingBalance - schedule[i].remainingBalance,
      ).toBeCloseTo(schedule[i].principalPayment, 5);
    }
  });

  it("interest payments decrease over time as balance reduces", () => {
    const { result } = renderCalculator();
    act(() => result.current.calculateLoan());
    const { schedule } = result.current;
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].interestPayment).toBeLessThanOrEqual(
        schedule[i - 1].interestPayment,
      );
    }
  });

  it("total payments decrease over time for declining-principal loans", () => {
    const { result } = renderCalculator();
    act(() => result.current.calculateLoan());
    const { schedule } = result.current;
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].totalPayment).toBeLessThanOrEqual(
        schedule[i - 1].totalPayment,
      );
    }
  });

  it("month numbers are sequential starting from 1", () => {
    const { result } = renderCalculator();
    act(() => result.current.calculateLoan());
    result.current.schedule.forEach((row, idx) => {
      expect(row.month).toBe(idx + 1);
    });
  });

  it("works correctly with a single-month term", () => {
    const { result } = renderCalculator({
      principal: "1,000,000",
      term: "1",
      interestRate: "12",
    });
    act(() => result.current.calculateLoan());
    expect(result.current.schedule).toHaveLength(1);
    const row = result.current.schedule[0];
    expect(row.principalPayment).toBeCloseTo(1_000_000, 5);
    expect(row.remainingBalance).toBeCloseTo(0, 5);
  });

  it("works correctly with maximum term (360 months)", () => {
    const { result } = renderCalculator({
      principal: "100,000,000",
      term: "360",
      interestRate: "6",
    });
    act(() => result.current.calculateLoan());
    expect(result.current.schedule).toHaveLength(360);
    const last = result.current.schedule[359];
    expect(last.remainingBalance).toBeCloseTo(0, 5);
  });

  it("matches the README sample for month 1 (120M, 12 months, 12%/year)", () => {
    const { result } = renderCalculator({
      principal: "120,000,000",
      term: "12",
      interestRate: "12",
    });

    act(() => result.current.calculateLoan());

    const month1 = result.current.schedule[0];
    expect(month1.principalPayment).toBeCloseTo(10_000_000, 5);
    expect(month1.interestPayment).toBeCloseTo(1_200_000, 5);
    expect(month1.totalPayment).toBeCloseTo(11_200_000, 5);
    expect(month1.remainingBalance).toBeCloseTo(110_000_000, 5);
  });

  it("accepts exact boundary values for principal, term, and interest", () => {
    const { result } = renderCalculator({
      principal: String(MAX_PRINCIPAL),
      term: String(MAX_TERM_MONTHS),
      interestRate: String(MAX_INTEREST_RATE),
    });

    act(() => result.current.calculateLoan());

    expect(result.current.errors).toEqual({});
    expect(result.current.schedule).toHaveLength(MAX_TERM_MONTHS);
    expect(
      result.current.schedule[MAX_TERM_MONTHS - 1].remainingBalance,
    ).toBeCloseTo(0, 5);
  });

  it("handles principals that are not evenly divisible by term", () => {
    const { result } = renderCalculator({
      principal: "1,000,001",
      term: "3",
      interestRate: "12",
    });

    act(() => result.current.calculateLoan());

    expect(result.current.schedule).toHaveLength(3);
    expect(result.current.schedule[2].remainingBalance).toBeCloseTo(0, 5);
  });
});

// ---------------------------------------------------------------------------
// handleChange
// ---------------------------------------------------------------------------
describe("handleChange", () => {
  it("formats the principal field with comma separators", () => {
    const { result } = renderHook(() => useLoanCalculator());
    act(() => {
      result.current.handleChange({
        target: { name: "principal", value: "12000000" },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.formData.principal).toBe("12,000,000");
  });

  it("passes the term value through without modification", () => {
    const { result } = renderHook(() => useLoanCalculator());
    act(() => {
      result.current.handleChange({
        target: { name: "term", value: "24" },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.formData.term).toBe("24");
  });

  it("passes the interestRate value through without modification", () => {
    const { result } = renderHook(() => useLoanCalculator());
    act(() => {
      result.current.handleChange({
        target: { name: "interestRate", value: "8.5" },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.formData.interestRate).toBe("8.5");
  });

  it("clears the error for a field when that field changes", () => {
    const { result } = renderCalculator({ ...validFormData, principal: "" });
    // trigger validation to set an error
    act(() => result.current.calculateLoan());
    expect(result.current.errors.principal).toBeTruthy();

    // now change the principal field — error should clear
    act(() => {
      result.current.handleChange({
        target: { name: "principal", value: "5000000" },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.errors.principal).toBeUndefined();
  });

  it("does not clear errors for other fields when one field changes", () => {
    const { result } = renderCalculator({
      principal: "",
      term: "",
      interestRate: "",
    });
    act(() => result.current.calculateLoan());
    expect(result.current.errors.term).toBeTruthy();

    // change only principal
    act(() => {
      result.current.handleChange({
        target: { name: "principal", value: "5000000" },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    // term error should still be present
    expect(result.current.errors.term).toBeTruthy();
  });
});
