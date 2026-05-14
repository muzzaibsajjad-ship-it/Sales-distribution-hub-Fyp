export const sanitizeTextOnly = (value) =>
  value.replace(/[^a-zA-Z\s]/g, "").replace(/\s{2,}/g, " ");

export const sanitizeAlphaNumericText = (value) =>
  value.replace(/[^a-zA-Z0-9\s,./#-]/g, "").replace(/\s{2,}/g, " ");

export const sanitizeNumberOnly = (value) => value.replace(/\D/g, "");

export const sanitizeDecimal = (value) => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length ? `${whole}.${rest.join("")}` : whole;
};

