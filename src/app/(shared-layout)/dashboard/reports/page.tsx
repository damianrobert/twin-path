"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Flag, 
  Clock, 
  FileText, 
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye
} from "lucide-react";
import Link from "next/link";

interface Report {
  _id: string;
  postId: string;
  reason: string;
  message: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  createdAt: number;
  reviewedAt?: number;
  post?: {
    title: string;
    slug: string;
  };
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewed: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  dismissed: "bg-gray-100 text-gray-800",
};

const statusIcons = {
  pending: <AlertTriangle className="h-4 w-4" />,
  reviewed: <Eye className="h-4 w-4" />,
  resolved: <CheckCircle className="h-4 w-4" />,
  dismissed: <XCircle className="h-4 w-4" />,
};

const reasonLabels = {
  inappropriate_content: "Inappropriate Content",
  spam: "Spam",
  harassment: "Harassment",
  copyright: "Copyright Violation",
  misinformation: "Misinformation",
  offensive_language: "Offensive Language",
  other: "Other",
};

export default function UserReportsPage() {
  const reports = useQuery(api.blogReports.getUserReports) || [];

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Flag className="h-8 w-8 text-orange-600" />
          My Blog Reports
        </h1>
        <p className="text-muted-foreground">
          Track the status of blog posts you've reported
        </p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
            <p className="text-muted-foreground mb-4">
              You haven't reported any blog posts yet.
            </p>
            <Link href="/blog">
              <Button>
                Browse Blog Posts
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[report.status]}>
                        <span className="flex items-center gap-1">
                          {statusIcons[report.status]}
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                      </Badge>
                      <Badge variant="outline">
                        {reasonLabels[report.reason as keyof typeof reasonLabels]}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {report.post?.title || "Unknown Post"}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Reported: {formatDate(report.createdAt)}
                      </div>
                      {report.reviewedAt && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          Reviewed: {formatDate(report.reviewedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {report.post && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={`/blog/${report.post.slug}`} target="_blank">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Post
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Your Report Message:</h4>
                    <p className="text-sm bg-muted p-3 rounded-lg">
                      {report.message}
                    </p>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Status Information:</p>
                    <ul className="space-y-1">
                      {report.status === "pending" && (
                        <li>• Your report is waiting to be reviewed by our team.</li>
                      )}
                      {report.status === "reviewed" && (
                        <li>• Your report has been reviewed and is being processed.</li>
                      )}
                      {report.status === "resolved" && (
                        <li>• Your report has been resolved and appropriate action has been taken.</li>
                      )}
                      {report.status === "dismissed" && (
                        <li>• Your report was reviewed but no action was deemed necessary.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
