// Taux de change fixes simulés (Base: XAF/XOF)
// 1 EUR = 655.957 XAF/XOF
const EXCHANGE_RATES: Record<string, number> = {
  'XAF': 1,
  'XOF': 1,
  'EUR': 1 / 655.957,
  'USD': 1 / 610.50, // approximatif
  'GBP': 1 / 760.20,
  'CAD': 1 / 450.30
};

const CURRENCY_LOCALES: Record<string, string> = {
  'XAF': 'fr-FR',
  'XOF': 'fr-FR',
  'EUR': 'fr-FR',
  'USD': 'en-US',
  'GBP': 'en-GB',
  'CAD': 'en-CA'
};

/**
 * Formate un montant de base en XAF vers la devise demandée.
 * @param amountInXAF Montant original en FCFA (XAF)
 * @param targetCurrency Code de la devise (Ex: 'EUR', 'USD', 'XAF')
 * @returns string formatée avec le symbole de la devise
 */
export const formatPrice = (amountInXAF: number, targetCurrency: string = 'XAF'): string => {
  const rate = EXCHANGE_RATES[targetCurrency] || 1;
  const locale = CURRENCY_LOCALES[targetCurrency] || 'fr-FR';
  const convertedAmount = amountInXAF * rate;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: targetCurrency,
    maximumFractionDigits: (targetCurrency === 'XAF' || targetCurrency === 'XOF') ? 0 : 2
  }).format(convertedAmount);
};
