export interface TaxSlabs {
  min: number;
  max: number;
  rate: number;
}

export interface TaxCalculationResult {
  totalIncome: number;
  section44adaIncome: number;
  regularTaxableIncome: number;
  section44adaTax: number;
  regularTax: number;
  recommendedScheme: 'section44ada' | 'regular';
  savings: number;
  advanceTaxSchedule: AdvanceTaxPayment[];
}

export interface AdvanceTaxPayment {
  quarter: number;
  percentage: number;
  amount: number;
  dueDate: string;
  description: string;
}

export class TaxService {
  // FY 2024-25 Tax Slabs (New Tax Regime)
  private readonly taxSlabs: TaxSlabs[] = [
    { min: 0, max: 300000, rate: 0 },
    { min: 300000, max: 700000, rate: 5 },
    { min: 700000, max: 1000000, rate: 10 },
    { min: 1000000, max: 1200000, rate: 15 },
    { min: 1200000, max: 1500000, rate: 20 },
    { min: 1500000, max: Infinity, rate: 30 }
  ];

  private readonly standardDeduction = 50000;
  private readonly healthInsuranceDeduction = 25000;

  calculateTax(totalIncome: number, hasHealthInsurance: boolean = false): TaxCalculationResult {
    // Section 44ADA calculation (50% presumptive expenses)
    const section44adaIncome = totalIncome * 0.5;
    const section44adaTaxableIncome = Math.max(0, section44adaIncome - this.standardDeduction);
    const section44adaTax = this.calculateIncomeTax(section44adaTaxableIncome);

    // Regular calculation (assuming minimal actual expenses for conservative estimate)
    const actualExpenses = totalIncome * 0.1; // Conservative 10% expenses
    const regularTaxableIncome = Math.max(0, totalIncome - actualExpenses - this.standardDeduction - 
      (hasHealthInsurance ? this.healthInsuranceDeduction : 0));
    const regularTax = this.calculateIncomeTax(regularTaxableIncome);

    // Determine recommended scheme
    const recommendedScheme = section44adaTax <= regularTax ? 'section44ada' : 'regular';
    const finalTax = recommendedScheme === 'section44ada' ? section44adaTax : regularTax;
    const savings = Math.abs(section44adaTax - regularTax);

    // Calculate advance tax schedule
    const advanceTaxSchedule = this.calculateAdvanceTaxSchedule(finalTax);

    return {
      totalIncome,
      section44adaIncome,
      regularTaxableIncome,
      section44adaTax,
      regularTax,
      recommendedScheme,
      savings,
      advanceTaxSchedule
    };
  }

  private calculateIncomeTax(taxableIncome: number): number {
    let tax = 0;
    
    for (const slab of this.taxSlabs) {
      if (taxableIncome > slab.min) {
        const taxableAmountInSlab = Math.min(taxableIncome, slab.max) - slab.min;
        tax += (taxableAmountInSlab * slab.rate) / 100;
      }
    }

    // Add 4% Health and Education Cess
    tax = tax * 1.04;
    
    return Math.round(tax);
  }

  private calculateAdvanceTaxSchedule(annualTax: number): AdvanceTaxPayment[] {
    const currentYear = new Date().getFullYear();
    const financialYear = currentYear;

    return [
      {
        quarter: 1,
        percentage: 15,
        amount: Math.round(annualTax * 0.15),
        dueDate: `${financialYear}-06-15`,
        description: "Q1 (15% by 15 Jun)"
      },
      {
        quarter: 2,
        percentage: 45,
        amount: Math.round(annualTax * 0.45),
        dueDate: `${financialYear}-09-15`,
        description: "Q2 (45% by 15 Sep)"
      },
      {
        quarter: 3,
        percentage: 75,
        amount: Math.round(annualTax * 0.75),
        dueDate: `${financialYear}-12-15`,
        description: "Q3 (75% by 15 Dec)"
      },
      {
        quarter: 4,
        percentage: 100,
        amount: annualTax,
        dueDate: `${financialYear + 1}-03-15`,
        description: "Q4 (100% by 15 Mar)"
      }
    ];
  }

  calculateGST(amount: number, gstRate: number): number {
    return Math.round((amount * gstRate) / 100);
  }

  getCurrentFinancialYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 0-based month
    
    // Financial year starts from April 1
    if (month >= 4) {
      return `${year}-${(year + 1).toString().slice(-2)}`;
    } else {
      return `${year - 1}-${year.toString().slice(-2)}`;
    }
  }

  getQuarterFromDate(date: Date): number {
    const month = date.getMonth() + 1;
    if (month >= 4 && month <= 6) return 1;
    if (month >= 7 && month <= 9) return 2;
    if (month >= 10 && month <= 12) return 3;
    return 4; // Jan-Mar
  }
}

export const taxService = new TaxService();
