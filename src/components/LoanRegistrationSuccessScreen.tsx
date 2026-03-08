type LoanRegistrationSuccessScreenProps = {
  message: string;
  onBack: () => void;
};

export const LoanRegistrationSuccessScreen = ({
  message,
  onBack,
}: LoanRegistrationSuccessScreenProps) => {
  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-emerald-200 bg-white p-8 shadow-xl text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-slate-800">
          Đăng ký khoản vay thành công
        </h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Quay lại trang Đăng Ký Vay Vốn
          </button>
        </div>
      </div>
    </div>
  );
};
