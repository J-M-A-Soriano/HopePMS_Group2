/**
 * Formats a number as Philippine Peso currency.
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Returns the currency symbol for easy use in labels or prefixes.
 */
export const CURRENCY_SYMBOL = '₱';
