import {
  users,
  documents,
  transactions,
  taxCalculations,
  type User,
  type UpsertUser,
  type Document,
  type InsertDocument,
  type Transaction,
  type InsertTransaction,
  type TaxCalculation,
  type InsertTaxCalculation,
} from "@shared/schema";
import { randomUUID } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getUserDocuments(userId: string): Promise<Document[]>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  getUserTransactions(userId: string): Promise<Transaction[]>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string): Promise<boolean>;
  
  // Tax calculation operations
  createTaxCalculation(taxCalc: InsertTaxCalculation): Promise<TaxCalculation>;
  getTaxCalculation(id: string): Promise<TaxCalculation | undefined>;
  getUserTaxCalculations(userId: string, financialYear?: string): Promise<TaxCalculation[]>;
  updateTaxCalculation(id: string, updates: Partial<TaxCalculation>): Promise<TaxCalculation | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private documents: Map<string, Document> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private taxCalculations: Map<string, TaxCalculation> = new Map();

  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    const user: User = {
      ...existingUser,
      ...userData,
      id: userData.id || randomUUID(),
      updatedAt: new Date(),
      createdAt: existingUser?.createdAt || new Date(),
      // Ensure optional fields are null instead of undefined
      email: userData.email ?? existingUser?.email ?? null,
      firstName: userData.firstName ?? existingUser?.firstName ?? null,
      lastName: userData.lastName ?? existingUser?.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? existingUser?.profileImageUrl ?? null,
      pan: userData.pan ?? existingUser?.pan ?? null,
      gstin: userData.gstin ?? existingUser?.gstin ?? null,
      profession: userData.profession ?? existingUser?.profession ?? null,
    };
    this.users.set(user.id, user);
    return user;
  }

  // Document operations
  async createDocument(documentData: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      ...documentData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Ensure optional fields are null instead of undefined
      ocrText: documentData.ocrText ?? null,
      processingStatus: documentData.processingStatus ?? "pending",
    };
    this.documents.set(id, document);
    return document;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getUserDocuments(userId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.userId === userId);
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    const updatedDocument = { ...document, ...updates, updatedAt: new Date() };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  // Transaction operations
  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...transactionData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Ensure optional fields are null instead of undefined
      description: transactionData.description ?? null,
      documentId: transactionData.documentId ?? null,
      gstRate: transactionData.gstRate ?? null,
      gstAmount: transactionData.gstAmount ?? null,
      aiExtracted: transactionData.aiExtracted ?? null,
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(txn => txn.userId === userId);
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, ...updates, updatedAt: new Date() };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return this.transactions.delete(id);
  }

  // Tax calculation operations
  async createTaxCalculation(taxCalcData: InsertTaxCalculation): Promise<TaxCalculation> {
    const id = randomUUID();
    const taxCalculation: TaxCalculation = {
      ...taxCalcData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Ensure optional fields are null instead of undefined
      quarter: taxCalcData.quarter ?? null,
      section44adaIncome: taxCalcData.section44adaIncome ?? null,
      regularTaxableIncome: taxCalcData.regularTaxableIncome ?? null,
      section44adaTax: taxCalcData.section44adaTax ?? null,
      regularTax: taxCalcData.regularTax ?? null,
      advanceTaxPaid: taxCalcData.advanceTaxPaid ?? null,
      advanceTaxDue: taxCalcData.advanceTaxDue ?? null,
      gstLiability: taxCalcData.gstLiability ?? null,
    };
    this.taxCalculations.set(id, taxCalculation);
    return taxCalculation;
  }

  async getTaxCalculation(id: string): Promise<TaxCalculation | undefined> {
    return this.taxCalculations.get(id);
  }

  async getUserTaxCalculations(userId: string, financialYear?: string): Promise<TaxCalculation[]> {
    return Array.from(this.taxCalculations.values()).filter(calc => 
      calc.userId === userId && (!financialYear || calc.financialYear === financialYear)
    );
  }

  async updateTaxCalculation(id: string, updates: Partial<TaxCalculation>): Promise<TaxCalculation | undefined> {
    const taxCalculation = this.taxCalculations.get(id);
    if (!taxCalculation) return undefined;
    
    const updatedTaxCalculation = { ...taxCalculation, ...updates, updatedAt: new Date() };
    this.taxCalculations.set(id, updatedTaxCalculation);
    return updatedTaxCalculation;
  }
}

export const storage = new MemStorage();
