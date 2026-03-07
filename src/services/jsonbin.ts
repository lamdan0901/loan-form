import { LoanScheduleRow } from "../hooks/useLoanCalculator";

interface LoanRegistrationSummary {
  firstMonthPayment: number;
  totalInterest: number;
  totalPayment: number;
}

export interface LoanRegistrationPayload {
  principal: number;
  termMonths: number;
  annualInterestRate: number;
  schedule: LoanScheduleRow[];
  summary: LoanRegistrationSummary;
}

interface JsonBinSaveResult {
  recordId: string;
}

interface JsonBinResponse {
  metadata?: {
    id?: string;
  };
  message?: string;
}

const JSONBIN_BASE_URL = "https://api.jsonbin.io/v3/b";

const getJsonBinConfig = () => {
  const masterKey = import.meta.env.VITE_JSONBIN_MASTER_KEY;
  const accessKey = import.meta.env.VITE_JSONBIN_ACCESS_KEY;
  const binId = import.meta.env.VITE_JSONBIN_BIN_ID;

  if (!masterKey) {
    throw new Error(
      "Thiếu cấu hình VITE_JSONBIN_MASTER_KEY. Không thể đăng ký khoản vay.",
    );
  }

  return { masterKey, accessKey, binId };
};

const extractErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as JsonBinResponse;
    return body?.message || `JSONBin API lỗi (${response.status}).`;
  } catch {
    return `JSONBin API lỗi (${response.status}).`;
  }
};

export const saveLoanRegistration = async (
  payload: LoanRegistrationPayload,
): Promise<JsonBinSaveResult> => {
  const { masterKey, accessKey, binId } = getJsonBinConfig();

  const endpoint = binId ? `${JSONBIN_BASE_URL}/${binId}` : JSONBIN_BASE_URL;
  const method = binId ? "PUT" : "POST";

  const response = await fetch(endpoint, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": masterKey,
      ...(accessKey ? { "X-Access-Key": accessKey } : {}),
    },
    body: JSON.stringify({
      ...payload,
      createdAt: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  const data = (await response.json()) as JsonBinResponse;
  const recordId = data?.metadata?.id || binId || "unknown";

  return { recordId };
};
