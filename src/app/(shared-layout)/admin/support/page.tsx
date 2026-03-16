"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Calendar,
  User,
  Settings,
  RefreshCw,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

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

export default function AdminSupportPage() {
  const router = useRouter();
  const allCases = useQuery(api.supportCases.getAllSupportCases);
  const stats = useQuery(api.supportCases.getSupportCaseStatistics);
  const updateStatus = useMutation(api.supportCases.updateSupportCaseStatus);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [resolution, setResolution] = useState("");

  // Filter cases based on search and filters
  const filteredCases = allCases?.filter(case_ => {
    const matchesSearch = searchTerm === "" || 
      case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (case_.user?.name && case_.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (case_.user?.email && case_.user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || case_.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || case_.category === categoryFilter;
    const matchesPriority = priorityFilter === "all" || case_.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  }) || [];

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: keyof typeof statusConfig) => {
    const Icon = statusConfig[status].icon;
    return <Icon className="h-4 w-4" />;
  };

  const handleStatusUpdate = async () => {
    if (!selectedCase || !newStatus) return;

    try {
      await updateStatus({
        caseId: selectedCase._id,
        status: newStatus as any,
        resolution: (newStatus === "resolved" || newStatus === "closed") ? resolution : undefined,
      });
      
      toast.success("Case status updated successfully");
      setStatusDialogOpen(false);
      setSelectedCase(null);
      setNewStatus("");
      setResolution("");
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Failed to update case status");
    }
  };

  const openStatusDialog = (case_: any) => {
    setSelectedCase(case_);
    setNewStatus(case_.status);
    setResolution(case_.resolution || "");
    setStatusDialogOpen(true);
  };

  if (allCases === undefined || stats === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Support Management</h1>
            <p className="text-muted-foreground">
              Manage and respond to user support cases
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Cases</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Opened</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.opened}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cases by title, description, case number, or user..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cases List */}
      {filteredCases.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {allCases.length === 0 ? "No support cases" : "No matching cases"}
            </h3>
            <p className="text-muted-foreground">
              {allCases.length === 0 
                ? "No support cases have been created yet."
                : "Try adjusting your search or filters to find what you're looking for."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCases.map((case_) => (
            <Card key={case_._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{case_.title}</h3>
                      <Badge variant="secondary" className="font-mono">
                        {case_.caseNumber}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {case_.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {case_.user?.name || case_.user?.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(case_.createdAt)}
                      </div>
                      {case_.resolvedAt && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Resolved {formatDate(case_.resolvedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <Badge className={statusConfig[case_.status].color}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(case_.status)}
                        {statusConfig[case_.status].label}
                      </div>
                    </Badge>
                    
                    <Badge className={categoryConfig[case_.category].color}>
                      {categoryConfig[case_.category].label}
                    </Badge>
                    
                    <Badge className={priorityConfig[case_.priority].color}>
                      {priorityConfig[case_.priority].label}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <Link href={`/admin/support/${case_._id}`}>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                  
                  <Dialog open={statusDialogOpen && selectedCase?._id === case_._id} onOpenChange={setStatusDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => openStatusDialog(case_)}>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
