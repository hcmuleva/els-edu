export const CLASS_STANDARDS = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
  "11th",
  "12th",
];

// Helper to map "1st" -> "Standard_1st"
export const mapClassToBackend = (cls) => {
  if (!cls) return null;
  return `Standard_${cls}`;
};

// Helper to map "Standard_1st" -> "1st"
export const mapClassFromBackend = (val) => {
  if (!val) return "";
  return val.replace("Standard_", "");
};
