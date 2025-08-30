import os
import json
import logging
from datetime import datetime
from typing import List, Dict, Any
import uuid

DATA_DIR = 'data'
TRANSACTIONS_FILE = os.path.join(DATA_DIR, 'transactions.json')
EXPORT_DIR = os.path.join(DATA_DIR, 'exports')

# Ensure directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(EXPORT_DIR, exist_ok=True)

def load_transactions() -> List[Dict]:
    """Load all transactions from JSON file"""
    try:
        if os.path.exists(TRANSACTIONS_FILE):
            with open(TRANSACTIONS_FILE, 'r', encoding='utf-8') as f:
                transactions = json.load(f)
                return transactions if isinstance(transactions, list) else []
        return []
    except Exception as e:
        logging.error(f"Error loading transactions: {str(e)}")
        return []

def save_transactions(transactions: List[Dict]) -> None:
    """Save all transactions to JSON file"""
    try:
        # Create backup of existing file
        if os.path.exists(TRANSACTIONS_FILE):
            backup_file = f"{TRANSACTIONS_FILE}.backup"
            with open(TRANSACTIONS_FILE, 'r', encoding='utf-8') as src:
                with open(backup_file, 'w', encoding='utf-8') as dst:
                    dst.write(src.read())
        
        # Save new data
        with open(TRANSACTIONS_FILE, 'w', encoding='utf-8') as f:
            json.dump(transactions, f, indent=2, ensure_ascii=False, default=str)
            
        logging.info(f"Saved {len(transactions)} transactions to {TRANSACTIONS_FILE}")
        
    except Exception as e:
        logging.error(f"Error saving transactions: {str(e)}")
        raise Exception(f"Failed to save transaction data: {str(e)}")

def save_transaction(parsed_data: Dict, original_filepath: str, extracted_text: str) -> Dict:
    """Save a new transaction"""
    try:
        # Load existing transactions
        transactions = load_transactions()
        
        # Create transaction record
        transaction = {
            'id': str(uuid.uuid4()),
            'timestamp': datetime.now().isoformat(),
            'type': parsed_data.get('type', 'expense'),
            'amount': parsed_data.get('amount', 0),
            'date': parsed_data.get('date', datetime.now().strftime('%Y-%m-%d')),
            'client_vendor': parsed_data.get('client_vendor', 'Unknown'),
            'description': parsed_data.get('description', 'Transaction'),
            'category': parsed_data.get('category', 'other_business'),
            'gst_applicable': parsed_data.get('gst_applicable', False),
            'gst_amount': parsed_data.get('gst_amount', 0),
            'currency': parsed_data.get('currency', 'INR'),
            'confidence': parsed_data.get('confidence', 0.7),
            'original_filename': os.path.basename(original_filepath) if original_filepath else None,
            'extracted_text': extracted_text[:1000] if extracted_text else None,  # Limit text length
            'processing_notes': []
        }
        
        # Add processing notes
        if transaction['confidence'] < 0.5:
            transaction['processing_notes'].append('Low confidence parsing - please verify')
        
        if transaction['amount'] == 0:
            transaction['processing_notes'].append('No amount detected - please verify')
        
        if transaction['client_vendor'] == 'Unknown':
            transaction['processing_notes'].append('Client/vendor not identified')
        
        # Add to transactions list
        transactions.append(transaction)
        
        # Save updated transactions
        save_transactions(transactions)
        
        logging.info(f"Saved transaction: {transaction['id']} - {transaction['type']} - ₹{transaction['amount']}")
        return transaction
        
    except Exception as e:
        logging.error(f"Error saving transaction: {str(e)}")
        raise Exception(f"Failed to save transaction: {str(e)}")

def get_all_transactions() -> List[Dict]:
    """Get all transactions"""
    return load_transactions()

def get_transaction_by_id(transaction_id: str) -> Dict[str, Any] | None:
    """Get specific transaction by ID"""
    transactions = load_transactions()
    for transaction in transactions:
        if transaction.get('id') == transaction_id:
            return transaction
    return None

def delete_transaction(transaction_id: str) -> bool:
    """Delete a transaction"""
    try:
        transactions = load_transactions()
        original_count = len(transactions)
        
        transactions = [t for t in transactions if t.get('id') != transaction_id]
        
        if len(transactions) < original_count:
            save_transactions(transactions)
            logging.info(f"Deleted transaction: {transaction_id}")
            return True
        return False
        
    except Exception as e:
        logging.error(f"Error deleting transaction: {str(e)}")
        return False

def update_transaction(transaction_id: str, updated_data: Dict) -> bool:
    """Update an existing transaction"""
    try:
        transactions = load_transactions()
        
        for i, transaction in enumerate(transactions):
            if transaction.get('id') == transaction_id:
                # Update fields
                transaction.update(updated_data)
                transaction['last_updated'] = datetime.now().isoformat()
                transactions[i] = transaction
                
                save_transactions(transactions)
                logging.info(f"Updated transaction: {transaction_id}")
                return True
        
        return False
        
    except Exception as e:
        logging.error(f"Error updating transaction: {str(e)}")
        return False

def export_data() -> str:
    """Export all data for tax filing"""
    try:
        from tax_calculator import get_tax_summary, format_currency, get_tax_advice
        
        transactions = load_transactions()
        tax_summary = get_tax_summary(transactions)
        tax_advice = get_tax_advice(tax_summary)
        
        # Create comprehensive export data
        export_data = {
            'export_info': {
                'generated_on': datetime.now().isoformat(),
                'total_transactions': len(transactions),
                'date_range': get_date_range(transactions),
                'export_type': 'Complete Tax Data Export'
            },
            'tax_summary': tax_summary,
            'tax_advice': tax_advice,
            'transactions': transactions,
            'summary_by_category': tax_summary.get('category_breakdown', {}),
            'advance_tax_schedule': tax_summary.get('advance_tax_schedule', []),
            'recommendations': generate_recommendations(tax_summary)
        }
        
        # Save export file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        export_filename = f"freelancer_tax_export_{timestamp}.json"
        export_filepath = os.path.join(EXPORT_DIR, export_filename)
        
        with open(export_filepath, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False, default=str)
        
        logging.info(f"Created export file: {export_filepath}")
        return export_filepath
        
    except Exception as e:
        logging.error(f"Error creating export: {str(e)}")
        raise Exception(f"Failed to create export file: {str(e)}")

def get_date_range(transactions: List[Dict]) -> Dict:
    """Get date range of transactions"""
    if not transactions:
        return {'start_date': None, 'end_date': None}
    
    dates = [t.get('date') for t in transactions if t.get('date')]
    if not dates:
        return {'start_date': None, 'end_date': None}
    
    # Filter out None values before min/max
    valid_dates = [date for date in dates if date is not None]
    if not valid_dates:
        return {'start_date': None, 'end_date': None}
    
    return {
        'start_date': min(valid_dates),
        'end_date': max(valid_dates)
    }

def generate_recommendations(tax_summary: Dict) -> List[str]:
    """Generate tax planning recommendations"""
    recommendations = []
    
    # Income-based recommendations
    if tax_summary['total_income'] > 2000000:  # 20L+
        recommendations.append("Consider incorporating as a company for potential tax benefits at higher income levels.")
    
    # Expense ratio recommendations
    expense_ratio = (tax_summary['total_expenses'] / tax_summary['total_income']) * 100 if tax_summary['total_income'] > 0 else 0
    
    if expense_ratio < 20:
        recommendations.append("Your expense ratio is low. Review if you're claiming all eligible business expenses.")
    elif expense_ratio > 70:
        recommendations.append("High expense ratio detected. Ensure all expenses are business-related and well-documented.")
    
    # GST recommendations
    if tax_summary['total_income'] > 2000000 and tax_summary['gst_collected'] == 0:
        recommendations.append("Consider GST registration as your income exceeds ₹20L threshold.")
    
    # Investment recommendations
    if tax_summary['income_tax'] > 50000:
        recommendations.append("Consider tax-saving investments under Section 80C, 80D to reduce tax liability.")
    
    return recommendations

def get_monthly_summary(year: int | None = None, month: int | None = None) -> Dict:
    """Get summary for specific month"""
    if year is None:
        year = datetime.now().year
    if month is None:
        month = datetime.now().month
    
    transactions = load_transactions()
    
    # Filter transactions for the specified month
    monthly_transactions = []
    for transaction in transactions:
        try:
            transaction_date = datetime.strptime(transaction.get('date', ''), '%Y-%m-%d')
            if transaction_date.year == year and transaction_date.month == month:
                monthly_transactions.append(transaction)
        except:
            continue
    
    if not monthly_transactions:
        return {
            'month': f"{year}-{month:02d}",
            'total_income': 0,
            'total_expenses': 0,
            'net_profit': 0,
            'transaction_count': 0,
            'transactions': []
        }
    
    total_income = sum(t.get('amount', 0) for t in monthly_transactions if t.get('type') == 'income')
    total_expenses = sum(t.get('amount', 0) for t in monthly_transactions if t.get('type') == 'expense')
    
    return {
        'month': f"{year}-{month:02d}",
        'total_income': total_income,
        'total_expenses': total_expenses,
        'net_profit': total_income - total_expenses,
        'transaction_count': len(monthly_transactions),
        'transactions': monthly_transactions
    }
