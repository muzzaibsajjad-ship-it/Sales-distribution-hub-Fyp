const DEFAULT_UNITS_PER_PACK = {
  carton: 12,
  packet: 10,
  box: 8,
};

const normalizeType = (stockType = "") => stockType.toString().trim().toLowerCase();

export const roundToTwo = (value = 0) => {
  const parsedValue = Number(value) || 0;
  return Math.round(parsedValue * 100) / 100;
};

export const getDefaultUnitsPerPack = (stockType = "") => {
  const normalizedType = normalizeType(stockType);
  return DEFAULT_UNITS_PER_PACK[normalizedType] || 1;
};

export const calculateAvailableUnits = (quantity = 0, unitsPerPack = 1) => {
  const parsedQuantity = Number(quantity) || 0;
  const parsedUnitsPerPack = Number(unitsPerPack) || 1;
  return parsedQuantity * parsedUnitsPerPack;
};

export const calculatePerUnitPrice = (packPrice = 0, unitsPerPack = 1) => {
  const parsedPackPrice = Number(packPrice) || 0;
  const parsedUnitsPerPack = Number(unitsPerPack) || 1;
  return parsedUnitsPerPack > 0 ? roundToTwo(parsedPackPrice / parsedUnitsPerPack) : 0;
};

export const calculateInventoryValueFromUnits = ({
  availableUnits = 0,
  purchasePrice = 0,
  unitsPerPack = 1,
  ownerType = "distributor",
}) => {
  const parsedAvailableUnits = Number(availableUnits) || 0;
  const parsedPurchasePrice = Number(purchasePrice) || 0;
  const parsedUnitsPerPack = Number(unitsPerPack) || 1;

  if (ownerType === "distributor") {
    return roundToTwo(
      parsedAvailableUnits *
        calculatePerUnitPrice(parsedPurchasePrice, parsedUnitsPerPack)
    );
  }

  return roundToTwo(parsedAvailableUnits * parsedPurchasePrice);
};
