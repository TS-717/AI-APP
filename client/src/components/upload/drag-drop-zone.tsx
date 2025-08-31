import { useCallback, useState } from "react";
import { CloudUpload, FileType, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DragDropZoneProps {
  onFileSelect: (file: File) => void;
}

export default function DragDropZone({ onFileSelect }: DragDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/tiff',
      'image/tif'
    ];

    const maxSize = 16 * 1024 * 1024; // 16MB

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF, JPEG, PNG, or TIFF files only.",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload files smaller than 16MB.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = useCallback((files: FileList) => {
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  }, [handleFileSelect]);

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
        isDragOver 
          ? 'border-primary bg-primary/5' 
          : 'border-border hover:border-primary/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
      data-testid="drag-drop-zone"
    >
      <input
        id="file-input"
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif"
        onChange={handleInputChange}
        className="hidden"
        data-testid="file-input"
      />
      
      <CloudUpload className="text-4xl text-muted-foreground mb-3 mx-auto h-12 w-12" />
      <p className="text-sm font-medium text-foreground mb-1">Choose files to upload</p>
      <p className="text-xs text-muted-foreground mb-4">or drag and drop files here</p>
      
      <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <FileType className="h-3 w-3" />
          <span>PDF, JPG, PNG, TIFF</span>
        </div>
        <div className="flex items-center space-x-1">
          <AlertCircle className="h-3 w-3" />
          <span>Max 16MB</span>
        </div>
      </div>
    </div>
  );
}
