export type SalaryUnit = 'year' | 'hour' | null | undefined;

export const formatSalary = (value?: number | null, unit?: SalaryUnit) => {
  if (value == null) return '';
  const formattedValue = value.toLocaleString('en-US', {
    minimumFractionDigits: unit === 'hour' ? 2 : 0,
    maximumFractionDigits: unit === 'hour' ? 2 : 0,
  });
  const suffix = unit === 'hour' ? '/ hr' : '/ yr';
  return `$${formattedValue} ${suffix}`;
};
