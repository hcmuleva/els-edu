import { Menu, usePermissions, useGetIdentity, useNotify, useAuthProvider } from 'react-admin';
import { LayoutDashboard, Users, BookOpen, GraduationCap, Settings, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLocation } from 'react-router-dom';
import React, { useState } from 'react';

const CustomMenuItem = ({ to, primaryText, leftIcon, ...props }) => {
    const location = useLocation();
    const isSelected = location?.pathname === to;

    return (
        <Menu.Item
            to={to}
            primaryText={primaryText}
            leftIcon={leftIcon}
            className={cn(
                "mx-3 my-1 rounded-xl transition-all duration-200 border border-transparent",
                "hover:bg-primary/5 hover:text-primary hover:translate-x-1",
                isSelected && "bg-primary/10 text-primary font-bold shadow-sm border-primary/10"
            )}
            sx={{
                color: 'inherit',
                '& .MuiListItemIcon-root': {
                    color: 'inherit',
                    minWidth: '36px'
                },
                '& .MuiTypography-root': {
                    fontFamily: 'inherit',
                    fontSize: '0.95rem',
                }
            }}
            {...props}
        />
    );
};

const MyMenu = (props) => {
    const { permissions } = usePermissions();
    const { data: identity, isLoading } = useGetIdentity();
    const notify = useNotify();
    const authProvider = useAuthProvider();
    const [switching, setSwitching] = useState(false);
    
    const isTeacherOrAdmin = ['TEACHER', 'ADMIN', 'SUPERADMIN'].includes(permissions);

    if (isLoading) return null;

    // Logic to extract roles
    const availableRoles = identity?.user_roles && Array.isArray(identity.user_roles) 
        ? identity.user_roles.map(r => r.role) 
        : [];
    
    // Safety: Ensure current permission is in the list
    if (permissions && !availableRoles.includes(permissions)) {
        availableRoles.push(permissions); // Add current if missing
    }
    
    // De-dupe just in case
    const uniqueRoles = [...new Set(availableRoles)];
    const showRoleSwitcher = uniqueRoles.length > 1;

    const handleRoleSwitch = async (newRole) => {
        if (newRole === permissions) return;
        setSwitching(true);
        try {
            await authProvider.switchRole(newRole);
            notify("Role switched successfully. Reloading...", { type: 'success' });
            // Reload to refresh permissions and UI
            setTimeout(() => {
                 window.location.reload();
            }, 500);
        } catch (error) {
            console.error(error);
            notify(error.message || "Error switching role", { type: 'error' });
            setSwitching(false);
        }
    };

    return (
    <Menu {...props} className="bg-card h-full border-r border-border/50 space-y-2">
        {/* Spacer for fixed header */}
        <div className="h-5" /> 
        
        <div className="px-6 mb-4 text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-50">
            Main
        </div>
        <CustomMenuItem 
            to="/" 
            primaryText="Dashboard" 
            leftIcon={<LayoutDashboard size={20} />} 
        />
        <CustomMenuItem 
            to="/users" 
            primaryText="Users" 
            leftIcon={<Users size={20} />} 
        />
        
        <div className="px-6 mt-8 mb-4 text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-50">
            Learning
        </div>
        <CustomMenuItem 
            to="/lessons" 
            primaryText="Lessons" 
            leftIcon={<BookOpen size={20} />} 
        />
        <CustomMenuItem 
            to="/progress"
            primaryText="My Progress" 
            leftIcon={<GraduationCap size={20} />} 
        />
        
        {isTeacherOrAdmin && (
            <CustomMenuItem 
                to="/my-contents"
                 primaryText="My Studio"
                leftIcon={<BookOpen size={20} />}
            />
        )}

        <div className="mt-auto px-4 pb-6">
             {showRoleSwitcher ? (
                <div className="flex flex-col gap-2 p-3 rounded-xl bg-secondary/10 border border-secondary/20 shadow-sm transition-all group">
                     <div className="flex items-center gap-3">
                        <div className="relative">
                            <img 
                                src={identity?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${identity?.fullName || 'User'}`} 
                                alt="User" 
                                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                             <h4 className="text-sm font-bold text-foreground truncate">{identity?.fullName || "User"}</h4>
                             <div className="relative mt-0.5">
                                <select 
                                    disabled={switching}
                                    value={permissions} 
                                    onChange={(e) => handleRoleSwitch(e.target.value)}
                                    className="w-full bg-transparent text-xs font-bold text-primary appearance-none outline-none cursor-pointer pr-4"
                                >
                                    {uniqueRoles.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                                <ChevronDown className="w-3 h-3 text-primary absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                             </div>
                        </div>
                     </div>
                </div>
             ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/10 border border-secondary/20 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                    <div className="relative">
                        <img 
                        src={identity?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${identity?.fullName || 'User'}`} 
                        alt="User" 
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-foreground truncate">{identity?.fullName || "User"}</h4>
                        <p className="text-xs text-muted-foreground truncate">{permissions || "Guest"}</p>
                    </div>
                    <Settings className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
            )}
        </div>
    </Menu>
    );
};

export default MyMenu;
