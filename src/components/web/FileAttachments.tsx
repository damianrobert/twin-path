import React from 'react';
import { Button } from '@/components/ui/button';
import { getFileIcon, formatFileSize } from '@/hooks/useChatFileUpload';
import { Download, ExternalLink } from 'lucide-react';

interface FileAttachment {
  url: string;
  name: string;
  size: number;
  type: string;
}

interface FileAttachmentsProps {
  attachments: FileAttachment[];
  isOwnMessage?: boolean;
}

export const FileAttachments: React.FC<FileAttachmentsProps> = ({ 
  attachments, 
  isOwnMessage = false 
}) => {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handleDownload = (attachment: FileAttachment) => {
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = (attachment: FileAttachment) => {
    window.open(attachment.url, '_blank');
  };

  return (
    <div className="space-y-2 mt-2">
      {attachments.map((attachment, index) => (
        <div
          key={index}
          className={`flex items-center gap-3 p-2 rounded-md ${
            isOwnMessage 
              ? 'bg-primary-foreground/10' 
              : 'bg-muted/50'
          }`}
        >
          {/* File Icon */}
          <div className="text-2xl flex-shrink-0">
            {getFileIcon(attachment.type)}
          </div>
          
          {/* File Info */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${
              isOwnMessage ? 'text-primary-foreground' : 'text-foreground'
            }`}>
              {attachment.name}
            </p>
            <p className={`text-xs ${
              isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
            }`}>
              {formatFileSize(attachment.size)}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-1 flex-shrink-0">
            {/* Download Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(attachment)}
              className={`h-8 w-8 p-0 ${
                isOwnMessage 
                  ? 'text-primary-foreground hover:bg-primary-foreground/20' 
                  : 'text-muted-foreground hover:bg-muted'
              }`}
              title="Download file"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            {/* Open in New Tab Button (for images and text files) */}
            {(attachment.type.startsWith('image/') || 
              attachment.type.startsWith('text/') ||
              attachment.type === 'application/json' ||
              attachment.type === 'application/xml') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenInNewTab(attachment)}
                className={`h-8 w-8 p-0 ${
                  isOwnMessage 
                    ? 'text-primary-foreground hover:bg-primary-foreground/20' 
                    : 'text-muted-foreground hover:bg-muted'
                }`}
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FileAttachments;
