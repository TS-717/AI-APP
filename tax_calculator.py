import logging
from datetime import datetime, date
from typing import List, Dict, Any

# Indian tax rates and limits for FY 2024-25 (AY 2025-26)
TAX_BRACKETS = [
    (250000, 0),      # Up to 2.5L - 0%
    (500000, 0.05),   # 2.5L to 5L - 5%
    (750000, 0.10),   # 5L to 7.5L - 10%
    (1000000, 0.15),  # 7.5L to 10L - 15%
    (1250000, 0.20),  # 10L to 12.5L - 20%
    (1500000, 0.25),  # 12.5L to 15L - 25%
    (float('inf'), 0.30)  # Above 15L - 30%
]

SECTION_44ADA_RATE = 0.50  # 50% presumptive income for professionals
ADVANCE_TAX_SCHEDULE = [
    (0.15, "2024-06-15", "15% by June 15"),
    (0.45, "2024-09-15", "45% by September 15"),
    (0.75, "2024-12-15", "75% by December 15"),
    (1.00, "2025-03-15", "100% by March 15")
]

def calculate_taxes(transactions: List[Dict]) -> Dict[str, Any]:
    """Calculate comprehensive tax liability for freelancer"""
    try:
        # Separate income and expenses
        income_transactions = [t for t in transactions if t.get('type') == 'income']
        expense_transactions = [t for t in transactions if t.get('type') == 'expense']
        
        # Calculate totals
        total_income = sum(t.get('amount', 0) for t in income_transactions)
        total_expenses = sum(t.get('amount', 0) for t in expense_transactions)
        
        # Calculate GST totals
        total_gst_collected = sum(t.get('gst_amount', 0) for t in income_transactions if t.get('gst_applicable'))
        total_gst_paid = sum(t.get('gst_amount', 0) for t in expense_transactions if t.get('gst_applicable'))
        
        # Section 44ADA calculation (presumptive taxation)
        presumptive_income = total_income * SECTION_44ADA_RATE
        
        # Regular calculation
        regular_taxable_income = max(0, total_income - total_expenses)
        
        # Choose lower tax liability method
        use_presumptive = presumptive_income < regular_taxable_income or total_expenses < (total_income * 0.50)
        
        if use_presumptive:
            taxable_income = presumptive_income
            calculation_method = "Section 44ADA (Presumptive)"
            deductible_expenses = total_income * SECTION_44ADA_RATE  # 50% presumed expenses
        else:
            taxable_income = regular_taxable_income
            calculation_method = "Regular (Actual Expenses)"
            deductible_expenses = total_expenses
        
        # Calculate income tax
        income_tax = calculate_income_tax(taxable_income)
        
        # Calculate advance tax schedule
        advance_tax_schedule = calculate_advance_tax_schedule(income_tax)
        
        # GST liability (if applicable)
        gst_liability = max(0, total_gst_collected - total_gst_paid)
        
        return {
            'total_income': total_income,
            'total_expenses': total_expenses,
            'deductible_expenses': deductible_expenses,
            'taxable_income': taxable_income,
            'income_tax': income_tax,
            'calculation_method': calculation_method,
            'use_presumptive': use_presumptive,
            'advance_tax_schedule': advance_tax_schedule,
            'gst_collected': total_gst_collected,
            'gst_paid': total_gst_paid,
            'gst_liability': gst_liability,
            'total_tax_liability': income_tax + gst_liability,
            'income_count': len(income_transactions),
            'expense_count': len(expense_transactions),
            'savings_from_presumptive': max(0, calculate_income_tax(regular_taxable_income) - income_tax) if use_presumptive else 0
        }
        
    except Exception as e:
        logging.error(f"Tax calculation error: {str(e)}")
        return get_empty_tax_summary()

def calculate_income_tax(taxable_income: float) -> float:
    """Calculate income tax based on tax brackets"""
    if taxable_income <= 0:
        return 0
    
    tax = 0
    previous_bracket = 0
    
    for bracket_limit, rate in TAX_BRACKETS:
        if taxable_income <= previous_bracket:
            break
            
        taxable_in_bracket = min(taxable_income, bracket_limit) - previous_bracket
        tax += taxable_in_bracket * rate
        previous_bracket = bracket_limit
        
        if taxable_income <= bracket_limit:
            break
    
    return tax

def calculate_advance_tax_schedule(annual_tax: float) -> List[Dict]:
    """Calculate advance tax payment schedule"""
    schedule = []
    
    for cumulative_rate, due_date, description in ADVANCE_TAX_SCHEDULE:
        cumulative_amount = annual_tax * cumulative_rate
        
        # Find previous payment
        previous_paid = 0
        if schedule:
            previous_paid = schedule[-1]['cumulative_amount']
        
        installment_amount = cumulative_amount - previous_paid
        
        # Check if due date has passed
        try:
            due_date_obj = datetime.strptime(due_date, "%Y-%m-%d").date()
            is_overdue = date.today() > due_date_obj
        except:
            is_overdue = False
        
        schedule.append({
            'due_date': due_date,
            'description': description,
            'installment_amount': installment_amount,
            'cumulative_amount': cumulative_amount,
            'cumulative_rate': cumulative_rate,
            'is_overdue': is_overdue
        })
    
    return schedule

def get_tax_summary(transactions: List[Dict]) -> Dict[str, Any]:
    """Get comprehensive tax summary"""
    if not transactions:
        return get_empty_tax_summary()
    
    tax_calc = calculate_taxes(transactions)
    
    # Add summary statistics
    current_month_income = sum(
        t.get('amount', 0) for t in transactions 
        if t.get('type') == 'income' and is_current_month(t.get('date', ''))
    )
    
    current_month_expenses = sum(
        t.get('amount', 0) for t in transactions 
        if t.get('type') == 'expense' and is_current_month(t.get('date', ''))
    )
    
    # Category breakdown
    category_breakdown = get_category_breakdown(transactions)
    
    tax_calc.update({
        'current_month_income': current_month_income,
        'current_month_expenses': current_month_expenses,
        'category_breakdown': category_breakdown,
        'effective_tax_rate': (tax_calc['income_tax'] / tax_calc['taxable_income'] * 100) if tax_calc['taxable_income'] > 0 else 0,
        'net_profit': tax_calc['total_income'] - tax_calc['deductible_expenses'],
        'profit_margin': ((tax_calc['total_income'] - tax_calc['deductible_expenses']) / tax_calc['total_income'] * 100) if tax_calc['total_income'] > 0 else 0
    })
    
    return tax_calc

def get_category_breakdown(transactions: List[Dict]) -> Dict[str, Dict]:
    """Get breakdown of transactions by category"""
    categories = {}
    
    for transaction in transactions:
        category = transaction.get('category', 'other')
        transaction_type = transaction.get('type', 'expense')
        amount = transaction.get('amount', 0)
        
        if category not in categories:
            categories[category] = {
                'income': 0,
                'expense': 0,
                'count': 0,
                'net': 0
            }
        
        if transaction_type == 'income':
            categories[category]['income'] += amount
        else:
            categories[category]['expense'] += amount
        
        categories[category]['count'] += 1
        categories[category]['net'] = categories[category]['income'] - categories[category]['expense']
    
    return categories

def is_current_month(date_str: str) -> bool:
    """Check if date is in current month"""
    try:
        transaction_date = datetime.strptime(date_str, '%Y-%m-%d')
        current_date = datetime.now()
        return (transaction_date.year == current_date.year and 
                transaction_date.month == current_date.month)
    except:
        return False

def get_empty_tax_summary() -> Dict[str, Any]:
    """Return empty tax summary structure"""
    return {
        'total_income': 0,
        'total_expenses': 0,
        'deductible_expenses': 0,
        'taxable_income': 0,
        'income_tax': 0,
        'calculation_method': 'No data',
        'use_presumptive': False,
        'advance_tax_schedule': [],
        'gst_collected': 0,
        'gst_paid': 0,
        'gst_liability': 0,
        'total_tax_liability': 0,
        'income_count': 0,
        'expense_count': 0,
        'savings_from_presumptive': 0,
        'current_month_income': 0,
        'current_month_expenses': 0,
        'category_breakdown': {},
        'effective_tax_rate': 0,
        'net_profit': 0,
        'profit_margin': 0
    }

def format_currency(amount: float) -> str:
    """Format amount as Indian currency"""
    return f"₹{amount:,.2f}"

def get_tax_advice(tax_summary: Dict) -> List[str]:
    """Generate personalized tax advice based on current situation"""
    advice = []
    
    if tax_summary['use_presumptive']:
        advice.append("You're using Section 44ADA presumptive taxation, which assumes 50% of your income as expenses.")
        if tax_summary['total_expenses'] > (tax_summary['total_income'] * 0.50):
            advice.append("Consider switching to regular taxation as your actual expenses exceed 50% of income.")
    
    if tax_summary['gst_liability'] > 0:
        advice.append(f"You have GST liability of {format_currency(tax_summary['gst_liability'])}. Ensure timely GST filing.")
    
    # Check advance tax
    overdue_installments = [
        installment for installment in tax_summary['advance_tax_schedule']
        if installment['is_overdue'] and installment['installment_amount'] > 0
    ]
    
    if overdue_installments:
        advice.append(f"You have {len(overdue_installments)} overdue advance tax installments. Consider paying immediately to avoid interest.")
    
    if tax_summary['total_income'] > 1000000:  # 10L threshold
        advice.append("Your income exceeds ₹10L. Consider tax planning strategies and maintain detailed records.")
    
    return advice
