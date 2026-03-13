"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Send, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Calendar,
  User,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";

const statusConfig = {
  opened: { 
    label: "Opened", 
    color: "bg-blue-100 text-blue-800", 
    icon: AlertCircle,
    description: "Case is open and waiting for response"
  },
  in_progress: { 
    label: "In Progress", 
    color: "bg-yellow-100 text-yellow-800", 
    icon: Clock,
    description: "Support team is working on your case"
  },
  resolved: { 
    label: "Resolved", 
    color: "bg-green-100 text-green-800", 
    icon: CheckCircle,
    description: "Case has been resolved"
  },
  closed: { 
    label: "Closed", 
    color: "bg-gray-100 text-gray-800", 
    icon: XCircle,
    description: "Case has been closed"
  },
};

const categoryConfig = {
  technical: { label: "Technical", color: "bg-purple-100 text-purple-800" },
  account: { label: "Account", color: "bg-blue-100 text-blue-800" },
  billing: { label: "Billing", color: "bg-green-100 text-green-800" },
  content: { label: "Content", color: "bg-orange-100 text-orange-800" },
  other: { label: "Other", color: "bg-gray-100 text-gray-800" },
};

const priorityConfig = {
  low: { label: "Low", color: "bg-gray-100 text-gray-800" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-800" },
  high: { label: "High", color: "bg-orange-100 text-orange-800" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800" },
};

export default function SupportCasePage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.caseId as Id<"supportCases">;
  
  const supportCase = useQuery(api.supportCases.getSupportCaseById, { caseId });
  const messages = useQuery(api.supportCases.getSupportCaseMessages, { caseId });
  const addMessage = useMutation(api.supportCases.addSupportCaseMessage);
  
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: keyof typeof statusConfig) => {
    const Icon = statusConfig[status].icon;
    return <Icon className="h-4 w-4" />;
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await addMessage({
        caseId,
        message: newMessage.trim(),
        isInternal: false,
      });
      
      setNewMessage("");
      toast.success("Message sent successfully");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (supportCase === undefined || messages === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!supportCase) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Case Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The support case you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push("/dashboard/support")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Support Cases
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/support")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Support Cases
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">{supportCase.title}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            Case {supportCase.caseNumber}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Created {formatDate(supportCase.createdAt)}
          </div>
        </div>
      </div>

      {/* Case Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Case Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-muted-foreground">{supportCase.description}</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <Badge className={statusConfig[supportCase.status].color}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(supportCase.status)}
                    {statusConfig[supportCase.status].label}
                  </div>
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium">Category:</span>
                <Badge className={categoryConfig[supportCase.category].color}>
                  {categoryConfig[supportCase.category].label}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium">Priority:</span>
                <Badge className={priorityConfig[supportCase.priority].color}>
                  {priorityConfig[supportCase.priority].label}
                </Badge>
              </div>
            </div>
          </div>
          
          {supportCase.resolution && (
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-md">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Resolution</h4>
              <p className="text-green-700 dark:text-green-300">{supportCase.resolution}</p>
              {supportCase.resolvedAt && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  Resolved on {formatDate(supportCase.resolvedAt)}
                </p>
              )}
            </div>
          )}
          
          {supportCase.status === "opened" && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Status:</strong> {statusConfig[supportCase.status].description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet. Start the conversation below.</p>
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.senderId === supportCase.currentUser._id;
                const isAdmin = message.sender?.isAdmin;
                
                return (
                  <div
                    key={message._id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] ${isCurrentUser ? 'order-2' : 'order-1'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {!isCurrentUser && (
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {getInitials(message.sender?.name, message.sender?.email)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {isCurrentUser 
                            ? 'You' 
                            : message.sender?.name || message.sender?.email
                          }
                          {isAdmin && !isCurrentUser && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              Admin
                            </Badge>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                      <div
                        className={`p-3 rounded-lg ${
                          isCurrentUser
                            ? 'bg-primary text-primary-foreground ml-auto'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Message Input */}
      {(supportCase.status === "opened" || supportCase.status === "in_progress") && (
        <Card>
          <CardHeader>
            <CardTitle>Send Message</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <Textarea
                placeholder="Type your message here..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={4}
                maxLength={2000}
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {newMessage.length}/2000 characters
                </p>
                <Button
                  type="submit"
                  disabled={isSubmitting || !newMessage.trim()}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      
      {(supportCase.status === "resolved" || supportCase.status === "closed") && (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Case {supportCase.status === "resolved" ? "Resolved" : "Closed"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {supportCase.status === "resolved" 
                ? "This case has been resolved. If you have further questions, you can create a new support case."
                : "This case has been closed. If you need further assistance, please create a new support case."
              }
            </p>
            <Button onClick={() => router.push("/dashboard/support/new")}>
              Create New Case
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
