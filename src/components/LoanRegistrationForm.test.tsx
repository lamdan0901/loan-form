import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import LoanRegistrationForm from "./LoanRegistrationForm";
import { saveLoanRegistration } from "../services/jsonbin";

vi.mock("../services/jsonbin", () => ({
  saveLoanRegistration: vi.fn(),
}));

describe("LoanRegistrationForm — rendering", () => {
  it("renders the form heading", () => {
    render(<LoanRegistrationForm />);
    expect(screen.getByText("Đăng Ký Vay Vốn")).toBeInTheDocument();
  });

  it("renders the principal input", () => {
    render(<LoanRegistrationForm />);
    expect(
      screen.getByRole("textbox", { name: /số tiền vay/i }),
    ).toBeInTheDocument();
  });

  it("renders the term input", () => {
    render(<LoanRegistrationForm />);
    expect(
      screen.getByRole("spinbutton", { name: /kỳ hạn/i }),
    ).toBeInTheDocument();
  });

  it("renders the interest rate input", () => {
    render(<LoanRegistrationForm />);
    expect(
      screen.getByRole("spinbutton", { name: /lãi suất/i }),
    ).toBeInTheDocument();
  });

  it("renders the calculate button", () => {
    render(<LoanRegistrationForm />);
    expect(
      screen.getByRole("button", { name: /tính toán/i }),
    ).toBeInTheDocument();
  });

  it("does not show the schedule table initially", () => {
    render(<LoanRegistrationForm />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});

describe("LoanRegistrationForm — validation errors", () => {
  it("shows all three validation errors when submitting an empty form", async () => {
    render(<LoanRegistrationForm />);
    await userEvent.click(screen.getByRole("button", { name: /tính toán/i }));
    expect(screen.getByText(/số tiền vay hợp lệ/i)).toBeInTheDocument();
    expect(
      screen.getByText(/kỳ hạn phải là số nguyên dương/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/lãi suất phải lớn hơn hoặc bằng/i),
    ).toBeInTheDocument();
  });

  it("shows only principal error when only principal is invalid", async () => {
    render(<LoanRegistrationForm />);
    await userEvent.type(
      screen.getByRole("spinbutton", { name: /kỳ hạn/i }),
      "12",
    );
    await userEvent.type(
      screen.getByRole("spinbutton", { name: /lãi suất/i }),
      "12",
    );
    await userEvent.click(screen.getByRole("button", { name: /tính toán/i }));
    expect(screen.getByText(/số tiền vay hợp lệ/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/kỳ hạn phải là số nguyên dương/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/lãi suất phải lớn hơn hoặc bằng/i),
    ).not.toBeInTheDocument();
  });

  it("clears an error when the user starts typing in that field", async () => {
    render(<LoanRegistrationForm />);
    // Submit to trigger errors
    await userEvent.click(screen.getByRole("button", { name: /tính toán/i }));
    expect(
      screen.getByText(/kỳ hạn phải là số nguyên dương/i),
    ).toBeInTheDocument();

    // Type into term field — error should disappear
    await userEvent.type(
      screen.getByRole("spinbutton", { name: /kỳ hạn/i }),
      "12",
    );
    expect(
      screen.queryByText(/kỳ hạn phải là số nguyên dương/i),
    ).not.toBeInTheDocument();
  });
});

describe("LoanRegistrationForm — principal comma formatting", () => {
  it("auto-formats the principal field with commas as the user types", async () => {
    render(<LoanRegistrationForm />);
    const principalInput = screen.getByRole("textbox", {
      name: /số tiền vay/i,
    });
    await userEvent.type(principalInput, "12000000");
    expect(principalInput).toHaveValue("12,000,000");
  });
});

describe("LoanRegistrationForm — schedule table", () => {
  const fillAndSubmit = async (
    principal = "12000000",
    term = "12",
    interestRate = "12",
  ) => {
    render(<LoanRegistrationForm />);
    const user = userEvent.setup();
    const principalInput = screen.getByRole("textbox", {
      name: /số tiền vay/i,
    });
    const termInput = screen.getByRole("spinbutton", { name: /kỳ hạn/i });
    const interestRateInput = screen.getByRole("spinbutton", {
      name: /lãi suất/i,
    });

    await user.type(principalInput, principal);
    await user.type(termInput, term);
    await user.type(interestRateInput, interestRate);
    await user.click(screen.getByRole("button", { name: /tính toán/i }));

    return {
      user,
      principalInput,
      termInput,
      interestRateInput,
    };
  };

  it("renders the payment schedule table after a valid submission", async () => {
    await fillAndSubmit();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("renders 12 data rows for a 12-month term", async () => {
    await fillAndSubmit();
    // body rows only (exclude header row)
    const rows = screen.getAllByRole("row");
    // 1 header row + 12 data rows = 13 total
    expect(rows).toHaveLength(13);
  });

  it("table has the expected column headers", async () => {
    await fillAndSubmit();
    expect(screen.getByText("Tháng")).toBeInTheDocument();
    expect(screen.getByText("Tiền gốc")).toBeInTheDocument();
    expect(screen.getByText("Tiền lãi")).toBeInTheDocument();
    expect(screen.getByText("Tổng phải trả")).toBeInTheDocument();
    expect(screen.getByText("Dư nợ còn lại")).toBeInTheDocument();
  });

  it("first row shows month number 1", async () => {
    await fillAndSubmit();
    const tbody = screen.getByRole("table").querySelector("tbody")!;
    const firstDataRow = tbody.querySelectorAll("tr")[0];
    expect(firstDataRow.querySelector("td")?.textContent).toBe("1");
  });

  it("currency cells contain the đ suffix", async () => {
    await fillAndSubmit();
    const bodyRows = screen.getByRole("table").querySelectorAll("tbody tr");

    bodyRows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      // 4 currency columns in each data row: principal, interest, total, remaining
      expect(cells[1]?.textContent).toContain(" đ");
      expect(cells[2]?.textContent).toContain(" đ");
      expect(cells[3]?.textContent).toContain(" đ");
      expect(cells[4]?.textContent).toContain(" đ");
    });
  });

  it("shows the register button after calculation", async () => {
    await fillAndSubmit();
    expect(
      screen.getByRole("button", { name: /đăng ký vay/i }),
    ).toBeInTheDocument();
  });

  it("shows the schedule section heading after calculation", async () => {
    await fillAndSubmit();
    expect(
      screen.getByText(/chi tiết lịch trả nợ hàng tháng/i),
    ).toBeInTheDocument();
  });

  it("matches README month-1 values for 120M, 12 months, 12%/year", async () => {
    await fillAndSubmit("120000000", "12", "12");
    const firstDataRow = screen
      .getByRole("table")
      .querySelectorAll("tbody tr")[0];
    const cells = firstDataRow.querySelectorAll("td");

    expect(cells[0]?.textContent).toBe("1");
    expect(cells[1]?.textContent).toBe("10,000,000 đ");
    expect(cells[2]?.textContent).toBe("1,200,000 đ");
    expect(cells[3]?.textContent).toBe("11,200,000 đ");
    expect(cells[4]?.textContent).toBe("110,000,000 đ");
  });

  it("updates the schedule when the user recalculates with new inputs", async () => {
    const { user, termInput } = await fillAndSubmit("12000000", "12", "12");

    expect(screen.getAllByRole("row")).toHaveLength(13);

    await user.clear(termInput);
    await user.type(termInput, "6");
    await user.click(screen.getByRole("button", { name: /tính toán/i }));

    // 1 header row + 6 data rows
    expect(screen.getAllByRole("row")).toHaveLength(7);
  });
});

describe("LoanRegistrationForm — register action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends registration payload and shows success message", async () => {
    vi.mocked(saveLoanRegistration).mockResolvedValue({ recordId: "bin_123" });
    render(<LoanRegistrationForm />);
    const user = userEvent.setup();

    await user.type(
      screen.getByRole("textbox", { name: /số tiền vay/i }),
      "12000000",
    );
    await user.type(screen.getByRole("spinbutton", { name: /kỳ hạn/i }), "12");
    await user.type(
      screen.getByRole("spinbutton", { name: /lãi suất/i }),
      "12",
    );
    await user.click(screen.getByRole("button", { name: /tính toán/i }));

    await user.click(screen.getByRole("button", { name: /đăng ký vay/i }));

    expect(saveLoanRegistration).toHaveBeenCalledTimes(1);
    expect(saveLoanRegistration).toHaveBeenCalledWith(
      expect.objectContaining({
        principal: 12000000,
        termMonths: 12,
        annualInterestRate: 12,
      }),
    );

    expect(
      await screen.findByText(/đăng ký khoản vay thành công/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/mã lưu: bin_123/i)).toBeInTheDocument();
  });

  it("shows api error message when registration fails", async () => {
    vi.mocked(saveLoanRegistration).mockRejectedValue(
      new Error("JSONBin API lỗi (401)."),
    );
    render(<LoanRegistrationForm />);
    const user = userEvent.setup();

    await user.type(
      screen.getByRole("textbox", { name: /số tiền vay/i }),
      "12000000",
    );
    await user.type(screen.getByRole("spinbutton", { name: /kỳ hạn/i }), "12");
    await user.type(
      screen.getByRole("spinbutton", { name: /lãi suất/i }),
      "12",
    );
    await user.click(screen.getByRole("button", { name: /tính toán/i }));

    await user.click(screen.getByRole("button", { name: /đăng ký vay/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "JSONBin API lỗi (401).",
    );
  });

  it("disables register button while submitting", async () => {
    let resolveRequest: ((value: { recordId: string }) => void) | undefined;
    vi.mocked(saveLoanRegistration).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    render(<LoanRegistrationForm />);
    const user = userEvent.setup();

    await user.type(
      screen.getByRole("textbox", { name: /số tiền vay/i }),
      "12000000",
    );
    await user.type(screen.getByRole("spinbutton", { name: /kỳ hạn/i }), "12");
    await user.type(
      screen.getByRole("spinbutton", { name: /lãi suất/i }),
      "12",
    );
    await user.click(screen.getByRole("button", { name: /tính toán/i }));

    const registerButton = screen.getByRole("button", { name: /đăng ký/i });
    await user.click(registerButton);

    expect(
      screen.getByRole("button", { name: /đang gửi đăng ký/i }),
    ).toBeDisabled();
    resolveRequest?.({ recordId: "bin_delayed" });
    expect(await screen.findByText(/mã lưu: bin_delayed/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /đã đăng ký vay/i }),
    ).toBeDisabled();
  });

  it("re-enables register button when recalculating after success", async () => {
    vi.mocked(saveLoanRegistration).mockResolvedValue({ recordId: "bin_123" });
    render(<LoanRegistrationForm />);
    const user = userEvent.setup();

    await user.type(
      screen.getByRole("textbox", { name: /số tiền vay/i }),
      "12000000",
    );
    await user.type(screen.getByRole("spinbutton", { name: /kỳ hạn/i }), "12");
    await user.type(
      screen.getByRole("spinbutton", { name: /lãi suất/i }),
      "12",
    );
    await user.click(screen.getByRole("button", { name: /tính toán/i }));

    await user.click(screen.getByRole("button", { name: /đăng ký vay/i }));
    expect(
      await screen.findByRole("button", { name: /đã đăng ký vay/i }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /tính toán/i }));

    expect(
      screen.getByRole("button", { name: /đăng ký vay ngay/i }),
    ).toBeEnabled();
  });

  it("re-enables register button when any input changes after success", async () => {
    vi.mocked(saveLoanRegistration).mockResolvedValue({ recordId: "bin_456" });
    render(<LoanRegistrationForm />);
    const user = userEvent.setup();

    await user.type(
      screen.getByRole("textbox", { name: /số tiền vay/i }),
      "12000000",
    );
    await user.type(screen.getByRole("spinbutton", { name: /kỳ hạn/i }), "12");
    await user.type(
      screen.getByRole("spinbutton", { name: /lãi suất/i }),
      "12",
    );
    await user.click(screen.getByRole("button", { name: /tính toán/i }));

    await user.click(screen.getByRole("button", { name: /đăng ký vay/i }));
    expect(
      await screen.findByRole("button", { name: /đã đăng ký vay/i }),
    ).toBeDisabled();

    const termInput = screen.getByRole("spinbutton", { name: /kỳ hạn/i });
    await user.clear(termInput);
    await user.type(termInput, "24");

    expect(
      screen.getByRole("button", { name: /đăng ký vay ngay/i }),
    ).toBeEnabled();
  });
});

describe("LoanRegistrationForm — fireEvent submit path", () => {
  it("submits the form via Enter key", async () => {
    render(<LoanRegistrationForm />);
    const form = document.querySelector("form")!;
    fireEvent.submit(form);
    // validation errors should appear
    expect(await screen.findByText(/số tiền vay hợp lệ/i)).toBeInTheDocument();
  });
});
