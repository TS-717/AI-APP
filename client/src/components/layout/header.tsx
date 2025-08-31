import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";
import { useLocation } from "wouter";

interface HeaderProps {
  onUploadClick?: () => void;
}

export default function Header({ onUploadClick }: HeaderProps) {
  const [location] = useLocation();
  
  const getPageTitle = () => {
    switch (location) {
      case "/": return "Dashboard";
      case "/upload": return "Upload Documents";
      case "/transactions": return "Transactions";
      case "/tax-calculator": return "Tax Calculator";
      case "/reports": return "Reports";
      case "/profile": return "Profile";
      default: return "FreelanceTax";
    }
  };

  const getPageSubtitle = () => {
    switch (location) {
      case "/": return "Financial Year 2024-25 Overview";
      case "/upload": return "Upload and process your invoices";
      case "/transactions": return "Manage your income transactions";
      case "/tax-calculator": return "Calculate your tax obligations";
      case "/reports": return "View financial reports and insights";
      case "/profile": return "Manage your account settings";
      default: return "";
    }
  };

  return (
    <header className="bg-card shadow-sm border-b border-border">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">
              {getPageTitle()}
            </h1>
            <p className="text-sm text-muted-foreground" data-testid="text-page-subtitle">
              {getPageSubtitle()}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={onUploadClick}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              data-testid="button-upload-invoice"
            >
              <Plus className="mr-2 h-4 w-4" />
              Upload Invoice
            </Button>
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon"
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center" data-testid="notification-count">
                  3
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
