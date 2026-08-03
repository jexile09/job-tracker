import type { SalaryCurrency, SalaryUnit } from '../types';

export type NullableSalaryUnit = SalaryUnit | null | undefined;
export type NullableSalaryCurrency = SalaryCurrency | null | undefined;

export const currencySymbols: Record<SalaryCurrency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  INR: 'Rs',
  JPY: '¥',
};

export const formatSalary = (
  value?: number | null,
  unit?: NullableSalaryUnit,
  currency?: NullableSalaryCurrency
) => {
  if (value == null) return '';
  const safeCurrency: SalaryCurrency = currency || 'USD';
  const symbol = currencySymbols[safeCurrency];
  const formattedValue = value.toLocaleString('en-US', {
    minimumFractionDigits: unit === 'hour' ? 2 : 0,
    maximumFractionDigits: unit === 'hour' ? 2 : 0,
  });

  const suffix =
    unit === 'hour'
      ? '/ hr'
      : unit === 'salary'
      ? ''
      : '/ yr';

  const base = `${safeCurrency} ${symbol}${formattedValue}`;
  return suffix ? `${base} ${suffix}` : base;
};
