export const REGEX = {
  IBAN: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g,
  BIC: /\b[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?\b/g,
  DATE: /\b(?:\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})\b/g,
  AMOUNT: /[-+]?(\d{1,3}(\.\d{3})*|\d+)(,\d{2}|\.\d{2})?\b/g,
  ES_ACCT: /\bES\d{20}\b/g,
  BR_CPF: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g
};
