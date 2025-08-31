import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Calculator, IndianRupee, TrendingDown, TrendingUp, Info, RefreshCw } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

interface TaxCalculationResult {
  totalIncome: number;
  section44adaIncome: number;
  regularTaxableIncome: number;
  section44adaTax: number;
  regularTax: number;
  recommendedScheme: 'section44ada' | 'regular';
  savings: number;
  advanceTaxSchedule: Array<{
    quarter: number;
    percentage: number;
    amount: number;
    dueDate: string;
    description: string;
  }>;
}

export default function TaxCalculator() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [manualIncome, setManualIncome] = useState("");
  const [hasHealthInsurance, setHasHealthInsurance] = useState(false);
  const [calculationResult, setCalculationResult] = useState<TaxCalculationResult | null>(null);

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

  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
    enabled: isAuthenticated,
  });

  const { data: existingCalculations } = useQuery({
    queryKey: ["/api/tax-calculations"],
    enabled: isAuthenticated,
  });

  const calculateTaxMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/tax-calculations/calculate', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to calculate tax');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setCalculationResult(data);
      toast({
        title: "Calculation Complete",
        description: "Tax calculations have been updated successfully",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Calculation Failed",
        description: error.message || "Failed to calculate tax",
        variant: "destructive",
      });
    },
  });

  const totalIncomeFromTransactions = transactions?.reduce((sum: number, txn: any) => 
    sum + parseFloat(txn.amount.toString()), 0) || 0;

  const effectiveIncome = manualIncome ? parseFloat(manualIncome) : totalIncomeFromTransactions;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateLocalTax = (income: number) => {
    // Tax slabs for FY 2024-25
    const taxSlabs = [
      { min: 0, max: 300000, rate: 0 },
      { min: 300000, max: 700000, rate: 5 },
      { min: 700000, max: 1000000, rate: 10 },
      { min: 1000000, max: 1200000, rate: 15 },
      { min: 1200000, max: 1500000, rate: 20 },
      { min: 1500000, max: Infinity, rate: 30 }
    ];

    let tax = 0;
    for (const slab of taxSlabs) {
      if (income > slab.min) {
        const taxableAmountInSlab = Math.min(income, slab.max) - slab.min;
        tax += (taxableAmountInSlab * slab.rate) / 100;
      }
    }
    
    // Add 4% Health and Education Cess
    return Math.round(tax * 1.04);
  };

  const localCalculation = effectiveIncome > 0 ? {
    totalIncome: effectiveIncome,
    section44adaIncome: effectiveIncome * 0.5,
    section44adaTax: calculateLocalTax(Math.max(0, (effectiveIncome * 0.5) - 50000)),
    regularTax: calculateLocalTax(Math.max(0, effectiveIncome - (effectiveIncome * 0.1) - 50000 - (hasHealthInsurance ? 25000 : 0))),
  } : null;

  const displayResult = calculationResult || (localCalculation ? {
    ...localCalculation,
    regularTaxableIncome: Math.max(0, effectiveIncome - (effectiveIncome * 0.1) - 50000),
    recommendedScheme: localCalculation.section44adaTax <= localCalculation.regularTax ? 'section44ada' as const : 'regular' as const,
    savings: Math.abs(localCalculation.section44adaTax - localCalculation.regularTax),
    advanceTaxSchedule: []
  } : null);

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
        <Header />
        
        <main className="p-6 space-y-6">
          {/* Income Input Section */}
          <Card className="bg-card border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Tax Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="income-from-transactions" className="text-sm font-medium">
                      Income from Transactions
                    </Label>
                    <div className="mt-1 p-3 bg-muted rounded-lg">
                      <p className="text-lg font-semibold text-foreground" data-testid="text-transaction-income">
                        {formatCurrency(totalIncomeFromTransactions)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Based on {transactions?.length || 0} transactions
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="manual-income" className="text-sm font-medium">
                      Manual Income Override
                    </Label>
                    <Input
                      id="manual-income"
                      type="number"
                      placeholder="Enter total income manually"
                      value={manualIncome}
                      onChange={(e) => setManualIncome(e.target.value)}
                      className="mt-1"
                      data-testid="input-manual-income"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty to use transaction data
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="health-insurance" className="text-sm font-medium">
                      Health Insurance Premium
                    </Label>
                    <Switch
                      id="health-insurance"
                      checked={hasHealthInsurance}
                      onCheckedChange={setHasHealthInsurance}
                      data-testid="switch-health-insurance"
                    />
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      onClick={() => calculateTaxMutation.mutate()}
                      disabled={calculateTaxMutation.isPending || totalIncomeFromTransactions === 0}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      data-testid="button-calculate-tax"
                    >
                      {calculateTaxMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <Calculator className="mr-2 h-4 w-4" />
                          Calculate Official Tax
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax Calculation Results */}
          {displayResult && (
            <>
              {/* Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Section 44ADA */}
                <Card className={`border ${displayResult.recommendedScheme === 'section44ada' ? 'border-secondary bg-secondary/5' : 'border-border'}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-foreground">Section 44ADA</CardTitle>
                      {displayResult.recommendedScheme === 'section44ada' && (
                        <Badge variant="secondary" data-testid="badge-recommended-44ada">Recommended</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Income</span>
                        <span className="font-medium" data-testid="text-44ada-total-income">
                          {formatCurrency(displayResult.totalIncome)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Presumptive Income (50%)</span>
                        <span className="font-medium" data-testid="text-44ada-presumptive-income">
                          {formatCurrency(displayResult.section44adaIncome)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Standard Deduction</span>
                        <span className="font-medium">₹50,000</span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Tax Payable</span>
                          <span className="text-xl font-bold text-foreground" data-testid="text-44ada-tax">
                            {formatCurrency(displayResult.section44adaTax)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Regular Tax */}
                <Card className={`border ${displayResult.recommendedScheme === 'regular' ? 'border-secondary bg-secondary/5' : 'border-border'}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-foreground">Regular Tax</CardTitle>
                      {displayResult.recommendedScheme === 'regular' && (
                        <Badge variant="secondary" data-testid="badge-recommended-regular">Recommended</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Income</span>
                        <span className="font-medium" data-testid="text-regular-total-income">
                          {formatCurrency(displayResult.totalIncome)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Estimated Expenses (10%)</span>
                        <span className="font-medium">
                          {formatCurrency(displayResult.totalIncome * 0.1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Standard Deduction</span>
                        <span className="font-medium">₹50,000</span>
                      </div>
                      {hasHealthInsurance && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Health Insurance</span>
                          <span className="font-medium">₹25,000</span>
                        </div>
                      )}
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Tax Payable</span>
                          <span className="text-xl font-bold text-foreground" data-testid="text-regular-tax">
                            {formatCurrency(displayResult.regularTax)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Savings Summary */}
              <Card className="bg-gradient-to-r from-secondary/10 to-accent/10 border border-secondary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        displayResult.savings > 0 ? 'bg-secondary/20' : 'bg-muted'
                      }`}>
                        {displayResult.savings > 0 ? (
                          <TrendingDown className="text-secondary h-6 w-6" />
                        ) : (
                          <TrendingUp className="text-muted-foreground h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tax Savings with {displayResult.recommendedScheme === 'section44ada' ? 'Section 44ADA' : 'Regular Tax'}</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="text-tax-savings">
                          {formatCurrency(displayResult.savings)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Recommended Scheme</p>
                      <p className="text-lg font-semibold text-foreground" data-testid="text-recommended-scheme">
                        {displayResult.recommendedScheme === 'section44ada' ? 'Section 44ADA' : 'Regular Tax'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Advance Tax Schedule */}
              {displayResult.advanceTaxSchedule && displayResult.advanceTaxSchedule.length > 0 && (
                <Card className="bg-card border border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      Advance Tax Schedule FY 2024-25
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="advance-tax-schedule">
                      {displayResult.advanceTaxSchedule.map((payment) => (
                        <div key={payment.quarter} className="p-4 border border-border rounded-lg" data-testid={`advance-tax-q${payment.quarter}`}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-foreground">Q{payment.quarter}</h4>
                            <span className="text-xs text-muted-foreground">{payment.percentage}%</span>
                          </div>
                          <p className="text-xl font-bold text-foreground mb-1" data-testid={`advance-tax-q${payment.quarter}-amount`}>
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground" data-testid={`advance-tax-q${payment.quarter}-date`}>
                            Due: {new Date(payment.dueDate).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Important Notes */}
              <Card className="bg-accent/5 border border-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <Info className="text-accent h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="font-medium text-foreground">Important Notes:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Section 44ADA allows 50% presumptive expenses without maintaining books</li>
                        <li>• Health insurance premium up to ₹25,000 is deductible under Section 80D</li>
                        <li>• Standard deduction of ₹50,000 is available for both schemes</li>
                        <li>• Advance tax is payable in quarterly installments</li>
                        <li>• This is an estimate - consult a tax professional for final calculations</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* No Income State */}
          {!displayResult && (
            <Card className="bg-card border border-border shadow-sm">
              <CardContent className="p-12 text-center">
                <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium text-foreground mb-2">No Income Data Available</p>
                <p className="text-sm text-muted-foreground">
                  Add transactions or enter manual income to calculate taxes
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
