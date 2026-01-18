import React, { createContext, useContext, useMemo } from "react";
import { useGetIdentity, usePermissions } from "react-admin";
import { mapClassFromBackend } from "../config/constants";

const ClassContext = createContext({
  userClass: null,
  shouldFilter: false,
  isContentVisible: () => true, // Default: show everything
});

export const ClassProvider = ({ children }) => {
  const { data: identity, isLoading } = useGetIdentity();
  const { permissions } = usePermissions();

  // SuperAdmins and Admins (and Teachers?) typically see everything
  // But let's stick to the requirement: "if the user is in the class ... only give that to that user"
  // Assuming 'STUDENT' requires filtering.
  // We can check 'user_role' or 'permissions'.
  const isStudent =
    permissions === "STUDENT" || identity?.user_role === "STUDENT";
  // Use grade from identity (classStandard is mapped from grade in authProvider)
  const rawGrade = identity?.grade || identity?.classStandard;

  const userClass = rawGrade;

  // We filter if the user is a Student AND has a class assigned
  // If no class assigned, maybe show nothing or show all?
  // Let's assume strict filtering: if student, MUST match class. If no class, matches nothing.
  const shouldFilter = isStudent;

  const isContentVisible = (contentClassStandards) => {
    // 1. While loading identity, hide everything to prevent flickering
    if (isLoading) return false;

    // 2. Non-students (Admins, Teachers, etc.) see everything
    if (!shouldFilter) return true;

    // 3. Students MUST have a class assigned to see targeted content
    if (!userClass) {
      // If student has no class, they should only see general items (no specific class)
      return !contentClassStandards || contentClassStandards.length === 0;
    }

    // 4. Content with NO standards is public/general
    if (!contentClassStandards || contentClassStandards.length === 0) {
      return true;
    }

    // 5. Match user's class against content standards
    return contentClassStandards.includes(userClass);
  };

  const value = useMemo(
    () => ({
      userClass,
      shouldFilter,
      isContentVisible,
      isLoading,
    }),
    [userClass, shouldFilter, isLoading]
  );

  return (
    <ClassContext.Provider value={value}>{children}</ClassContext.Provider>
  );
};

export const useClass = () => useContext(ClassContext);
