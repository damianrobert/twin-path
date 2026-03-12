"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, X } from "lucide-react";

interface DMRequestModalProps {
  recipientId: any; // Will be cast to Id<"users"> in the mutation
  recipientName: string;
  children: React.ReactNode;
}

export default function DMRequestModal({ recipientId, recipientName, children }: DMRequestModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const sendDMRequest = useMutation(api.messages.sendDMRequest);

  const handleSendRequest = async () => {
    if (!message.trim()) {
      setError("Please write a message");
      return;
    }

    setError("");
    setSuccess("");
    setIsSending(true);
    try {
      const result = await sendDMRequest({
        recipientId,
        message: message.trim(),
      });

      if (result.success) {
        setSuccess("DM request sent successfully!");
        setMessage("");
        setTimeout(() => {
          setIsOpen(false);
          setSuccess("");
        }, 1500);
      } else {
        // Handle graceful error responses from backend
        if (result.error?.includes("already have a pending DM request")) {
          setError("You already have a pending DM request to this user. Please wait for them to respond.");
        } else if (result.error?.includes("already have an active mentorship")) {
          setError("You already have an active mentorship with this user. You can message them directly.");
        } else if (result.error?.includes("Cannot send DM to yourself")) {
          setError("You cannot send a DM request to yourself.");
        } else {
          setError(result.error || "Failed to send DM request");
        }
      }
    } catch (error: any) {
      // Handle any unexpected errors (shouldn't happen with new backend)
      setError(error.message || "An unexpected error occurred");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(true);
      }}>
        {children}
      </div>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}>
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md mx-4" onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Send Message to {recipientName}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                disabled={isSending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Send a message request to start a conversation. {recipientName} will need to accept your request before you can chat.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Your Message
                </label>
                <Textarea
                  id="message"
                  placeholder="Introduce yourself and explain why you'd like to connect..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              
              {error && (
                <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 p-3 rounded-md">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0">⚠️</div>
                    <div>{error}</div>
                  </div>
                </div>
              )}
              
              {success && (
                <div className="text-sm text-green-600 bg-green-50 border border-green-200 p-3 rounded-md">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0">✅</div>
                    <div>{success}</div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  disabled={isSending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendRequest}
                  disabled={isSending || !message.trim()}
                >
                  {isSending ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Request
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
