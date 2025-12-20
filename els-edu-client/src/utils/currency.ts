export const formatCurrency = (amount: number, currency: 'INR' | 'USD' = 'INR'): string => {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const parseCurrency = (formattedAmount: string): number => {
  // Remove currency symbols and parse as float
  const cleaned = formattedAmount.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
};