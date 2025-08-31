import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calculator, Upload } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function RecentActivity() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  if (isLoading) {
    return (
      <Card className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3 p-3">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-3 bg-muted rounded w-12"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentTransactions = dashboardData?.recentTransactions || [];

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const createdAt = new Date(date);
    const diffInHours = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours === 1) return "1h ago";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1d ago";
    return `${diffInDays}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return <Plus className="text-secondary text-sm" />;
      case 'calculation':
        return <Calculator className="text-accent text-sm" />;
      case 'upload':
        return <Upload className="text-primary text-sm" />;
      default:
        return <Plus className="text-secondary text-sm" />;
    }
  };

  return (
    <Card className="bg-card p-6 rounded-lg border border-border shadow-sm" data-testid="recent-activity-container">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-4">
          {recentTransactions.map((transaction: any, index: number) => (
            <div key={transaction.id || index} className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg transition-colors" data-testid={`activity-item-${index}`}>
              <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                {getActivityIcon('transaction')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate" data-testid={`activity-description-${index}`}>
                  Invoice from {transaction.vendor}
                </p>
                <p className="text-xs text-muted-foreground" data-testid={`activity-amount-${index}`}>
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
              <span className="text-xs text-muted-foreground" data-testid={`activity-time-${index}`}>
                {getTimeAgo(transaction.createdAt)}
              </span>
            </div>
          ))}

          {recentTransactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground" data-testid="no-activity">
              <p>No recent activity</p>
              <p className="text-xs">Upload your first invoice to get started</p>
            </div>
          )}
        </div>
        
        <Button 
          variant="ghost"
          className="w-full mt-4 text-sm text-primary hover:bg-primary/5 py-2 rounded-lg transition-colors"
          data-testid="button-view-all-activity"
        >
          View All Activity
        </Button>
      </CardContent>
    </Card>
  );
}
