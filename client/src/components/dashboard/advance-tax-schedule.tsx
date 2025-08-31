import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

export default function AdvanceTaxSchedule() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  if (isLoading) {
    return (
      <Card className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg font-semibold text-foreground">Advance Tax Schedule FY 2024-25</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 border border-border rounded-lg">
                <div className="h-6 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded mb-1"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const advanceTaxSchedule = dashboardData?.advanceTaxSchedule || [];
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getQuarterStatus = (quarter: number, dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const daysDiff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) return { status: "Paid", variant: "secondary" as const, message: `Paid on ${due.toLocaleDateString('en-IN')}` };
    if (daysDiff <= 30) return { status: "Due Soon", variant: "default" as const, message: `Due in ${daysDiff} days` };
    return { status: "Pending", variant: "outline" as const, message: `Due ${due.toLocaleDateString('en-IN')}` };
  };

  return (
    <Card className="bg-card p-6 rounded-lg border border-border shadow-sm" data-testid="advance-tax-schedule-container">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-lg font-semibold text-foreground">Advance Tax Schedule FY 2024-25</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {advanceTaxSchedule.map((payment: any, index: number) => {
            const quarterInfo = getQuarterStatus(payment.quarter, payment.dueDate);
            const isHighlighted = quarterInfo.status === "Due Soon";
            
            return (
              <div 
                key={payment.quarter} 
                className={`p-4 border rounded-lg ${
                  isHighlighted 
                    ? 'border-accent bg-accent/5' 
                    : 'border-border'
                }`}
                data-testid={`quarter-${payment.quarter}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground" data-testid={`quarter-${payment.quarter}-title`}>
                    {payment.description}
                  </h4>
                  <Badge 
                    variant={quarterInfo.variant}
                    className={isHighlighted ? "bg-accent text-accent-foreground" : ""}
                    data-testid={`quarter-${payment.quarter}-status`}
                  >
                    {quarterInfo.status}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-foreground" data-testid={`quarter-${payment.quarter}-amount`}>
                  {formatCurrency(payment.amount)}
                </p>
                <p 
                  className={`text-sm ${
                    isHighlighted ? 'text-accent' : 'text-muted-foreground'
                  }`}
                  data-testid={`quarter-${payment.quarter}-message`}
                >
                  {quarterInfo.message}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
