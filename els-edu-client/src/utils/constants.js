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
