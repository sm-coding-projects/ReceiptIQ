import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileImage, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import toast from 'react-hot-toast';

interface UploadFile {
  file: File;
  id: string;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface FileUploadProps {
  onUploadComplete?: (batchId: string) => void;
}

const ACCEPTED_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/tiff': ['.tiff', '.tif'],
  'image/bmp': ['.bmp'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 20;

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach((rejected: any) => {
      const errors = rejected.errors.map((e: any) => e.message).join(', ');
      toast.error(`${rejected.file.name}: ${errors}`);
    });

    // Add accepted files
    const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      preview: URL.createObjectURL(file),
      status: 'pending' as const,
      progress: 0,
    }));

    setFiles((prev) => {
      const combined = [...prev, ...newFiles];
      if (combined.length > MAX_FILES) {
        toast.error(`Maximum ${MAX_FILES} files allowed per upload`);
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES,
    disabled: uploading,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const clearAll = () => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);

    // Mark all as uploading
    setFiles((prev) =>
      prev.map((f) => (f.status === 'pending' ? { ...f, status: 'uploading' as const, progress: 0 } : f)),
    );

    try {
      const formData = new FormData();
      files
        .filter((f) => f.status === 'pending')
        .forEach((f) => {
          formData.append('files', f.file);
        });

      const token = localStorage.getItem('auth_token');
      const baseURL = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${baseURL}/receipts/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || `Upload failed (${res.status})`);
      }

      const data = await res.json();

      // Mark all as success
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading' ? { ...f, status: 'success' as const, progress: 100 } : f,
        ),
      );

      toast.success(`${files.length} receipt(s) uploaded successfully`);

      const batchId = data?.id || data?.batch?.id;
      if (onUploadComplete && batchId) {
        onUploadComplete(batchId);
      }

      // Clear after delay
      setTimeout(() => {
        files.forEach((f) => URL.revokeObjectURL(f.preview));
        setFiles([]);
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading'
            ? { ...f, status: 'error' as const, error: message }
            : f,
        ),
      );
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const pendingCount = files.filter((f) => f.status === 'pending' || f.status === 'uploading').length;
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={clsx(
          'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-accent-500 bg-accent-50/50'
            : 'border-primary-200 hover:border-primary-300 hover:bg-primary-50/50',
          uploading && 'opacity-50 cursor-not-allowed',
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div
            className={clsx(
              'w-14 h-14 rounded-2xl flex items-center justify-center transition-colors',
              isDragActive ? 'bg-accent-100 text-accent-600' : 'bg-primary-100 text-primary-400',
            )}
          >
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary-900">
              {isDragActive ? 'Drop your receipts here' : 'Drag & drop receipt images'}
            </p>
            <p className="text-xs text-primary-400 mt-1">
              or click to browse. Supports JPG, PNG, WebP, TIFF, BMP up to 10MB
            </p>
          </div>
          <p className="text-xs text-primary-300">
            Up to {MAX_FILES} files per upload
          </p>
        </div>
      </div>

      {/* File List */}
      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-1">
              <p className="text-sm font-medium text-primary-700">
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </p>
              {!uploading && (
                <button
                  onClick={clearAll}
                  className="text-xs text-primary-400 hover:text-red-500 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Files */}
            <div className="space-y-2 max-h-64 overflow-y-auto rounded-xl">
              {files.map((uploadFile) => (
                <motion.div
                  key={uploadFile.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-3 bg-primary-50/50 rounded-xl border border-primary-100"
                >
                  {/* Preview */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-primary-100 flex-shrink-0">
                    <img
                      src={uploadFile.preview}
                      alt={uploadFile.file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary-900 truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-primary-400">
                      {formatSize(uploadFile.file.size)}
                    </p>

                    {/* Progress bar */}
                    {uploadFile.status === 'uploading' && (
                      <div className="mt-1.5 w-full bg-primary-200 rounded-full h-1">
                        <div
                          className="bg-accent-600 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${uploadFile.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Status / Actions */}
                  <div className="flex-shrink-0">
                    {uploadFile.status === 'pending' && !uploading && (
                      <button
                        onClick={() => removeFile(uploadFile.id)}
                        className="p-1 rounded-lg hover:bg-primary-200 text-primary-400 hover:text-primary-600 transition-colors"
                        aria-label="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {uploadFile.status === 'uploading' && (
                      <Loader2 className="w-4 h-4 text-accent-600 animate-spin" />
                    )}
                    {uploadFile.status === 'success' && (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    )}
                    {uploadFile.status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Upload Button */}
            {pendingCount > 0 && (
              <button
                onClick={uploadFiles}
                disabled={uploading}
                className="btn-primary w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload {pendingCount} Receipt{pendingCount !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
