import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  onClose?: () => void;
}
import RoleBasedAccessService from "@/services/RoleBasedAccessService";
import {
  BarChart3,
  Users,
  UserPlus,
  User,
  DollarSign,
  MessageSquare,
  Heart,
  Package,
  Calendar,
  CalendarDays,
  Settings,
  FileText,
  Shield,
  LogOut,
  Database,
} from "lucide-react";

const allMenuItems = [
  { path: "/", label: "Dashboard", icon: BarChart3, permission: "dashboard" },
  {
    path: "/members",
    label: "Member Management",
    icon: Users,
    permission: "members",
  },
  {
    path: "/new-members",
    label: "New Members",
    icon: UserPlus,
    permission: "members",
  },

  { path: "/hr", label: "Human Resources", icon: User, permission: "hr" },
  {
    path: "/finance",
    label: "Finance",
    icon: DollarSign,
    permission: "finance",
  },
  {
    path: "/messaging",
    label: "Messaging",
    icon: MessageSquare,
    permission: "messaging",
  },
  { path: "/welfare", label: "Welfare", icon: Heart, permission: "welfare" },
  {
    path: "/inventory",
    label: "Inventory",
    icon: Package,
    permission: "inventory",
  },
  {
    path: "/appointments",
    label: "Appointments",
    icon: Calendar,
    permission: "appointments",
  },
  {
    path: "/events",
    label: "Church Events",
    icon: CalendarDays,
    permission: "events",
  },
  {
    path: "/settings",
    label: "Settings",
    icon: Settings,
    permission: "settings",
  },
  {
    path: "/system-logs",
    label: "System Logs",
    icon: FileText,
    permission: "systemLogs",
  },
  { path: "/users", label: "Users", icon: Shield, permission: "users" },
];

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();

  // Add error handling for auth context
  let user, logout;
  try {
    const authContext = useAuth();
    user = authContext.user;
    logout = authContext.logout;
  } catch (error) {
    console.error('Auth context error in Sidebar:', error);
    return (
      <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
        <div className="p-3 md:p-4 text-center text-red-500 text-sm">
          Authentication Error - Please refresh the page
        </div>
      </div>
    );
  }

  // Filter menu items based on user role and permissions
  const menuItems = allMenuItems.filter((item) => {
    if (!user?.permissions) return false;

    // Admin and Pastor see ALL navigation items - no filtering needed
    if (user.role === "admin" || user.role === "pastor" || user.role === "Admin" || user.role === "Pastor") {
      return true;
    }

    // For normal users, explicitly handle appointments and welfare
    if (user.role === "user" || user.role === "User") {
      // Explicitly deny appointments for normal users
      if (item.permission === "appointments") {
        return false;
      }
      // Explicitly allow welfare for normal users
      if (item.permission === "welfare") {
        return true;
      }
    }

    // For other roles, use the existing permission system
    return user.permissions[item.permission as keyof typeof user.permissions];
  });

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full overflow-hidden">
      {/* Logo Section */}
      <div className="p-4 md:p-6 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative flex-shrink-0">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F0627183da1a04fa4b6c5a1ab36b4780e%2F24ea526264444b8ca043118a01335902?format=webp&width=800"
              alt="TSOAM Logo"
              className="h-12 md:h-20 w-12 md:w-20 object-cover rounded-full border-2 border-primary/20 shadow-lg"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-sidebar-foreground truncate">TSOAM</h1>
            <p className="text-xs md:text-sm text-sidebar-foreground/70 truncate">
              Management System
            </p>
            <div className="mt-1 text-xs text-sidebar-foreground/50 hidden md:block">
              <span>Powered by </span>
              <span className="font-semibold text-red-600">ZIONSURF</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-2 md:p-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent">
        <ul className="space-y-1 md:space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={handleNavClick}
                  className={cn(
                    "flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap md:whitespace-normal",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-4 md:h-5 w-4 md:w-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info and Logout */}
      <div className="p-3 md:p-4 border-t border-sidebar-border flex-shrink-0">
        {user && (
          <div className="space-y-2 md:space-y-3">
            <div className="text-xs md:text-sm">
              <div className="font-medium text-sidebar-foreground truncate">
                {user.name}
              </div>
              <div className="text-sidebar-foreground/70 text-xs truncate">{user.role}</div>
            </div>
            <Button
              onClick={logout}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs md:text-sm text-sidebar-foreground hover:bg-sidebar-accent/50"
            >
              <LogOut className="h-3 md:h-4 w-3 md:w-4 mr-2" />
              <span className="hidden md:inline">Logout</span>
              <span className="md:hidden">Exit</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
