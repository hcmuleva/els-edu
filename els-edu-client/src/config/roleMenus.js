// Role-based menu configuration
// Each role can have different menu items and visibility rules

export const roleMenus = {
  STUDENT: [
    { to: '/', label: 'Dashboard', icon: 'LayoutDashboard', section: 'Main' },
    { to: '/progress', label: 'My Progress', icon: 'GraduationCap', section: 'Learning' },
    { to: '/lessons', label: 'Lessons', icon: 'BookOpen', section: 'Learning' },
  ],
  TEACHER: [
    { to: '/', label: 'Dashboard', icon: 'LayoutDashboard', section: 'Main' },
    { to: '/my-contents', label: 'My Contents', icon: 'FileText', section: 'Content' },
    { to: '/lessons', label: 'Lessons', icon: 'BookOpen', section: 'Learning' },
    { to: '/progress', label: 'Progress', icon: 'GraduationCap', section: 'Learning' },
  ],
  ADMIN: [
    { to: '/', label: 'Dashboard', icon: 'LayoutDashboard', section: 'Main' },
    { to: '/users', label: 'Users', icon: 'Users', section: 'Management' },
    { to: '/my-contents', label: 'My Contents', icon: 'FileText', section: 'Content' },
    { to: '/lessons', label: 'Lessons', icon: 'BookOpen', section: 'Learning' },
    { to: '/settings', label: 'Settings', icon: 'Settings', section: 'Management' },
  ],
  SUPERADMIN: [
    { to: '/', label: 'Dashboard', icon: 'LayoutDashboard', section: 'Main' },
    { to: '/users', label: 'Users', icon: 'Users', section: 'Management' },
    { to: '/my-contents', label: 'My Contents', icon: 'FileText', section: 'Content' },
    { to: '/lessons', label: 'Lessons', icon: 'BookOpen', section: 'Learning' },
    { to: '/settings', label: 'Settings', icon: 'Settings', section: 'Management' },
  ],
  EDITOR: [
    { to: '/', label: 'Dashboard', icon: 'LayoutDashboard', section: 'Main' },
    { to: '/my-contents', label: 'My Contents', icon: 'FileText', section: 'Content' },
    { to: '/lessons', label: 'Lessons', icon: 'BookOpen', section: 'Learning' },
  ],
  REVIEWER: [
    { to: '/', label: 'Dashboard', icon: 'LayoutDashboard', section: 'Main' },
    { to: '/my-contents', label: 'Review Queue', icon: 'FileText', section: 'Content' },
    { to: '/lessons', label: 'Lessons', icon: 'BookOpen', section: 'Learning' },
  ],
  PARENT: [
    { to: '/', label: 'Dashboard', icon: 'LayoutDashboard', section: 'Main' },
    { to: '/progress', label: 'Child Progress', icon: 'GraduationCap', section: 'Learning' },
  ],
  MARKETING: [
    { to: '/', label: 'Dashboard', icon: 'LayoutDashboard', section: 'Main' },
    { to: '/analytics', label: 'Analytics', icon: 'BarChart', section: 'Reports' },
  ],
};

// Default menu (fallback)
export const defaultMenu = [
  { to: '/', label: 'Dashboard', icon: 'LayoutDashboard', section: 'Main' },
];

// Get menu items for a specific role
export const getMenuForRole = (role) => {
  if (!role) return defaultMenu;
  return roleMenus[role] || defaultMenu;
};

