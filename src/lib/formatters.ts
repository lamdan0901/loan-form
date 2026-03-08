const formatNumberDisplay = (value: number): string => {
  const flooredValue = Math.floor(value);

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(flooredValue);
};

export const formatCurrencyDisplay = (value: number): string => {
  return `${formatNumberDisplay(value)} đ`;
};

export const formatCurrencyInput = (value: string): string => {
  if (!value) return "";
  const cleanValue = value.replace(/[^0-9]/g, "");
  return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const getRawNumber = (value: string): string => {
  if (!value) return "";
  return value.replace(/,/g, "");
};
