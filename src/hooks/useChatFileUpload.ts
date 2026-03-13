import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface ChatFileUploadOptions {
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
}

export const useChatFileUpload = (options: ChatFileUploadOptions = {}) => {
  const {
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = [
      // Only block truly dangerous file types
      'application/x-msdownload', // .exe files
      'application/x-msdos-program', // .com files
      'application/x-ms-shortcut', // .lnk files
      'application/x-executable', // other executables
      'application/x-bat', // .bat files
      'application/x-cmd', // .cmd files
      'application/x-msi', // Windows installer
      'application/x-apple-diskimage', // .dmg files
      'application/x-debian-package', // .deb files
      'application/x-rpm', // .rpm files
    ],
  } = options;

  const [uploadingFiles, setUploadingFiles] = useState<Record<string, File>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const generateUploadUrl = useMutation(api.messages.generateChatUploadUrl);
  const storeFile = useMutation(api.messages.storeChatFile);

  const uploadFiles = async (files: File[]): Promise<any[]> => {
    const uploadedFiles: any[] = [];
    const validFiles: File[] = [];

    // First validate all files and collect valid ones
    for (const file of files) {
      // Validate file size
      if (file.size > maxFileSize) {
        toast.error(`File "${file.name}" exceeds maximum size limit`);
        continue;
      }

      // Only block dangerous file types, let Convex handle the rest
      if (allowedTypes.includes(file.type)) {
        toast.error(`File type "${file.type}" is not supported for "${file.name}" (dangerous file type)`);
        continue;
      }

      validFiles.push(file);
    }

    // If no valid files, return empty array
    if (validFiles.length === 0) {
      return [];
    }

    // Upload valid files
    for (const file of validFiles) {
      try {
        // Start upload
        setUploadingFiles(prev => ({ ...prev, [file.name]: file }));
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        // Generate upload URL
        const properMimeType = getMimeType(file);
        const { uploadUrl } = await generateUploadUrl({
          fileName: file.name,
          fileType: properMimeType,
          fileSize: file.size,
        });

        // Upload file to Convex storage
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': properMimeType,
          },
          body: file,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Upload failed:', errorText);
          throw new Error(`Upload failed: ${errorText}`);
        }

        // Get storage ID from response
        const { storageId } = await response.json();

        // Store file metadata
        const storedFile = await storeFile({
          storageId,
          fileName: file.name,
          fileType: properMimeType,
          fileSize: file.size,
        });

        uploadedFiles.push(storedFile);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

        // Clean up
        setUploadingFiles(prev => {
          const newFiles = { ...prev };
          delete newFiles[file.name];
          return newFiles;
        });

        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });

      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Clean up on error
        setUploadingFiles(prev => {
          const newFiles = { ...prev };
          delete newFiles[file.name];
          return newFiles;
        });

        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }
    }

    return uploadedFiles;
  };

  const isUploading = (fileName: string) => fileName in uploadingFiles;
  const getUploadProgress = (fileName: string) => uploadProgress[fileName] || 0;

  return {
    uploadFiles,
    uploadingFiles,
    uploadProgress,
    isUploading,
    getUploadProgress,
  };
};

// Helper function to get proper MIME type for files
const getMimeType = (file: File): string => {
  // If file already has a valid MIME type, use it
  if (file.type && file.type !== 'application/octet-stream') {
    return file.type;
  }

  // Map file extensions to proper MIME types
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    // SQL files
    'sql': 'text/plain',
    'SQL': 'text/plain',
    
    // Code files
    'js': 'text/javascript',
    'jsx': 'text/javascript',
    'ts': 'text/typescript',
    'tsx': 'text/typescript',
    'py': 'text/x-python',
    'java': 'text/x-java',
    'c': 'text/x-c',
    'cpp': 'text/x-c',
    'cc': 'text/x-c',
    'h': 'text/x-c',
    'hpp': 'text/x-c',
    'cs': 'text/x-csharp',
    'rb': 'text/x-ruby',
    'php': 'text/x-php',
    'go': 'text/x-go',
    'rs': 'text/x-rust',
    'swift': 'text/x-swift',
    'kt': 'text/x-kotlin',
    'scala': 'text/x-scala',
    'sh': 'text/x-shellscript',
    'bash': 'text/x-shellscript',
    'zsh': 'text/x-shellscript',
    'ps1': 'text/x-shellscript',
    
    // Config files
    'json': 'application/json',
    'xml': 'application/xml',
    'yaml': 'text/yaml',
    'yml': 'text/yaml',
    'toml': 'text/plain',
    'ini': 'text/plain',
    'conf': 'text/plain',
    'log': 'text/plain',
    
    // Documents
    'txt': 'text/plain',
    'csv': 'text/csv',
    'md': 'text/markdown',
    'rtf': 'text/rtf',
    
    // Web files
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'scss': 'text/css',
    'sass': 'text/css',
    'less': 'text/css',
    
    // Archives
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
    'tgz': 'application/gzip',
    
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };

  return mimeTypes[extension || ''] || 'application/octet-stream';
};

// Helper function to get file icon based on file type
export const getFileIcon = (fileType: string): string => {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType === 'application/pdf') return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📈';
  if (fileType === 'text/plain' || fileType === 'text/csv') return '📃';
  if (fileType === 'application/json') return '🔧';
  if (fileType.includes('javascript') || fileType.includes('typescript')) return '⚡';
  if (fileType.includes('html') || fileType.includes('css')) return '🌐';
  if (fileType.includes('sql')) return '🗃️';
  if (fileType.includes('python')) return '🐍';
  if (fileType.includes('java')) return '☕';
  if (fileType.includes('c') || fileType.includes('cpp') || fileType.includes('csharp')) return '⚙️';
  if (fileType.includes('ruby')) return '💎';
  if (fileType.includes('php')) return '🐘';
  if (fileType.includes('go')) return '🐹';
  if (fileType.includes('rust')) return '🦀';
  if (fileType.includes('swift')) return '🦉';
  if (fileType.includes('kotlin')) return '🎯';
  if (fileType.includes('shell') || fileType.includes('sh')) return '🐚';
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z') || fileType.includes('tar')) return '📦';
  return '📎'; // Default file icon
};

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
