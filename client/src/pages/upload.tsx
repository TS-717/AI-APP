import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DragDropZone from "@/components/upload/drag-drop-zone";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, CheckCircle, Clock, AlertTriangle, Trash2, Eye } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Upload() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/documents"],
    enabled: isAuthenticated,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: "Your document is being processed with AI...",
      });
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-secondary text-secondary-foreground"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge variant="default" className="bg-accent text-accent-foreground"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 lg:pl-64">
        <Header />
        
        <main className="p-6 space-y-6">
          {/* Upload Section */}
          <Card className="bg-card border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Upload New Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedFile ? (
                <DragDropZone onFileSelect={handleFileSelect} />
              ) : (
                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-lg bg-muted/50" data-testid="selected-file-preview">
                    <div className="flex items-center space-x-3">
                      <FileText className="text-primary h-8 w-8" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground" data-testid="text-selected-filename">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid="text-selected-filesize">
                          {formatFileSize(selectedFile.size)} • {selectedFile.type}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        data-testid="button-remove-selected-file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button 
                      variant="outline"
                      onClick={() => setSelectedFile(null)}
                      disabled={uploadMutation.isPending}
                      data-testid="button-cancel-upload"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpload}
                      disabled={uploadMutation.isPending}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      data-testid="button-upload-process"
                    >
                      {uploadMutation.isPending ? 'Uploading...' : 'Upload & Process'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents History */}
          <Card className="bg-card border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Document History</CardTitle>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border border-border rounded-lg">
                      <div className="w-8 h-8 bg-muted rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/4"></div>
                      </div>
                      <div className="w-20 h-6 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : documents && documents.length > 0 ? (
                <div className="space-y-4" data-testid="documents-list">
                  {documents.map((doc: any, index: number) => (
                    <div key={doc.id} className="flex items-center space-x-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors" data-testid={`document-item-${index}`}>
                      <FileText className="text-primary h-8 w-8 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate" data-testid={`document-name-${index}`}>
                          {doc.fileName}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span data-testid={`document-size-${index}`}>{formatFileSize(doc.fileSize)}</span>
                          <span>•</span>
                          <span data-testid={`document-date-${index}`}>{formatDate(doc.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(doc.processingStatus)}
                        <Button variant="ghost" size="sm" data-testid={`button-view-document-${index}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground" data-testid="no-documents">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No documents uploaded yet</p>
                  <p className="text-sm">Upload your first invoice to get started with AI processing</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
