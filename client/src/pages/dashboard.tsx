import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MetricsGrid from "@/components/dashboard/metrics-grid";
import IncomeChart from "@/components/dashboard/income-chart";
import RecentActivity from "@/components/dashboard/recent-activity";
import TaxSummary from "@/components/dashboard/tax-summary";
import QuickActions from "@/components/dashboard/quick-actions";
import AdvanceTaxSchedule from "@/components/dashboard/advance-tax-schedule";
import UploadModal from "@/components/upload/upload-modal";
import { useState } from "react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 lg:pl-64">
        <Header onUploadClick={() => setIsUploadModalOpen(true)} />
        
        <main className="p-6 space-y-6">
          <MetricsGrid />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <IncomeChart />
            <RecentActivity />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TaxSummary />
            <QuickActions onUploadClick={() => setIsUploadModalOpen(true)} />
          </div>

          <AdvanceTaxSchedule />
        </main>
      </div>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />
    </div>
  );
}
