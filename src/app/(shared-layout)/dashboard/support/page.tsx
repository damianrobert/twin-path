"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Filter, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Calendar,
  User,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

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

export default function SupportPage() {
  const router = useRouter();
  const userCases = useQuery(api.supportCases.getUserSupportCases);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Filter cases based on search and filters
  const filteredCases = userCases?.filter(case_ => {
    const matchesSearch = searchTerm === "" || 
      case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.caseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || case_.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || case_.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
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

  if (userCases === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Support Cases</h1>
              <p className="text-muted-foreground mb-4">
                Track and manage your support requests
              </p>

              <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            </div>
          </div>
          <Button onClick={() => router.push("/dashboard/support/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Case
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cases..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
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
                  <SelectTrigger className="w-[140px]">
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
              {userCases.length === 0 ? "No support cases yet" : "No matching cases"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {userCases.length === 0 
                ? "Create your first support case to get help from our team."
                : "Try adjusting your search or filters to find what you're looking for."
              }
            </p>
            {userCases.length === 0 && (
              <Button onClick={() => router.push("/dashboard/support/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Case
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCases.map((case_) => (
            <Card key={case_._id} className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href={`/dashboard/support/${case_._id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold hover:text-primary transition-colors">
                          {case_.title}
                        </h3>
                        <Badge variant="secondary" className="font-mono">
                          {case_.caseNumber}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {case_.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(case_.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          View Case
                        </div>
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
                  
                  {case_.status === "opened" && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Status:</strong> {statusConfig[case_.status].description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {userCases.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {userCases.filter(c => c.status === "opened").length}
                </div>
                <div className="text-sm text-muted-foreground">Opened</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {userCases.filter(c => c.status === "in_progress").length}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {userCases.filter(c => c.status === "resolved").length}
                </div>
                <div className="text-sm text-muted-foreground">Resolved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {userCases.filter(c => c.status === "closed").length}
                </div>
                <div className="text-sm text-muted-foreground">Closed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
