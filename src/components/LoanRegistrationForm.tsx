import { useCallback, useState } from "react";
import BigNumber from "bignumber.js";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type LoanScheduleRow,
  type LoanFormData,
  formatCurrencyInput,
  getRawNumber,
  MONTHS_PER_YEAR,
  PERCENT_DIVISOR,
  MIN_TERM_MONTHS,
  MAX_TERM_MONTHS,
  MIN_INTEREST_RATE,
  MAX_INTEREST_RATE,
} from "../hooks/useLoanCalculator";
import { saveLoanRegistration } from "../services/jsonbin";
import { formatNumberDisplay } from "../utils/numberFormat";
import { loanRegSchema } from "../schemas/loanRegSchema";

const formatCurrency = (value: number): string => {
  return `${formatNumberDisplay(value)} đ`;
};

const inputBase =
  "w-full px-4 py-3 rounded-xl border bg-white text-slate-800 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const inputError = "border-red-400 focus:ring-red-400";
const inputNormal = "border-slate-200 hover:border-slate-300";

const LoanRegistrationForm = () => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<LoanFormData>({
    resolver: zodResolver(loanRegSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      principal: "",
      term: "",
      interestRate: "",
    },
  });

  const [schedule, setSchedule] = useState<LoanScheduleRow[]>([]);
  const [isCalculated, setIsCalculated] = useState(false);

  const [isRegistering, setIsRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isRegisteredSuccessfully, setIsRegisteredSuccessfully] =
    useState(false);

  const resetRegistrationState = useCallback(() => {
    setRegisterSuccess(null);
    setRegisterError(null);
    setIsRegisteredSuccessfully(false);
  }, []);

  const handleFormSubmit = (formData: LoanFormData) => {
    resetRegistrationState();

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

  const handleRegister = async () => {
    setIsRegistering(true);
    setRegisterSuccess(null);
    setRegisterError(null);
    setIsRegisteredSuccessfully(false);

    try {
      const formValues = getValues();
      const principal = Number(getRawNumber(formValues.principal));
      const termMonths = Number(formValues.term);
      const annualInterestRate = Number(formValues.interestRate);
      const totalInterest = schedule.reduce(
        (sum, row) => sum + row.interestPayment,
        0,
      );
      const totalPayment = schedule.reduce(
        (sum, row) => sum + row.totalPayment,
        0,
      );

      const response = await saveLoanRegistration({
        principal,
        termMonths,
        annualInterestRate,
        schedule,
        summary: {
          firstMonthPayment: schedule[0]?.totalPayment ?? 0,
          totalInterest,
          totalPayment,
        },
      });

      setRegisterSuccess(
        `Đăng ký khoản vay thành công! Mã lưu: ${response.recordId}`,
      );
      setIsRegisteredSuccessfully(true);
    } catch (error) {
      setRegisterError(
        error instanceof Error
          ? error.message
          : "Không thể đăng ký khoản vay. Vui lòng thử lại.",
      );
      setIsRegisteredSuccessfully(false);
    } finally {
      setIsRegistering(false);
    }
  };

  const totalInterest = schedule.reduce(
    (sum, row) => sum + row.interestPayment,
    0,
  );
  const totalPayment = schedule.reduce((sum, row) => sum + row.totalPayment, 0);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        <div
          style={{
            background:
              "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0ea5e9 100%)",
          }}
          className="px-8 py-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white text-2xl shrink-0">
              🏦
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white leading-normal">
                Đăng Ký Vay Vốn
              </h1>
              <p className="text-blue-100 text-sm mt-0.5">
                Tính toán lãi suất &amp; lịch trả nợ ngay lập tức
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 py-8">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label
                  htmlFor="principal"
                  className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2"
                >
                  💰 Số tiền vay (VNĐ)
                </label>
                <Controller
                  name="principal"
                  control={control}
                  render={({ field }) => (
                    <input
                      id="principal"
                      type="text"
                      inputMode="numeric"
                      value={field.value}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      onChange={(e) => {
                        resetRegistrationState();
                        field.onChange(formatCurrencyInput(e.target.value));
                      }}
                      className={`${inputBase} ${errors.principal ? inputError : inputNormal}`}
                      placeholder="Tối thiểu 100,000 VNĐ"
                    />
                  )}
                />
                {errors.principal?.message && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    {errors.principal.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="term"
                  className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2"
                >
                  📅 Kỳ hạn (tháng)
                </label>
                <input
                  id="term"
                  type="number"
                  {...register("term", {
                    onChange: resetRegistrationState,
                  })}
                  min={MIN_TERM_MONTHS}
                  max={MAX_TERM_MONTHS}
                  className={`${inputBase} ${errors.term ? inputError : inputNormal}`}
                  placeholder={`${MIN_TERM_MONTHS} – ${MAX_TERM_MONTHS} tháng`}
                />
                {errors.term?.message && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    {errors.term.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="interestRate"
                  className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2"
                >
                  📈 Lãi suất (%/năm)
                </label>
                <input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  {...register("interestRate", {
                    onChange: resetRegistrationState,
                  })}
                  min={MIN_INTEREST_RATE}
                  max={MAX_INTEREST_RATE}
                  className={`${inputBase} ${errors.interestRate ? inputError : inputNormal}`}
                  placeholder={`${MIN_INTEREST_RATE} – ${MAX_INTEREST_RATE}%`}
                />
                {errors.interestRate?.message && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    {errors.interestRate.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              style={{
                background: "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)",
              }}
              className="w-full cursor-pointer text-white font-bold py-3.5 px-6 rounded-xl shadow-md hover:opacity-90 active:scale-[0.99] transition-all duration-150 text-sm tracking-wide"
            >
              Tính toán lịch trả nợ →
            </button>
          </form>

          {isCalculated && schedule.length > 0 && (
            <div className="mt-10 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-blue-50 border border-blue-100 p-5">
                  <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">
                    Trả tháng đầu
                  </p>
                  <p className="text-xl font-bold text-blue-700">
                    {formatCurrency(schedule[0]?.totalPayment ?? 0)}
                  </p>
                </div>
                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5">
                  <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-1">
                    Tổng tiền lãi
                  </p>
                  <p className="text-xl font-bold text-amber-700">
                    {formatCurrency(totalInterest)}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
                  <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wide mb-1">
                    Tổng thanh toán
                  </p>
                  <p className="text-xl font-bold text-emerald-700">
                    {formatCurrency(totalPayment)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-slate-700 mb-3">
                  Chi tiết lịch trả nợ hàng tháng
                </h3>
                <div className="max-h-100 overflow-auto rounded-2xl border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr
                        style={{
                          background:
                            "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)",
                        }}
                      >
                        <th className="py-3 px-4 text-left text-xs font-semibold text-blue-100 uppercase tracking-wide">
                          Tháng
                        </th>
                        <th className="py-3 px-4 text-right text-xs font-semibold text-blue-100 uppercase tracking-wide">
                          Tiền gốc
                        </th>
                        <th className="py-3 px-4 text-right text-xs font-semibold text-blue-100 uppercase tracking-wide">
                          Tiền lãi
                        </th>
                        <th className="py-3 px-4 text-right text-xs font-semibold text-blue-100 uppercase tracking-wide">
                          Tổng phải trả
                        </th>
                        <th className="py-3 px-4 text-right text-xs font-semibold text-blue-100 uppercase tracking-wide">
                          Dư nợ còn lại
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((row, idx) => (
                        <tr
                          key={row.month}
                          className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-blue-50 transition-colors duration-100`}
                        >
                          <td className="py-2.5 px-4 text-left font-medium text-slate-600">
                            {row.month}
                          </td>
                          <td className="py-2.5 px-4 text-right text-slate-600">
                            {formatCurrency(row.principalPayment)}
                          </td>
                          <td className="py-2.5 px-4 text-right text-amber-600">
                            {formatCurrency(row.interestPayment)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-semibold text-blue-600">
                            {formatCurrency(row.totalPayment)}
                          </td>
                          <td className="py-2.5 px-4 text-right text-slate-400">
                            {formatCurrency(row.remainingBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6">
                <p className="text-sm text-slate-600 mb-4">
                  Bằng cách nhấn nút bên dưới, bạn xác nhận đã đọc và đồng ý với
                  các điều khoản vay vốn.
                </p>
                <button
                  onClick={handleRegister}
                  type="button"
                  disabled={isRegistering || isRegisteredSuccessfully}
                  style={{
                    background:
                      isRegistering || isRegisteredSuccessfully
                        ? undefined
                        : "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                  }}
                  className="w-full cursor-pointer sm:w-auto text-white font-bold py-3.5 px-8 rounded-xl shadow-md hover:opacity-90 active:scale-[0.99] transition-all duration-150 text-sm tracking-wide disabled:opacity-60 disabled:cursor-not-allowed bg-emerald-500"
                >
                  {isRegistering
                    ? "⏳ Đang gửi đăng ký..."
                    : isRegisteredSuccessfully
                      ? "Đã đăng ký vay"
                      : "✅ Tôi đồng ý — Đăng ký vay ngay"}
                </button>

                {registerSuccess && (
                  <div
                    className="mt-4 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3"
                    role="status"
                  >
                    <span className="text-emerald-500 text-lg mt-0.5">✓</span>
                    <p className="text-sm text-emerald-700 font-medium">
                      {registerSuccess}
                    </p>
                  </div>
                )}
                {registerError && (
                  <div
                    className="mt-4 flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3"
                    role="alert"
                  >
                    <span className="text-red-500 text-lg mt-0.5">✕</span>
                    <p className="text-sm text-red-600 font-medium">
                      {registerError}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-center text-slate-400 mt-2">
        Lãi suất tính theo phương pháp dư nợ giảm dần &bull; Chỉ mang tính tham
        khảo
      </p>
    </div>
  );
};

export default LoanRegistrationForm;
