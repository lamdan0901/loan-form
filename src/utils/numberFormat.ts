export const formatNumberDisplay = (value: number): string => {
  const flooredValue = Math.floor(value);

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(flooredValue);
};
