import os
import logging
import pytesseract
from PIL import Image
import PyPDF2
from io import BytesIO

def extract_text_from_file(filepath):
    """Extract text from uploaded file using OCR"""
    try:
        file_extension = filepath.lower().split('.')[-1]
        
        if file_extension == 'pdf':
            return extract_text_from_pdf(filepath)
        else:
            return extract_text_from_image(filepath)
            
    except Exception as e:
        logging.error(f"OCR error for {filepath}: {str(e)}")
        raise Exception(f"Failed to extract text: {str(e)}")

def extract_text_from_pdf(filepath):
    """Extract text from PDF file"""
    try:
        text = ""
        with open(filepath, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            # First try to extract text directly from PDF
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text.strip():
                    text += page_text + "\n"
            
            # If no text found, it might be a scanned PDF - use OCR
            if not text.strip():
                logging.info("No text found in PDF, attempting OCR on PDF pages")
                # Convert PDF pages to images and apply OCR
                # Note: This would require additional libraries like pdf2image
                # For now, return empty text with a helpful message
                raise Exception("PDF appears to be scanned. Please convert to image format (PNG/JPG) for OCR processing.")
        
        return text.strip()
        
    except Exception as e:
        logging.error(f"PDF text extraction error: {str(e)}")
        raise Exception(f"Failed to extract text from PDF: {str(e)}")

def extract_text_from_image(filepath):
    """Extract text from image file using Tesseract OCR"""
    try:
        # Open and preprocess image
        image = Image.open(filepath)
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Apply OCR with specific config for better accuracy
        custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,/-:₹$€£¥@#%&*()[]{}|\\";\'<>?+= \t\n'
        
        text = pytesseract.image_to_string(image, config=custom_config, lang='eng')
        
        if not text.strip():
            # Try different PSM modes if first attempt fails
            logging.info("First OCR attempt failed, trying different page segmentation mode")
            custom_config = r'--oem 3 --psm 3'
            text = pytesseract.image_to_string(image, config=custom_config, lang='eng')
        
        return text.strip()
        
    except Exception as e:
        logging.error(f"Image OCR error: {str(e)}")
        raise Exception(f"Failed to extract text from image: {str(e)}")

def preprocess_image(image):
    """Preprocess image for better OCR accuracy"""
    try:
        # Convert to grayscale
        if image.mode != 'L':
            image = image.convert('L')
        
        # Enhance contrast and sharpness if needed
        from PIL import ImageEnhance
        
        # Increase contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.5)
        
        # Increase sharpness
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(2.0)
        
        return image
        
    except Exception as e:
        logging.warning(f"Image preprocessing failed: {str(e)}")
        return image  # Return original if preprocessing fails
