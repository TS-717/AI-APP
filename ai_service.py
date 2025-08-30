import os
import json
import logging
from datetime import datetime
from openai import OpenAI

# the newest OpenAI model is "gpt-5" which was released August 7, 2025.
# do not change this unless explicitly requested by the user

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

def parse_financial_data(extracted_text):
    """Parse financial data from extracted text using OpenAI API"""
    
    if not openai_client:
        logging.error("OpenAI API key not found")
        raise Exception("OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.")
    
    try:
        # Create a comprehensive prompt for Indian freelancer tax context
        system_prompt = """You are an AI assistant specialized in parsing Indian business invoices and receipts for freelancers. 
        Extract financial information and categorize it according to Indian tax regulations.

        Categories for expenses:
        - business_travel: Travel expenses for business purposes
        - office_supplies: Stationery, software, equipment
        - professional_services: Legal, accounting, consulting fees
        - marketing: Advertising, promotional activities
        - utilities: Internet, phone, electricity for business use
        - rent: Office rent or home office portion
        - other_business: Other legitimate business expenses

        Categories for income:
        - freelance_income: Payment for services provided
        - consulting: Consulting fees
        - royalty: Royalty payments
        - other_income: Other types of business income

        Return JSON with these fields:
        {
            "type": "income" or "expense",
            "amount": numeric_amount,
            "date": "YYYY-MM-DD" format,
            "client_vendor": "client or vendor name",
            "description": "brief description",
            "category": "one of the categories above",
            "gst_applicable": true/false,
            "gst_amount": numeric_gst_amount_if_applicable,
            "currency": "INR" (assume INR if not specified),
            "confidence": 0.0_to_1.0_confidence_score
        }
        
        If multiple transactions are found, return the primary/largest one.
        If amount is unclear, make reasonable estimate based on context.
        """

        user_prompt = f"""Parse this invoice/receipt text and extract financial information:

        {extracted_text}
        
        Focus on finding:
        1. Transaction amount (look for ₹, Rs, INR, or numbers with currency symbols)
        2. Date of transaction
        3. Client/vendor name
        4. Type of service/product
        5. GST information if present
        
        Return valid JSON only."""

        response = openai_client.chat.completions.create(
            model="gpt-5",  # Using the newest OpenAI model
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,  # Lower temperature for more consistent parsing
            max_tokens=1000
        )

        content = response.choices[0].message.content
        if content is None:
            raise Exception("OpenAI returned empty response")
        parsed_data = json.loads(content)
        
        # Validate and clean the parsed data
        validated_data = validate_parsed_data(parsed_data)
        
        logging.info(f"AI parsed data: {validated_data}")
        return validated_data

    except json.JSONDecodeError as e:
        logging.error(f"JSON parsing error: {str(e)}")
        raise Exception("Failed to parse AI response as JSON")
    except Exception as e:
        logging.error(f"AI service error: {str(e)}")
        raise Exception(f"AI parsing failed: {str(e)}")

def validate_parsed_data(data):
    """Validate and clean parsed data"""
    try:
        validated = {}
        
        # Validate type
        validated['type'] = data.get('type', 'expense').lower()
        if validated['type'] not in ['income', 'expense']:
            validated['type'] = 'expense'
        
        # Validate amount
        amount = data.get('amount', 0)
        if isinstance(amount, str):
            # Remove currency symbols and convert to float
            amount = amount.replace('₹', '').replace('Rs', '').replace('INR', '').replace(',', '').strip()
            try:
                amount = float(amount)
            except ValueError:
                amount = 0
        validated['amount'] = abs(float(amount)) if amount else 0
        
        # Validate date
        date_str = data.get('date', '')
        try:
            # Try to parse the date
            if date_str:
                parsed_date = datetime.strptime(date_str, '%Y-%m-%d')
                validated['date'] = date_str
            else:
                # Use current date if no date found
                validated['date'] = datetime.now().strftime('%Y-%m-%d')
        except ValueError:
            validated['date'] = datetime.now().strftime('%Y-%m-%d')
        
        # Validate other fields
        validated['client_vendor'] = str(data.get('client_vendor', 'Unknown')).strip()[:100]
        validated['description'] = str(data.get('description', 'Transaction')).strip()[:200]
        validated['category'] = str(data.get('category', 'other_business' if validated['type'] == 'expense' else 'freelance_income')).strip()
        validated['gst_applicable'] = bool(data.get('gst_applicable', False))
        validated['gst_amount'] = float(data.get('gst_amount', 0)) if data.get('gst_amount') else 0
        validated['currency'] = str(data.get('currency', 'INR')).upper()
        validated['confidence'] = min(1.0, max(0.0, float(data.get('confidence', 0.7))))
        
        # Validate GST amount doesn't exceed main amount
        if validated['gst_amount'] > validated['amount']:
            validated['gst_amount'] = 0
            validated['gst_applicable'] = False
        
        return validated
        
    except Exception as e:
        logging.error(f"Data validation error: {str(e)}")
        # Return minimal valid data structure
        return {
            'type': 'expense',
            'amount': 0,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'client_vendor': 'Unknown',
            'description': 'Failed to parse',
            'category': 'other_business',
            'gst_applicable': False,
            'gst_amount': 0,
            'currency': 'INR',
            'confidence': 0.1
        }

def categorize_transaction(description, transaction_type):
    """Fallback categorization if AI doesn't provide category"""
    description_lower = description.lower()
    
    if transaction_type == 'expense':
        if any(word in description_lower for word in ['travel', 'taxi', 'uber', 'flight', 'hotel']):
            return 'business_travel'
        elif any(word in description_lower for word in ['software', 'laptop', 'computer', 'phone', 'equipment']):
            return 'office_supplies'
        elif any(word in description_lower for word in ['legal', 'accounting', 'consultant']):
            return 'professional_services'
        elif any(word in description_lower for word in ['advertising', 'marketing', 'promotion']):
            return 'marketing'
        elif any(word in description_lower for word in ['internet', 'electricity', 'phone bill', 'utility']):
            return 'utilities'
        elif any(word in description_lower for word in ['rent', 'office space']):
            return 'rent'
        else:
            return 'other_business'
    else:  # income
        if any(word in description_lower for word in ['consulting', 'consultation']):
            return 'consulting'
        elif any(word in description_lower for word in ['royalty', 'licensing']):
            return 'royalty'
        else:
            return 'freelance_income'
