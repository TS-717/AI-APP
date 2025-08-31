import { Link, useLocation } from "wouter";
import { 
  Calculator, 
  Upload, 
  List, 
  TrendingUp, 
  FileText, 
  Download, 
  User,
  BarChart3 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Upload Documents", href: "/upload", icon: Upload },
  { name: "Transactions", href: "/transactions", icon: List },
  { name: "Tax Calculator", href: "/tax-calculator", icon: Calculator },
  { name: "Reports", href: "/reports", icon: TrendingUp },
  { name: "Export Data", href: "/export", icon: Download },
  { name: "Profile", href: "/profile", icon: User },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const getInitials = (user: any) => {
    if (!user || typeof user !== 'object') return "U";
    const firstName = user?.firstName || "";
    const lastName = user?.lastName || "";
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || "U";
  };

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r border-border">
      {/* Sidebar Header */}
      <div className="flex items-center h-16 flex-shrink-0 px-6 bg-primary">
        <Calculator className="text-2xl text-primary-foreground mr-3" />
        <h1 className="text-xl font-bold text-primary-foreground">FreelanceTax</h1>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2" data-testid="sidebar-navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.name} href={item.href}>
              <a className={cn(
                "group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )} data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <Icon className="mr-3 text-lg" />
                {item.name}
              </a>
            </Link>
          );
        })}
      </nav>
      
      {/* User Section */}
      <div className="flex-shrink-0 p-4 border-t border-border">
        <div className="flex items-center" data-testid="user-profile-section">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-semibold" data-testid="text-user-initials">
              {getInitials(user)}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-foreground" data-testid="text-user-name">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.email || "User"}
            </p>
            <p className="text-xs text-muted-foreground" data-testid="text-user-email">
              {user?.email || ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
