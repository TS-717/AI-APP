import { Card, CardContent } from "@/components/ui/card";
import { IndianRupee, Receipt, Calendar, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function MetricsGrid() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="metrics-grid">
      <Card className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
              <IndianRupee className="text-secondary text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold text-foreground" data-testid="text-total-income">
                {formatCurrency((dashboardData && dashboardData.metrics) ? dashboardData.metrics.totalIncome || 0 : 0)}
              </p>
              <p className="text-sm text-secondary">+8.2% from last quarter</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <Receipt className="text-accent text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Tax Payable</p>
              <p className="text-2xl font-bold text-foreground" data-testid="text-tax-payable">
                {formatCurrency(dashboardData?.metrics?.taxPayable || 0)}
              </p>
              <p className="text-sm text-accent">Section 44ADA Applied</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calendar className="text-primary text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Next Advance Tax</p>
              <p className="text-2xl font-bold text-foreground" data-testid="text-next-advance-tax">
                {formatCurrency(dashboardData?.metrics?.nextAdvanceTax || 0)}
              </p>
              <p className="text-sm text-primary" data-testid="text-next-advance-tax-date">
                Due: {formatDate(dashboardData?.metrics?.nextAdvanceTaxDate)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
              <FileText className="text-destructive text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Pending GST</p>
              <p className="text-2xl font-bold text-foreground" data-testid="text-pending-gst">
                {formatCurrency(dashboardData?.metrics?.pendingGST || 0)}
              </p>
              <p className="text-sm text-destructive">GSTR-1 Due Soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
