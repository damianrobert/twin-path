"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle, Check, CheckCheck, X, Paperclip } from "lucide-react";
import GlobalAvatar from "./GlobalAvatar";
import { PresenceIndicator } from "./PresenceIndicator";
import { useChatFileUpload, getFileIcon, formatFileSize } from "@/hooks/useChatFileUpload";
import { toast } from "sonner";
import { FileAttachments } from "./FileAttachments";

interface MentorshipChatModalProps {
  mentorshipId: Id<"mentorships">;
  currentUserId: Id<"users">;
  otherParticipant: {
    _id: Id<"users">;
    name: string;
    role: "mentor" | "mentee" | "both";
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function MentorshipChatModal({ 
  mentorshipId, 
  currentUserId, 
  otherParticipant, 
  isOpen, 
  onClose 
}: MentorshipChatModalProps) {
  const [messageInput, setMessageInput] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  
  // Initialize file upload hook
  const { uploadFiles, uploadingFiles, uploadProgress, isUploading } = useChatFileUpload();
  
  // Get messages for this mentorship
  const messages = useQuery(api.messages.getMessages, { mentorshipId }) || [];
  
  // Get online status of other participant
  const participantStatus = useQuery(api.presence.getOnlineStatus, {
    userId: otherParticipant._id,
  });
  
  // Send message mutation
  const sendMessage = useMutation(api.messages.sendMessage);
  
  // Mark messages as seen mutation
  const markMessagesAsSeen = useMutation(api.messages.markMessagesAsSeen);

  // Mark messages as seen when modal opens
  useEffect(() => {
    if (isOpen) {
      markMessagesAsSeen({ mentorshipId });
    }
  }, [isOpen, mentorshipId, markMessagesAsSeen]);

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && attachedFiles.length === 0)) return;
    
    try {
      // Upload files first if there are any
      let uploadedAttachments: any[] = [];
      if (attachedFiles.length > 0) {
        uploadedAttachments = await uploadFiles(attachedFiles);
        
        // If no files were successfully uploaded and no text message, don't send empty message
        if (uploadedAttachments.length === 0 && !messageInput.trim()) {
          toast.error("No valid files to send");
          setAttachedFiles([]); // Clear invalid files
          return;
        }
        
        // If some files failed to upload
        if (uploadedAttachments.length !== attachedFiles.length) {
          toast.error("Some files failed to upload");
        }
      }

      // Only send message if there's content or valid attachments
      if (messageInput.trim() || uploadedAttachments.length > 0) {
        await sendMessage({
          mentorshipId,
          content: messageInput.trim(),
          attachments: uploadedAttachments,
        });
        setMessageInput("");
        setAttachedFiles([]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  // File handling functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg w-full max-w-2xl h-[600px] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">Mentorship Chat</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <GlobalAvatar 
                    user={{
                      name: otherParticipant.name,
                      role: otherParticipant.role
                    }}
                    size="sm"
                    clickable={false}
                  />
                  {/* Only show presence indicator when user is online */}
                  {participantStatus?.isOnline && (
                    <div className="absolute -bottom-1 -right-1">
                      <PresenceIndicator isOnline={true} size="sm" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {otherParticipant.name}
                  </span>
                  {participantStatus?.isOnline && (
                    <span className="text-xs text-green-600 font-medium">
                      Online
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-hidden">
          <div 
            className="h-full space-y-4" 
            style={{
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollbarWidth: 'none', /* Firefox */
              msOverflowStyle: 'none', /* IE and Edge */
            }}
          >
            <style dangerouslySetInnerHTML={{
              __html: `
                div::-webkit-scrollbar {
                  display: none; /* Chrome, Safari, Opera */
                }
                div::-webkit-scrollbar-track {
                  display: none;
                }
                div::-webkit-scrollbar-thumb {
                  display: none;
                }
              `
            }} />
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No messages yet</p>
                  <p className="text-sm text-muted-foreground">
                    Start the conversation with a message
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message: any) => (
                <div
                  key={message._id}
                  className={`flex ${
                    message.sender._id === otherParticipant._id
                      ? "justify-start"
                      : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender._id === otherParticipant._id
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {/* Message Content */}
                    {message.content && (
                      <p className="text-sm">{message.content}</p>
                    )}
                    
                    {/* File Attachments */}
                    <FileAttachments 
                      attachments={message.attachments || []}
                      isOwnMessage={message.sender._id !== otherParticipant._id}
                    />
                    
                    {/* Message Footer */}
                    <div className={`flex items-center justify-between mt-1 ${
                      message.sender._id === otherParticipant._id
                        ? "text-muted-foreground"
                        : "text-primary-foreground/70"
                    }`}>
                      <p className="text-xs">
                        {formatDate(message.createdAt)}
                      </p>
                      {message.sender._id !== otherParticipant._id && (
                        <div className="ml-2">
                          {(message as any).seenBy && (message as any).seenBy.length > 1 ? (
                            <CheckCheck className="h-3 w-3" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          {/* Attached Files Preview */}
          {attachedFiles.length > 0 && (
            <div className="mb-3 space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Attached Files:</div>
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                    <span className="text-sm">{getFileIcon(file.type)}</span>
                    <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                    <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                      disabled={isUploading(file.name)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {/* File Upload Button */}
            <div className="relative">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={Object.keys(uploadingFiles).length > 0}
              />
              <Button variant="ghost" size="sm" disabled={Object.keys(uploadingFiles).length > 0}>
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>

            <Input
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1"
              disabled={Object.keys(uploadingFiles).length > 0}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={(!messageInput.trim() && attachedFiles.length === 0) || Object.keys(uploadingFiles).length > 0}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Upload Progress */}
          {Object.keys(uploadingFiles).length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              Uploading files... {Object.keys(uploadingFiles).length} file(s)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
