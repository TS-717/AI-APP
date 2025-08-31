import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CloudUpload, Calculator, Download, List } from "lucide-react";
import { Link } from "wouter";

interface QuickActionsProps {
  onUploadClick?: () => void;
}

export default function QuickActions({ onUploadClick }: QuickActionsProps) {
  const handleFileSelect = () => {
    // This would trigger the file input in a real implementation
    if (onUploadClick) {
      onUploadClick();
    }
  };

  return (
    <Card className="bg-card p-6 rounded-lg border border-border shadow-sm" data-testid="quick-actions-container">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-lg font-semibold text-foreground">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* File Upload Zone */}
        <div 
          className="border-2 border-dashed border-border rounded-lg p-6 text-center mb-6 hover:border-primary/50 transition-colors cursor-pointer"
          onClick={handleFileSelect}
          data-testid="upload-zone"
        >
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
            <CloudUpload className="text-primary text-xl" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Drop invoice files here</p>
          <p className="text-xs text-muted-foreground mb-3">or click to browse</p>
          <Button 
            onClick={handleFileSelect}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90 transition-colors"
            data-testid="button-choose-files"
          >
            Choose Files
          </Button>
          <p className="text-xs text-muted-foreground mt-2">Supports PDF, JPG, PNG up to 16MB</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href="/tax-calculator">
            <Button 
              className="w-full flex items-center justify-center px-4 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
              data-testid="button-calculate-tax"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Recalculate Taxes
            </Button>
          </Link>
          
          <Button 
            className="w-full flex items-center justify-center px-4 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
            onClick={() => window.open('/api/export/json', '_blank')}
            data-testid="button-export-data"
          >
            <Download className="mr-2 h-4 w-4" />
            Export ITR Data
          </Button>
          
          <Link href="/transactions">
            <Button 
              variant="outline"
              className="w-full flex items-center justify-center px-4 py-3 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
              data-testid="button-view-transactions"
            >
              <List className="mr-2 h-4 w-4" />
              View All Transactions
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
