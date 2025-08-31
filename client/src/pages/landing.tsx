import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, FileText, TrendingUp, Shield, Clock, CheckCircle } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-2xl font-bold text-foreground">FreelanceTax India</h1>
            </div>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-login"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            AI-Powered Tax Automation <br />
            <span className="text-primary">for Indian Freelancers</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Automate your tax compliance with intelligent invoice parsing, Section 44ADA calculations, 
            and seamless ITR preparation. Built specifically for Indian tax laws and freelancers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/api/login'}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-get-started"
            >
              Start Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-primary text-primary hover:bg-primary/5"
              data-testid="button-learn-more"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need for Tax Compliance
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From document upload to ITR filing, we've got your entire tax workflow covered
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-border hover:shadow-lg transition-shadow" data-testid="card-ai-parsing">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI Invoice Parsing</CardTitle>
                <CardDescription>
                  Upload invoices and let AI extract all financial data automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-secondary" />OCR text extraction</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-secondary" />Smart data parsing</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-secondary" />Automatic categorization</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow" data-testid="card-tax-calculation">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>Smart Tax Calculations</CardTitle>
                <CardDescription>
                  Automatic comparison between regular and Section 44ADA schemes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-secondary" />Section 44ADA benefits</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-secondary" />Advance tax schedule</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-secondary" />GST calculations</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow" data-testid="card-compliance">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Complete Compliance</CardTitle>
                <CardDescription>
                  Export ITR-ready data and maintain audit trails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-secondary" />ITR data export</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-secondary" />Audit trail maintenance</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-secondary" />Document storage</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow" data-testid="card-dashboard">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Financial Dashboard</CardTitle>
                <CardDescription>
                  Real-time insights into your income and tax obligations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-secondary" />Income tracking</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-secondary" />Tax summaries</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-secondary" />Payment reminders</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow" data-testid="card-automation">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle>Time Saving</CardTitle>
                <CardDescription>
                  Reduce manual work from hours to minutes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-secondary" />Bulk processing</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-secondary" />Auto categorization</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-secondary" />Quick exports</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-shadow" data-testid="card-indian-tax">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Indian Tax Laws</CardTitle>
                <CardDescription>
                  Built specifically for FY 2024-25 Indian tax regulations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-secondary" />Current tax slabs</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-secondary" />GST compliance</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-secondary" />PAN/GSTIN support</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to Automate Your Tax Compliance?
          </h3>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join thousands of Indian freelancers who have simplified their tax workflow with FreelanceTax India
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = '/api/login'}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
            data-testid="button-start-now"
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Calculator className="h-6 w-6 text-primary mr-2" />
              <span className="text-lg font-semibold text-foreground">FreelanceTax India</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 FreelanceTax India. Built for Indian freelancers.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
