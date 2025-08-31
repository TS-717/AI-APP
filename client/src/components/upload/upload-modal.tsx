import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, FileUp, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import DragDropZone from "./drag-drop-zone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onMutate: () => {
      setUploadStatus('uploading');
    },
    onSuccess: (data) => {
      setUploadStatus('processing');
      toast({
        title: "Upload Successful",
        description: "Your document is being processed with AI...",
      });
      
      // Simulate processing time
      setTimeout(() => {
        setUploadStatus('success');
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
        
        toast({
          title: "Processing Complete",
          description: "Invoice data has been extracted and added to your transactions.",
        });
        
        // Auto close after success
        setTimeout(() => {
          handleClose();
        }, 2000);
      }, 3000);
    },
    onError: (error: any) => {
      setUploadStatus('error');
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadStatus('idle');
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    onClose();
  };

  const getStatusContent = () => {
    switch (uploadStatus) {
      case 'uploading':
        return (
          <div className="flex items-center space-x-3 p-4 bg-primary/5 rounded-lg" data-testid="upload-status-uploading">
            <Loader2 className="animate-spin text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Uploading...</p>
              <p className="text-xs text-muted-foreground">Sending file to server</p>
            </div>
          </div>
        );
      
      case 'processing':
        return (
          <div className="flex items-center space-x-3 p-4 bg-accent/5 rounded-lg" data-testid="upload-status-processing">
            <Loader2 className="animate-spin text-accent" />
            <div>
              <p className="text-sm font-medium text-foreground">Processing with AI...</p>
              <p className="text-xs text-muted-foreground">Extracting invoice data</p>
            </div>
          </div>
        );
      
      case 'success':
        return (
          <div className="flex items-center space-x-3 p-4 bg-secondary/5 rounded-lg" data-testid="upload-status-success">
            <CheckCircle className="text-secondary" />
            <div>
              <p className="text-sm font-medium text-foreground">Processing Complete!</p>
              <p className="text-xs text-muted-foreground">Invoice data extracted successfully</p>
            </div>
          </div>
        );
      
      case 'error':
        return (
          <div className="flex items-center space-x-3 p-4 bg-destructive/5 rounded-lg" data-testid="upload-status-error">
            <AlertCircle className="text-destructive" />
            <div>
              <p className="text-sm font-medium text-foreground">Upload Failed</p>
              <p className="text-xs text-muted-foreground">Please try again</p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-full mx-4" data-testid="upload-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-foreground">Upload Invoice</DialogTitle>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-close-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Upload your invoice for AI-powered data extraction
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!selectedFile && uploadStatus === 'idle' && (
            <DragDropZone onFileSelect={handleFileSelect} />
          )}
          
          {selectedFile && uploadStatus === 'idle' && (
            <div className="p-4 border border-border rounded-lg" data-testid="selected-file-info">
              <div className="flex items-center space-x-3">
                <FileUp className="text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground" data-testid="text-selected-filename">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid="text-selected-filesize">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  data-testid="button-remove-file"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {getStatusContent()}
          
          <div className="flex space-x-3">
            <Button 
              variant="outline"
              className="flex-1 border border-border text-foreground hover:bg-muted transition-colors" 
              onClick={handleClose}
              disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" 
              onClick={handleUpload}
              disabled={!selectedFile || uploadStatus === 'uploading' || uploadStatus === 'processing' || uploadStatus === 'success'}
              data-testid="button-upload"
            >
              {uploadStatus === 'uploading' || uploadStatus === 'processing' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Upload & Process'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
