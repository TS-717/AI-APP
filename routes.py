import os
import json
import logging
from datetime import datetime
from flask import render_template, request, redirect, url_for, flash, jsonify, send_file
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge
from app import app
from ocr_service import extract_text_from_file
from ai_service import parse_financial_data
from tax_calculator import calculate_taxes, get_tax_summary
from storage_service import save_transaction, get_all_transactions, export_data

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'tiff', 'bmp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    """Landing page with overview of features"""
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    """Main dashboard showing tax summary and recent transactions"""
    try:
        transactions = get_all_transactions()
        tax_summary = get_tax_summary(transactions)
        
        # Get recent transactions (last 10)
        recent_transactions = sorted(
            transactions, 
            key=lambda x: datetime.fromisoformat(x['date']), 
            reverse=True
        )[:10]
        
        return render_template('dashboard.html', 
                             tax_summary=tax_summary,
                             recent_transactions=recent_transactions,
                             total_transactions=len(transactions))
    except Exception as e:
        logging.error(f"Dashboard error: {str(e)}")
        flash(f'Error loading dashboard: {str(e)}', 'error')
        return render_template('dashboard.html', 
                             tax_summary={}, 
                             recent_transactions=[], 
                             total_transactions=0)

@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    """Handle file upload and processing"""
    if request.method == 'GET':
        return render_template('upload.html')
    
    try:
        # Check if file was uploaded
        if 'file' not in request.files:
            flash('No file selected', 'error')
            return redirect(request.url)
        
        file = request.files['file']
        if file.filename == '':
            flash('No file selected', 'error')
            return redirect(request.url)
        
        if not allowed_file(file.filename):
            flash('Invalid file type. Please upload PDF, PNG, JPG, JPEG, TIFF, or BMP files.', 'error')
            return redirect(request.url)
        
        # Save uploaded file
        if file.filename is None:
            flash('Invalid filename', 'error')
            return redirect(request.url)
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        logging.info(f"File saved: {filepath}")
        
        # Extract text using OCR
        flash('Processing file with OCR...', 'info')
        extracted_text = extract_text_from_file(filepath)
        
        if not extracted_text.strip():
            flash('No text could be extracted from the file. Please ensure the image is clear and contains readable text.', 'warning')
            os.remove(filepath)  # Clean up
            return redirect(url_for('upload_file'))
        
        logging.info(f"OCR extracted text length: {len(extracted_text)}")
        
        # Parse financial data using AI
        flash('Parsing financial data with AI...', 'info')
        parsed_data = parse_financial_data(extracted_text)
        
        if not parsed_data:
            flash('Could not parse financial data from the extracted text.', 'warning')
            os.remove(filepath)  # Clean up
            return redirect(url_for('upload_file'))
        
        # Save transaction
        transaction = save_transaction(parsed_data, filepath, extracted_text)
        
        flash(f'Successfully processed {parsed_data.get("type", "transaction")} for ₹{parsed_data.get("amount", 0):,.2f}', 'success')
        
        # Clean up uploaded file
        try:
            os.remove(filepath)
        except:
            pass
        
        return redirect(url_for('dashboard'))
        
    except RequestEntityTooLarge:
        flash('File too large. Maximum size is 16MB.', 'error')
        return redirect(request.url)
    except Exception as e:
        logging.error(f"Upload processing error: {str(e)}")
        flash(f'Error processing file: {str(e)}', 'error')
        return redirect(request.url)

@app.route('/transactions')
def transactions():
    """View all transactions"""
    try:
        all_transactions = get_all_transactions()
        # Sort by date, most recent first
        sorted_transactions = sorted(
            all_transactions,
            key=lambda x: datetime.fromisoformat(x['date']),
            reverse=True
        )
        return render_template('transactions.html', transactions=sorted_transactions)
    except Exception as e:
        logging.error(f"Transactions view error: {str(e)}")
        flash(f'Error loading transactions: {str(e)}', 'error')
        return render_template('transactions.html', transactions=[])

@app.route('/export')
def export():
    """Export data for tax filing"""
    try:
        export_file = export_data()
        return send_file(export_file, as_attachment=True, download_name='tax_data_export.json')
    except Exception as e:
        logging.error(f"Export error: {str(e)}")
        flash(f'Error exporting data: {str(e)}', 'error')
        return redirect(url_for('dashboard'))

@app.route('/api/tax-summary')
def api_tax_summary():
    """API endpoint for tax summary data"""
    try:
        transactions = get_all_transactions()
        tax_summary = get_tax_summary(transactions)
        return jsonify(tax_summary)
    except Exception as e:
        logging.error(f"Tax summary API error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.errorhandler(413)
def too_large(e):
    flash('File too large. Maximum size is 16MB.', 'error')
    return redirect(url_for('upload_file'))

@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error(e):
    logging.error(f"Server error: {str(e)}")
    return render_template('500.html'), 500
