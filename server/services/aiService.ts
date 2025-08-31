import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

export interface InvoiceData {
  vendor: string;
  date: string;
  amount: number;
  gst: number;
  category: string;
  description?: string;
}

export class AIService {
  async parseInvoiceText(ocrText: string): Promise<InvoiceData> {
    try {
      const prompt = `You are a financial assistant for Indian tax compliance. Extract structured data from the following invoice text. Return vendor name, date, amount, GST %, and category. Categorize based on Indian freelance income categories (Design Services, Writing Services, Consulting Services, Development Services, Marketing Services, Other Services).

Invoice Text:
"""
${ocrText}
"""

Return JSON in this exact format:
{
  "vendor": "Company Name",
  "date": "YYYY-MM-DD",
  "amount": 25000,
  "gst": 18,
  "category": "Design Services",
  "description": "Brief description of services"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert at extracting structured financial data from Indian invoices. Always respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const result = JSON.parse(response.choices[0].message.content!);
      
      // Validate and sanitize the result
      return {
        vendor: result.vendor || "Unknown Vendor",
        date: result.date || new Date().toISOString().split('T')[0],
        amount: parseFloat(result.amount) || 0,
        gst: parseFloat(result.gst) || 0,
        category: result.category || "Other Services",
        description: result.description || ""
      };
    } catch (error) {
      console.error('AI parsing failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse invoice with AI: ${errorMessage}`);
    }
  }

  async categorizeTransaction(description: string, vendor: string): Promise<string> {
    try {
      const prompt = `Categorize this freelance transaction into one of these Indian freelance categories:
- Design Services
- Writing Services  
- Consulting Services
- Development Services
- Marketing Services
- Other Services

Transaction: ${vendor} - ${description}

Return only the category name.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 50,
      });

      return response.choices[0].message.content?.trim() || "Other Services";
    } catch (error) {
      console.error('AI categorization failed:', error);
      return "Other Services";
    }
  }
}

export const aiService = new AIService();
