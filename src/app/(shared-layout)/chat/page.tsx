"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageCircle, User, Clock, Search, Check, CheckCheck, Bell, Paperclip } from "lucide-react";
import GlobalAvatar from "@/components/web/GlobalAvatar";
import DMRequestModal from "@/components/web/DMRequestModal";
import ChatSessionItem from "@/components/web/ChatSessionItem";
import { PresenceIndicator } from "@/components/web/PresenceIndicator";
import { useMultipleOnlineStatus } from "@/hooks/usePresence";
import { useChatFileUpload, getFileIcon, formatFileSize } from "@/hooks/useChatFileUpload";
import { toast } from "sonner";
import { FileAttachments } from "@/components/web/FileAttachments";

interface ChatSession {
  _id: Id<"mentorships"> | string;
  type: "mentorship" | "dm";
  otherParticipant: {
    _id: Id<"users">;
    name: string;
    role: "mentor" | "mentee" | "both";
  };
  createdAt: number;
}

interface Message {
  _id: Id<"messages"> | Id<"dmMessages">;
  senderId: Id<"users">;
  content: string;
  createdAt: number;
  sender: {
    _id: Id<"users">;
    name: string;
    role: "mentor" | "mentee" | "both";
  };
}

export default function ChatPage() {
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  // Initialize file upload hook
  const { uploadFiles, uploadingFiles, uploadProgress, isUploading } = useChatFileUpload();

  // Get chat sessions
  const chatSessions = useQuery(api.messages.getChatSessions) || [];
  
  // Search users
  const searchResults = useQuery(
    api.messages.searchUsers,
    searchQuery.trim() ? { searchQuery: searchQuery.trim() } : "skip"
  ) || [];
  
  // Get online status for search results
  const searchResultStatuses = useMultipleOnlineStatus(
    searchResults.map(user => user._id)
  );
  
  // Get online status for selected session participant
  const selectedSessionStatus = useQuery(api.presence.getOnlineStatus, 
    selectedSession?.otherParticipant._id 
      ? { userId: selectedSession.otherParticipant._id }
      : "skip"
  );
  
  // Get messages for selected session
  const sessionMessages = useQuery(
    selectedSession?.type === "mentorship" 
      ? api.messages.getMessages 
      : api.messages.getDMMessages,
    selectedSession?.type === "mentorship" 
      ? { mentorshipId: selectedSession._id as Id<"mentorships"> }
      : selectedSession?.type === "dm"
      ? { chatSessionId: selectedSession._id as Id<"chatSessions"> }
      : "skip"
  ) || [];

  // Send message mutation
  const sendMessage = useMutation(
    selectedSession?.type === "mentorship" 
      ? api.messages.sendMessage 
      : api.messages.sendDMMessage
  );

  // Get DM requests
  const dmRequests = useQuery(api.messages.getDMRequests) || [];
  
  // Respond to DM request
  const respondToDMRequest = useMutation(api.messages.respondToDMRequest);

  // Mark messages as seen
  const markMessagesAsSeen = useMutation(api.messages.markMessagesAsSeen);

  // Get unseen message count
  const unseenCount = useQuery(api.messages.getUnseenMessageCount) || { mentorshipUnseen: 0, dmUnseen: 0 };

  // Get unseen counts for all sessions at once
  const getUnseenCountForSession = (session: ChatSession) => {
    // For now, return 0 - we'll implement a different approach
    return 0;
  };

  // Remove the useEffect and use messages directly from sessionMessages
  const messages = sessionMessages;

  // Mark messages as seen when a session is selected
  useEffect(() => {
    if (selectedSession) {
      if (selectedSession.type === "mentorship") {
        markMessagesAsSeen({ mentorshipId: selectedSession._id as Id<"mentorships"> });
      } else if (selectedSession.type === "dm") {
        markMessagesAsSeen({ chatSessionId: selectedSession._id as Id<"chatSessions"> });
      }
    }
  }, [selectedSession, markMessagesAsSeen]);

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && attachedFiles.length === 0) || !selectedSession) {
      return;
    }

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
        let result;
        if (selectedSession.type === "mentorship") {
          // Mentorship sendMessage returns just the ID
          result = await sendMessage({
            mentorshipId: selectedSession._id as Id<"mentorships">,
            content: messageInput.trim(),
            attachments: uploadedAttachments,
          });
          // For mentorship messages, result is just an ID string
          if (typeof result !== 'string') {
            console.error("Failed to send message");
            return;
          }
        } else {
          // DM sendMessage returns an object with success property
          result = await sendMessage({
            chatSessionId: selectedSession._id as Id<"chatSessions">,
            content: messageInput.trim(),
            attachments: uploadedAttachments,
          });
          
          if (result && typeof result === 'object' && !result.success) {
            console.error("Failed to send message:", result.error);
            return;
          }
        }

        setMessageInput("");
        setAttachedFiles([]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
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

  // Check if a session has unseen messages
  const hasUnseenMessages = (session: ChatSession) => {
    if (!messages.length) return false;
    
    return messages.some((message) => {
      // Check if message is from other participant and not seen by current user
      const isFromOther = message.sender._id === session.otherParticipant._id;
      const isNotSeen = !(message as any).seenBy || !(message as any).seenBy.includes('current_user'); // This would need actual user ID
      return isFromOther && isNotSeen;
    });
  };

  const handleRespondToRequest = async (requestId: Id<"dmRequests">, action: "accept" | "reject") => {
    try {
      await respondToDMRequest({ requestId, action });
    } catch (error) {
      console.error("Failed to respond to request:", error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="container mx-auto p-6 h-[calc(100vh-8rem)]">
      <div className="flex gap-6 h-full">
        {/* Sidebar - Chat Sessions */}
        <div className="w-80 bg-background border rounded-lg flex flex-col p-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Messages
            </CardTitle>
          </CardHeader>
          
          {/* Search Bar */}
          <div className="pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearching(true)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Search Results */}
          {isSearching && searchResults.length > 0 && (
            <div className="pb-2">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Search Results</h3>
                {searchResults.map((user) => {
                  const userStatus = searchResultStatuses[user._id];
                  const isOnline = userStatus?.isOnline || false;
                  
                  return (
                    <Card key={user._id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <GlobalAvatar 
                              user={{
                                name: user.name,
                                role: user.role
                              }}
                              size="sm"
                              clickable={false}
                            />
                            {/* Only show presence indicator when user is online */}
                            {isOnline && (
                              <div className="absolute -bottom-1 -right-1">
                                <PresenceIndicator isOnline={isOnline} size="sm" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{user.name}</p>
                              <Badge variant="outline" className="text-xs">
                                {user.role}
                              </Badge>
                            </div>
                            {user.bio && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {user.bio}
                              </p>
                            )}
                          </div>
                        </div>
                        <DMRequestModal 
                          recipientId={user._id}
                          recipientName={user.name}
                        >
                          <Button size="sm" variant="outline">
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Message
                          </Button>
                        </DMRequestModal>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
          
          {isSearching && searchQuery.trim() && searchResults.length === 0 && (
            <div className="pb-2">
              <div className="text-center py-4">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No users found</p>
                <p className="text-xs text-muted-foreground">Try a different search term</p>
              </div>
            </div>
          )}
          
          <div className="flex-1 pb-4 space-y-2 overflow-y-auto scrollbar-hide max-h-[calc(100vh-20rem)]">
            {/* DM Requests */}
            {dmRequests.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Pending Requests</h3>
                {dmRequests.map((request) => (
                  <Card key={request._id} className="p-3">
                    <div className="flex items-start gap-3">
                      <GlobalAvatar 
                        user={{
                          name: request.sender.name,
                          role: request.sender.role
                        }}
                        size="sm"
                        clickable={false}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{request.sender.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {request.sender.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {request.message}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleRespondToRequest(request._id, "accept")}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRespondToRequest(request._id, "reject")}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Active Chats */}
            {chatSessions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Active Chats</h3>
                {chatSessions.map((session) => (
                  <ChatSessionItem
                    key={session._id}
                    session={session}
                    isSelected={selectedSession?._id === session._id}
                    onSelect={setSelectedSession}
                  />
                ))}
              </div>
            )}

            {chatSessions.length === 0 && dmRequests.length === 0 && (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground">
                  Start a mentorship to begin chatting
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-background border rounded-lg overflow-hidden">
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b py-2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <GlobalAvatar 
                      user={{
                        name: selectedSession.otherParticipant.name,
                        role: selectedSession.otherParticipant.role
                      }}
                      size="md"
                      clickable={false}
                    />
                    {/* Only show presence indicator when user is online */}
                    {selectedSessionStatus?.isOnline && (
                      <div className="absolute -bottom-1 -right-1">
                        <PresenceIndicator isOnline={true} size="sm" />
                      </div>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {selectedSession.otherParticipant.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {selectedSession.otherParticipant.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {selectedSession.type === "mentorship" ? "Active Mentorship" : "Direct Message"}
                      </span>
                      {selectedSessionStatus?.isOnline && (
                        <span className="text-xs text-green-600 font-medium">
                          Online
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-4 overflow-hidden">
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
                  {messages.map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${
                        message.sender._id === selectedSession.otherParticipant._id
                          ? "justify-start"
                          : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.sender._id === selectedSession.otherParticipant._id
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
                          attachments={(message as any).attachments || []}
                          isOwnMessage={message.sender._id !== selectedSession.otherParticipant._id}
                        />
                        
                        {/* Message Footer */}
                        <div className={`flex items-center justify-between mt-1 ${
                          message.sender._id === selectedSession.otherParticipant._id
                            ? "text-muted-foreground"
                            : "text-primary-foreground/70"
                        }`}>
                          <p className="text-xs">
                            {formatDate(message.createdAt)}
                          </p>
                          {message.sender._id !== selectedSession.otherParticipant._id && (
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
                  ))}
                </div>
              </CardContent>

              {/* Message Input */}
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a chat from the sidebar to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
