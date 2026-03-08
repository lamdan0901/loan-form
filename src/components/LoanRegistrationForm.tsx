import { zodResolver } from "@hookform/resolvers/zod";
import BigNumber from "bignumber.js";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  MAX_INTEREST_RATE,
  MAX_TERM_MONTHS,
  MIN_INTEREST_RATE,
  MIN_TERM_MONTHS,
} from "../hooks/useLoanCalculator";
import { loanRegSchema } from "../schemas/loanRegSchema";
import { saveLoanRegistration } from "../services/jsonbin";
import { LoanFormData, LoanScheduleRow } from "../types";
import {
  formatCurrencyInput,
  getRawNumber,
  formatCurrencyDisplay,
} from "../lib/formatters";
import { buildLoanSchedule } from "../lib/loan";
import { cn } from "../lib/utils";
import { LoanRegistrationSuccessScreen } from "./LoanRegistrationSuccessScreen";

const inputBase =
  "w-full px-4 py-3 rounded-xl border bg-white text-slate-800 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const inputError = "border-red-400 focus:ring-red-400";
const inputNormal = "border-slate-200 hover:border-slate-300";

export const LoanRegistrationForm = () => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
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
  const [calculatedFormData, setCalculatedFormData] =
    useState<LoanFormData | null>(null);
  const [isCalculated, setIsCalculated] = useState(false);

  const [isRegistering, setIsRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const isRegisteredSuccessfully = !!registerSuccess;

  const { totalInterest, totalPayment } = useMemo(() => {
    const interest = schedule.reduce(
      (sum, row) => sum.plus(row.interestPayment),
      new BigNumber(0),
    );
    const payment = schedule.reduce(
      (sum, row) => sum.plus(row.totalPayment),
      new BigNumber(0),
    );

    return {
      totalInterest: interest.toNumber(),
      totalPayment: payment.toNumber(),
    };
  }, [schedule]);

  const resetRegistrationState = () => {
    setRegisterSuccess(null);
    setRegisterError(null);
  };

  const handleFormSubmit = (formData: LoanFormData) => {
    resetRegistrationState();
    const newSchedule = buildLoanSchedule(formData);

    setSchedule(newSchedule);
    setCalculatedFormData(formData);
    setIsCalculated(true);
  };

  const handleRegister = async () => {
    if (!calculatedFormData || schedule.length === 0) {
      setRegisterError("Vui lòng tính toán lịch trả nợ trước khi đăng ký.");
      return;
    }

    setIsRegistering(true);
    setRegisterSuccess(null);
    setRegisterError(null);

    try {
      const response = await saveLoanRegistration({
        ...calculatedFormData,
        principal: getRawNumber(calculatedFormData.principal),
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

      // Bring the form back to an initial blank state after successful registration.
      reset({
        principal: "",
        term: "",
        interestRate: "",
      });
      setSchedule([]);
      setCalculatedFormData(null);
      setIsCalculated(false);
    } catch (error) {
      setRegisterError(
        error instanceof Error
          ? error.message
          : "Không thể đăng ký khoản vay. Vui lòng thử lại.",
      );
    } finally {
      setIsRegistering(false);
    }
  };

  if (isRegisteredSuccessfully) {
    return (
      <LoanRegistrationSuccessScreen
        message={registerSuccess}
        onBack={resetRegistrationState}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-10">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        <div
          style={{
            background:
              "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0ea5e9 100%)",
          }}
          className="p-8"
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

        <div className="p-8">
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
                      className={cn(
                        inputBase,
                        errors.principal ? inputError : inputNormal,
                      )}
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
                  className={cn(
                    inputBase,
                    errors.term ? inputError : inputNormal,
                  )}
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
                  className={cn(
                    inputBase,
                    errors.interestRate ? inputError : inputNormal,
                  )}
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
                    {formatCurrencyDisplay(schedule[0]?.totalPayment ?? 0)}
                  </p>
                </div>
                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5">
                  <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-1">
                    Tổng tiền lãi
                  </p>
                  <p className="text-xl font-bold text-amber-700">
                    {formatCurrencyDisplay(totalInterest)}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
                  <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wide mb-1">
                    Tổng thanh toán
                  </p>
                  <p className="text-xl font-bold text-emerald-700">
                    {formatCurrencyDisplay(totalPayment)}
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
                          className={cn(
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50",
                            "hover:bg-blue-50 transition-colors duration-100",
                          )}
                        >
                          <td className="py-2.5 px-4 text-left font-medium text-slate-600">
                            {row.month}
                          </td>
                          <td className="py-2.5 px-4 text-right text-slate-600">
                            {formatCurrencyDisplay(row.principalPayment)}
                          </td>
                          <td className="py-2.5 px-4 text-right text-amber-600">
                            {formatCurrencyDisplay(row.interestPayment)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-semibold text-blue-600">
                            {formatCurrencyDisplay(row.totalPayment)}
                          </td>
                          <td className="py-2.5 px-4 text-right text-slate-400">
                            {formatCurrencyDisplay(row.remainingBalance)}
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
                  disabled={isRegistering}
                  style={{
                    background: isRegistering
                      ? undefined
                      : "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                  }}
                  className="w-full cursor-pointer sm:w-auto text-white font-bold py-3.5 px-8 rounded-xl shadow-md hover:opacity-90 active:scale-[0.99] transition-all duration-150 text-sm tracking-wide disabled:opacity-60 disabled:cursor-not-allowed bg-emerald-500"
                >
                  {isRegistering
                    ? "⏳ Đang gửi đăng ký..."
                    : "✅ Tôi đồng ý — Đăng ký vay ngay"}
                </button>
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
