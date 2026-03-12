"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle, Check, CheckCheck, X } from "lucide-react";
import GlobalAvatar from "./GlobalAvatar";

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
  
  // Get messages for this mentorship
  const messages = useQuery(api.messages.getMessages, { mentorshipId }) || [];
  
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
    if (!messageInput.trim()) return;
    
    try {
      await sendMessage({
        mentorshipId,
        content: messageInput.trim(),
      });
      setMessageInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
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
                <GlobalAvatar 
                  user={{
                    name: otherParticipant.name,
                    role: otherParticipant.role
                  }}
                  size="sm"
                  clickable={false}
                />
                <span className="text-sm text-muted-foreground">
                  {otherParticipant.name}
                </span>
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
                    <p className="text-sm">{message.content}</p>
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
          <div className="flex gap-2">
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
            />
            <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
