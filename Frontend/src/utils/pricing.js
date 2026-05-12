export const roundPrice = (value, decimals = 2) => {
  const numericValue = Number(value) || 0;
  const factor = 10 ** decimals;
  return Math.round((numericValue + Number.EPSILON) * factor) / factor;
};

export const calculateLineTotal = (unitPrice, quantity) =>
  roundPrice(roundPrice(unitPrice) * (Number(quantity) || 0));

export const calculateOrderSubtotal = (items = [], getUnitPrice) =>
  roundPrice(
    items.reduce(
      (sum, item) => sum + calculateLineTotal(getUnitPrice(item), item.quantity),
      0
    )
  );

export const calculateOrderTotal = ({
  items = [],
  getUnitPrice = (item) => item?.sellingPrice || 0,
  discount = 0,
  deliveryCharges = 0,
}) =>
  roundPrice(
    calculateOrderSubtotal(items, getUnitPrice) -
      roundPrice(discount) +
      roundPrice(deliveryCharges)
  );

export const formatPrice = (value) =>
  roundPrice(value).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
