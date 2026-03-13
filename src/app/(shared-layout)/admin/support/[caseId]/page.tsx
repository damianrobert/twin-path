"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  RefreshCw,
  Settings,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";

const statusConfig = {
  opened: { 
    label: "Opened", 
    color: "bg-blue-100 text-blue-800", 
    icon: AlertCircle,
    description: "New case awaiting response"
  },
  in_progress: { 
    label: "In Progress", 
    color: "bg-yellow-100 text-yellow-800", 
    icon: Clock,
    description: "Support team is working on this case"
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

export default function AdminSupportCasePage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.caseId as string;
  
  const supportCase = useQuery(api.supportCases.getSupportCaseById, { caseId: caseId as Id<"supportCases"> });
  const messages = useQuery(api.supportCases.getSupportCaseMessages, { caseId: caseId as Id<"supportCases"> });
  const addMessage = useMutation(api.supportCases.addSupportCaseMessage);
  const updateStatus = useMutation(api.supportCases.updateSupportCaseStatus);
  
  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [resolution, setResolution] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update status when case loads
  useEffect(() => {
    if (supportCase) {
      setNewStatus(supportCase.status);
      setResolution(supportCase.resolution || "");
    }
  }, [supportCase]);

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
        caseId: caseId as Id<"supportCases">,
        message: newMessage.trim(),
        isInternal,
      });
      
      setNewMessage("");
      toast.success(isInternal ? "Internal note added" : "Message sent successfully");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!supportCase || !newStatus) return;

    try {
      await updateStatus({
        caseId: supportCase._id,
        status: newStatus as any,
        resolution: (newStatus === "resolved" || newStatus === "closed") ? resolution : undefined,
      });
      
      toast.success("Case status updated successfully");
      setStatusDialogOpen(false);
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Failed to update case status");
    }
  };

  if (supportCase === undefined || messages === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!supportCase) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center py-12">
          <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Case Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The support case you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/admin/support")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Support Cases
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/support")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Support Cases
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{supportCase.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                Case {supportCase.caseNumber}
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {supportCase.user?.name || supportCase.user?.email}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created {formatDate(supportCase.createdAt)}
              </div>
            </div>
          </div>
          
          <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Update Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Case Status</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {(newStatus === "resolved" || newStatus === "closed") && (
                  <div>
                    <Label htmlFor="resolution">Resolution</Label>
                    <Textarea
                      id="resolution"
                      placeholder="Describe how this case was resolved..."
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleStatusUpdate}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case Details */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Case Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{supportCase.description}</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Status:</span>
                  <Badge className={statusConfig[supportCase.status].color}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(supportCase.status)}
                      {statusConfig[supportCase.status].label}
                    </div>
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Category:</span>
                  <Badge className={categoryConfig[supportCase.category].color}>
                    {categoryConfig[supportCase.category].label}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Priority:</span>
                  <Badge className={priorityConfig[supportCase.priority].color}>
                    {priorityConfig[supportCase.priority].label}
                  </Badge>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">User Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {supportCase.user?.name || 'N/A'}</div>
                  <div><strong>Email:</strong> {supportCase.user?.email}</div>
                  <div><strong>Role:</strong> {supportCase.user?.role || 'N/A'}</div>
                </div>
              </div>
              
              {supportCase.resolution && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Resolution</h4>
                  <p className="text-sm text-muted-foreground">{supportCase.resolution}</p>
                  {supportCase.resolvedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Resolved {formatDate(supportCase.resolvedAt)}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Messages */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages yet.</p>
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
                                ? 'You (Admin)' 
                                : `${message.sender?.name || message.sender?.email}${isAdmin ? ' (Admin)' : ''}`
                              }
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(message.createdAt)}
                            </span>
                            {message.isInternal && (
                              <Badge variant="secondary" className="text-xs">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Internal
                              </Badge>
                            )}
                          </div>
                          <div
                            className={`p-3 rounded-lg ${
                              isCurrentUser
                                ? 'bg-primary text-primary-foreground ml-auto'
                                : message.isInternal
                                ? 'bg-orange-100 dark:bg-orange-950/20 text-orange-800 dark:text-orange-200'
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
            <Card className="mt-4">
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
                  
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded"
                      />
                      <span>Internal note (only visible to admins)</span>
                    </label>
                  </div>
                  
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
                          Send {isInternal ? 'Note' : 'Message'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
