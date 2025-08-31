import Tesseract from 'tesseract.js';
import fs from 'fs';
import pdf from 'pdf-parse';

export class OCRService {
  async extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
    try {
      if (mimeType === 'application/pdf') {
        return await this.extractFromPDF(filePath);
      } else if (mimeType.startsWith('image/')) {
        return await this.extractFromImage(filePath);
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }
    } catch (error) {
      console.error('OCR extraction failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to extract text: ${errorMessage}`);
    }
  }

  private async extractFromPDF(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  }

  private async extractFromImage(filePath: string): Promise<string> {
    const { data: { text } } = await Tesseract.recognize(filePath, 'eng', {
      logger: m => console.log(m)
    });
    return text;
  }
}

export const ocrService = new OCRService();
