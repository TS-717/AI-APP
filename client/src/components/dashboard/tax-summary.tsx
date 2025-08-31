import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function TaxSummary() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  if (isLoading) {
    return (
      <Card className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg font-semibold text-foreground">Tax Calculation Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-0 animate-pulse">
          <div className="space-y-4">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = dashboardData?.metrics || {};
  const totalIncome = metrics.totalIncome || 0;
  const taxPayable = metrics.taxPayable || 0;
  
  // Calculate estimates based on available data
  const presumptiveIncome = totalIncome * 0.5;
  const regularTaxEstimate = totalIncome * 0.25; // Conservative estimate
  const savings = Math.max(0, regularTaxEstimate - taxPayable);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card className="bg-card p-6 rounded-lg border border-border shadow-sm" data-testid="tax-summary-container">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-lg font-semibold text-foreground">Tax Calculation Summary</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Section 44ADA - Recommended */}
        <div className="bg-muted/50 p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Recommended: Section 44ADA</span>
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground" data-testid="badge-best-option">
              Best Option
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Presumptive Income (50%)</span>
              <span className="font-medium text-foreground" data-testid="text-presumptive-income">
                {formatCurrency(presumptiveIncome)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax Payable</span>
              <span className="font-medium text-foreground" data-testid="text-section44ada-tax">
                {formatCurrency(taxPayable)}
              </span>
            </div>
          </div>
        </div>

        {/* Regular Tax Calculation */}
        <div className="bg-muted/30 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Regular Tax Calculation</span>
            <Badge variant="outline" className="bg-muted text-muted-foreground" data-testid="badge-alternative">
              Alternative
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Income</span>
              <span className="font-medium text-foreground" data-testid="text-total-income-tax">
                {formatCurrency(totalIncome)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax Payable (if regular)</span>
              <span className="font-medium text-foreground" data-testid="text-regular-tax">
                {formatCurrency(regularTaxEstimate)}
              </span>
            </div>
          </div>
        </div>

        {/* Savings Information */}
        <div className="mt-4 p-3 bg-secondary/5 border border-secondary/20 rounded-lg">
          <p className="text-sm text-secondary font-medium" data-testid="text-tax-savings">
            <Info className="inline mr-2 h-4 w-4" />
            You save {formatCurrency(savings)} with Section 44ADA
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
