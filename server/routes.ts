import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { fileService } from "./services/fileService";
import { ocrService } from "./services/ocrService";
import { aiService } from "./services/aiService";
import { taxService } from "./services/taxService";
import { insertDocumentSchema, insertTransactionSchema, insertTaxCalculationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile routes
  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { pan, gstin, profession } = req.body;
      
      const updatedUser = await storage.upsertUser({
        id: userId,
        pan,
        gstin,
        profession,
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Document upload routes
  const upload = fileService.getMulterConfig();
  
  app.post('/api/documents/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Create document record
      const document = await storage.createDocument({
        userId,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        processingStatus: "pending"
      });

      // Start background processing
      processDocumentAsync(document.id);

      res.json({ 
        documentId: document.id,
        message: "File uploaded successfully. Processing started." 
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Get user documents
  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const documents = await storage.getUserDocuments(userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Transaction routes
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertTransactionSchema.parse({
        ...req.body,
        userId
      });

      const transaction = await storage.createTransaction(validatedData);
      res.json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.patch('/api/transactions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const transaction = await storage.updateTransaction(id, req.body);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  app.delete('/api/transactions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTransaction(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // Tax calculation routes
  app.get('/api/tax-calculations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { financialYear } = req.query;
      const calculations = await storage.getUserTaxCalculations(userId, financialYear as string);
      res.json(calculations);
    } catch (error) {
      console.error("Error fetching tax calculations:", error);
      res.status(500).json({ message: "Failed to fetch tax calculations" });
    }
  });

  app.post('/api/tax-calculations/calculate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getUserTransactions(userId);
      
      const currentFY = taxService.getCurrentFinancialYear();
      const totalIncome = transactions.reduce((sum, txn) => sum + parseFloat(txn.amount.toString()), 0);
      
      const calculation = taxService.calculateTax(totalIncome);
      
      // Save the calculation
      const taxCalc = await storage.createTaxCalculation({
        userId,
        financialYear: currentFY,
        totalIncome: calculation.totalIncome.toString(),
        section44adaIncome: calculation.section44adaIncome.toString(),
        regularTaxableIncome: calculation.regularTaxableIncome.toString(),
        section44adaTax: calculation.section44adaTax.toString(),
        regularTax: calculation.regularTax.toString(),
        recommendedScheme: calculation.recommendedScheme,
      });
      
      res.json({ ...calculation, id: taxCalc.id });
    } catch (error) {
      console.error("Error calculating tax:", error);
      res.status(500).json({ message: "Failed to calculate tax" });
    }
  });

  // Dashboard data route
  app.get('/api/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getUserTransactions(userId);
      const taxCalculations = await storage.getUserTaxCalculations(userId, taxService.getCurrentFinancialYear());
      
      const totalIncome = transactions.reduce((sum, txn) => sum + parseFloat(txn.amount.toString()), 0);
      const totalGST = transactions.reduce((sum, txn) => sum + (parseFloat(txn.gstAmount?.toString() || "0")), 0);
      
      const currentTaxCalc = taxCalculations[0];
      const taxPayable = currentTaxCalc ? parseFloat(currentTaxCalc.section44adaTax?.toString() || "0") : 0;
      
      // Calculate next advance tax payment
      const advanceTaxSchedule = taxService.calculateTax(totalIncome).advanceTaxSchedule;
      const nextPayment = advanceTaxSchedule.find(payment => new Date(payment.dueDate) > new Date());
      
      // Get recent transactions
      const recentTransactions = transactions
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
        .slice(0, 5);

      // Monthly income data for chart
      const monthlyIncome = Array.from({ length: 8 }, (_, i) => {
        const month = new Date().getMonth() - 7 + i;
        const monthTransactions = transactions.filter(txn => {
          const txnMonth = new Date(txn.invoiceDate).getMonth();
          return txnMonth === month;
        });
        return monthTransactions.reduce((sum, txn) => sum + parseFloat(txn.amount.toString()), 0);
      });

      res.json({
        metrics: {
          totalIncome,
          taxPayable,
          nextAdvanceTax: nextPayment ? nextPayment.amount : 0,
          nextAdvanceTaxDate: nextPayment ? nextPayment.dueDate : null,
          pendingGST: totalGST
        },
        recentTransactions,
        monthlyIncome,
        advanceTaxSchedule
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Export data route
  app.get('/api/export/:format', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { format } = req.params;
      const transactions = await storage.getUserTransactions(userId);
      const taxCalculations = await storage.getUserTaxCalculations(userId);
      
      const exportData = {
        user: await storage.getUser(userId),
        transactions,
        taxCalculations,
        exportDate: new Date().toISOString(),
        financialYear: taxService.getCurrentFinancialYear()
      };
      
      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="tax-data-${Date.now()}.json"`);
        res.json(exportData);
      } else {
        res.status(400).json({ message: "Unsupported export format" });
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Background document processing function
  async function processDocumentAsync(documentId: string) {
    try {
      await storage.updateDocument(documentId, { processingStatus: "processing" });
      
      const document = await storage.getDocument(documentId);
      if (!document) return;

      // Extract text using OCR
      const ocrText = await ocrService.extractTextFromFile(document.filePath, document.mimeType);
      await storage.updateDocument(documentId, { ocrText });

      // Parse with AI
      const invoiceData = await aiService.parseInvoiceText(ocrText);
      
      // Create transaction
      await storage.createTransaction({
        userId: document.userId,
        documentId: document.id,
        vendor: invoiceData.vendor,
        amount: invoiceData.amount.toString(),
        gstRate: invoiceData.gst.toString(),
        gstAmount: taxService.calculateGST(invoiceData.amount, invoiceData.gst).toString(),
        category: invoiceData.category,
        invoiceDate: new Date(invoiceData.date),
        description: invoiceData.description,
        aiExtracted: true
      });

      await storage.updateDocument(documentId, { processingStatus: "completed" });
    } catch (error) {
      console.error("Document processing failed:", error);
      await storage.updateDocument(documentId, { processingStatus: "failed" });
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
