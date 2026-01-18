// Role-based permissions configuration
// This maps each user role to their allowed permissions

export const PERMISSIONS_BY_ROLE = {
  SUPERADMIN: [
    "*", // Wildcard - can do everything
    "user:read",
    "user:write",
    "user:delete",
    "content:read",
    "content:write",
    "content:delete",
    "content:publish",
    "course:read",
    "course:write",
    "course:delete",
    "course:publish",
    "quiz:read",
    "quiz:write",
    "quiz:delete",
    "org:read",
    "org:write",
    "org:delete",
    "settings:read",
    "settings:write",
  ],
  ADMIN: [
    "user:read",
    "user:write",
    "content:read",
    "content:write",
    "content:delete",
    "content:publish",
    "course:read",
    "course:write",
    "course:delete",
    "course:publish",
    "quiz:read",
    "quiz:write",
    "quiz:delete",
    "org:read",
    "settings:read",
  ],
  TEACHER: [
    "content:read",
    "content:write",
    "content:publish",
    "course:read",
    "course:write",
    "course:publish",
    "quiz:read",
    "quiz:write",
    "quiz:delete",
    "student:read",
    "student:write",
  ],
  PARENT: [
    "content:read",
    "course:read",
    "quiz:read",
    "child:read",
    "child:write",
    "progress:read",
  ],
  MARKETING: ["content:read", "course:read", "analytics:read", "reports:read"],
  STUDENT: [
    "content:read",
    "course:read",
    "quiz:read",
    "quiz:attempt",
    "progress:read",
    "profile:read",
    "profile:write",
  ],
  USER: ["content:read", "profile:read", "profile:write"],
};

// Role hierarchy - higher index = higher privilege
export const ROLE_HIERARCHY = [
  "STUDENT",
  "PARENT",
  "MARKETING",
  "TEACHER",
  "ADMIN",
  "SUPERADMIN",
];

// Get role priority (higher = more privileges)
export const getRolePriority = (role) => {
  const index = ROLE_HIERARCHY.indexOf(role);
  return index === -1 ? 0 : index;
};

// Check if role1 has higher or equal privilege than role2
export const hasHigherOrEqualPrivilege = (role1, role2) => {
  return getRolePriority(role1) >= getRolePriority(role2);
};

// Get the highest priority role from an array of roles
export const getHighestRole = (roles) => {
  if (!roles || !Array.isArray(roles) || roles.length === 0) {
    return "STUDENT";
  }

  // Parse roles - they can be strings or objects like {role: "TEACHER"}
  const roleStrings = roles
    .map((r) => (typeof r === "string" ? r : r?.role))
    .filter(Boolean);

  let highest = roleStrings[0] || "STUDENT";
  for (const role of roleStrings) {
    if (getRolePriority(role) > getRolePriority(highest)) {
      highest = role;
    }
  }
  return highest;
};

// Navigation items visible to each role
// These keys correspond to navigation identifiers used in Menu.jsx
export const NAVIGATION_BY_ROLE = {
  SUPERADMIN: [
    "dashboard",
    "all-orgs",
    "my-subscriptions",
    "browse-courses",
    "progress",
    "my-studio",
    "mongo-studio",
    "analytics",
  ],
  ADMIN: ["dashboard", "manage", "my-studio", "mongo-studio", "analytics"],
  TEACHER: ["my-studio", "mongo-studio"],
  STUDENT: [
    "dashboard",
    "my-subscriptions",
    "browse-courses",
    "progress",
    "analytics",
  ],
  PARENT: ["dashboard", "progress"],
  MARKETING: ["dashboard"],
  USER: ["dashboard"],
};

// Check if a role can access a specific navigation item
export const canAccessNavItem = (role, navItem) => {
  if (!role || !navItem) return false;
  const allowedNav = NAVIGATION_BY_ROLE[role] || NAVIGATION_BY_ROLE["STUDENT"];
  return allowedNav.includes(navItem);
};

// ============================================
// Organization Configuration
// ============================================

export const DEFAULT_ORG_DOCUMENT_ID = "o77q7t80lb3jys4gqrsoue64";
export const DEFAULT_ORG_NAME = "Edu Org";

// ============================================
// Grade/Class Standard Definitions
// ============================================

/**
 * Display values for grades (what users see in UI)
 * Matches the old CLASS_STANDARDS format plus early education
 */
export const GRADES_DISPLAY = [
  "Playschool",
  "LKG",
  "UKG",
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

/**
 * Backend enum values for grades
 * These match what's stored in Strapi
 */
export const GRADES_BACKEND = [
  "PLAYSCHOOL",
  "LKG",
  "UKG",
  "FIRST",
  "SECOND",
  "THIRD",
  "FOURTH",
  "FIFTH",
  "SIXTH",
  "SEVENTH",
  "EIGHTH",
  "NINTH",
  "TENTH",
  "ELEVENTH",
  "TWELFTH",
];

/**
 * Mapping from display format to backend format
 */
const GRADE_DISPLAY_TO_BACKEND_MAP = {
  Playschool: "PLAYSCHOOL",
  LKG: "LKG",
  UKG: "UKG",
  "1st": "FIRST",
  "2nd": "SECOND",
  "3rd": "THIRD",
  "4th": "FOURTH",
  "5th": "FIFTH",
  "6th": "SIXTH",
  "7th": "SEVENTH",
  "8th": "EIGHTH",
  "9th": "NINTH",
  "10th": "TENTH",
  "11th": "ELEVENTH",
  "12th": "TWELFTH",
};

/**
 * Mapping from backend format to display format
 */
const GRADE_BACKEND_TO_DISPLAY_MAP = {
  PLAYSCHOOL: "Playschool",
  LKG: "LKG",
  UKG: "UKG",
  FIRST: "1st",
  SECOND: "2nd",
  THIRD: "3rd",
  FOURTH: "4th",
  FIFTH: "5th",
  SIXTH: "6th",
  SEVENTH: "7th",
  EIGHTH: "8th",
  NINTH: "9th",
  TENTH: "10th",
  ELEVENTH: "11th",
  TWELFTH: "12th",
};

// ============================================
// Helper Functions
// ============================================

/**
 * Convert display format (e.g., "1st", "LKG") to backend format (e.g., "FIRST", "LKG")
 * @param {string} displayValue - The grade in display format
 * @returns {string|null} The grade in backend format, or null if not found
 */
export const mapGradeToBackend = (displayValue) => {
  if (!displayValue) return null;
  return GRADE_DISPLAY_TO_BACKEND_MAP[displayValue] || null;
};

/**
 * Convert backend format (e.g., "FIRST", "LKG") to display format (e.g., "1st", "LKG")
 * @param {string} backendValue - The grade in backend format
 * @returns {string} The grade in display format, or empty string if not found
 */
export const mapGradeToDisplay = (backendValue) => {
  if (!backendValue) return "";
  return GRADE_BACKEND_TO_DISPLAY_MAP[backendValue] || "";
};

/**
 * Calculate age from date of birth
 * @param {string|Date} dob - Date of birth
 * @returns {number|null} Age in years, or null if invalid
 */
export const calculateAge = (dob) => {
  if (!dob) return null;

  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // Adjust age if birthday hasn't occurred this year yet
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age >= 0 ? age : null;
};

/**
 * Validate if a grade is valid
 * @param {string} grade - Grade to validate (can be display or backend format)
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidGrade = (grade) => {
  if (!grade) return false;
  return GRADES_DISPLAY.includes(grade) || GRADES_BACKEND.includes(grade);
};

// ============================================
// Legacy Support (for backward compatibility)
// ============================================

/**
 * @deprecated Use GRADES_DISPLAY instead
 * Kept for backward compatibility with old code
 */
export const CLASS_STANDARDS = GRADES_DISPLAY.filter(
  (g) => !["Playschool", "LKG", "UKG"].includes(g),
);

/**
 * @deprecated Use mapGradeToBackend instead
 * Maps old class_standard format (e.g., "1st") to backend "Standard_1st"
 */
export const mapClassToBackend = (cls) => {
  if (!cls) return null;
  return `Standard_${cls}`;
};

/**
 * @deprecated Use mapGradeToDisplay instead
 * Maps backend "Standard_1st" to display "1st"
 */
export const mapClassFromBackend = (val) => {
  if (!val) return "";
  return val.replace("Standard_", "");
};
