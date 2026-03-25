"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  AlertTriangle, 
  Ban, 
  Users, 
  Activity, 
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";
import { DdosProtection } from "@/lib/ddos-protection";
import { RateLimitIndicator } from "@/hooks/useRateLimit";

interface DdosStats {
  totalRequests: number;
  blockedRequests: number;
  suspiciousIps: number;
  blockedIps: number;
  activeConnections: number;
  topEndpoints: Array<{ endpoint: string; requests: number; blocked: number }>;
  recentActivity: Array<{
    timestamp: number;
    ip: string;
    action: string;
    details: string;
  }>;
}

interface IpDetails {
  ip: string;
  requests: number;
  suspicious: boolean;
  blocked: boolean;
  whitelisted: boolean;
  blacklisted: boolean;
  patterns: string[];
  lastSeen: number;
}

export const DdosDashboard: React.FC = () => {
  const [stats, setStats] = useState<DdosStats>({
    totalRequests: 0,
    blockedRequests: 0,
    suspiciousIps: 0,
    blockedIps: 0,
    activeConnections: 0,
    topEndpoints: [],
    recentActivity: [],
  });

  const [ipDetails, setIpDetails] = useState<IpDetails[]>([]);
  const [selectedIp, setSelectedIp] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showBlockedOnly, setShowBlockedOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Load initial data
  useEffect(() => {
    loadStats();
    loadIpDetails();
    
    // Set up auto-refresh
    const interval = setInterval(() => {
      loadStats();
      loadIpDetails();
      setLastUpdate(Date.now());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    // Simulate API call - in real implementation, this would fetch from your backend
    setStats(prev => ({
      ...prev,
      totalRequests: prev.totalRequests + Math.floor(Math.random() * 100),
      blockedRequests: prev.blockedRequests + Math.floor(Math.random() * 10),
      suspiciousIps: Math.floor(Math.random() * 50) + 10,
      blockedIps: Math.floor(Math.random() * 20) + 5,
      activeConnections: Math.floor(Math.random() * 200) + 50,
    }));
  };

  const loadIpDetails = async () => {
    // Simulate loading IP details - in real implementation, fetch from backend
    const mockIps: IpDetails[] = [
      {
        ip: "192.168.1.100",
        requests: 150,
        suspicious: true,
        blocked: false,
        whitelisted: false,
        blacklisted: false,
        patterns: ["bot-user-agent", "rapid-endpoint-switching"],
        lastSeen: Date.now(),
      },
      {
        ip: "10.0.0.50",
        requests: 500,
        suspicious: true,
        blocked: true,
        whitelisted: false,
        blacklisted: false,
        patterns: ["high-frequency-requests", "missing-auth"],
        lastSeen: Date.now() - 60000,
      },
      {
        ip: "172.16.0.10",
        requests: 25,
        suspicious: false,
        blocked: false,
        whitelisted: true,
        blacklisted: false,
        patterns: [],
        lastSeen: Date.now() - 30000,
      },
    ];

    setIpDetails(mockIps);
  };

  const handleBlockIp = (ip: string) => {
    DdosProtection.addToIpBlacklist(ip);
    loadIpDetails();
    loadStats();
  };

  const handleUnblockIp = (ip: string) => {
    DdosProtection.removeFromIpBlacklist(ip);
    loadIpDetails();
    loadStats();
  };

  const handleWhitelistIp = (ip: string) => {
    DdosProtection.addToIpWhitelist(ip);
    loadIpDetails();
  };

  const handleRemoveWhitelist = (ip: string) => {
    DdosProtection.removeFromIpWhitelist(ip);
    loadIpDetails();
  };

  const filteredIps = ipDetails.filter(ip => {
    const matchesSearch = ip.ip.includes(searchTerm);
    const matchesFilter = !showBlockedOnly || ip.blocked;
    return matchesSearch && matchesFilter;
  });

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const getSeverityColor = (suspicious: boolean, blocked: boolean) => {
    if (blocked) return "destructive";
    if (suspicious) return "secondary";
    return "default";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">DDoS Protection Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          Last updated: {formatTime(lastUpdate)}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              loadStats();
              loadIpDetails();
              setLastUpdate(Date.now());
            }}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Requests</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.blockedRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.blockedRequests / Math.max(stats.totalRequests, 1)) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious IPs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.suspiciousIps}</div>
            <p className="text-xs text-muted-foreground">Under observation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeConnections}</div>
            <p className="text-xs text-muted-foreground">Currently connected</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="ips" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ips">IP Management</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="settings">Protection Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="ips" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>IP Address Management</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search IP addresses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Button
                    variant={showBlockedOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowBlockedOnly(!showBlockedOnly)}
                  >
                    <Filter className="w-4 h-4 mr-1" />
                    Blocked Only
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredIps.map((ip) => (
                  <div key={ip.ip} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-medium">{ip.ip}</div>
                        <div className="text-sm text-muted-foreground">
                          {ip.requests} requests • Last seen: {formatTime(ip.lastSeen)}
                        </div>
                        {ip.patterns.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {ip.patterns.map((pattern, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {pattern}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(ip.suspicious, ip.blocked)}>
                        {ip.blocked ? "Blocked" : ip.suspicious ? "Suspicious" : "Normal"}
                      </Badge>
                      
                      {ip.whitelisted && (
                        <Badge variant="outline" className="text-green-600">
                          <Eye className="w-3 h-3 mr-1" />
                          Whitelisted
                        </Badge>
                      )}
                      
                      <div className="flex gap-1">
                        {!ip.blocked && !ip.whitelisted && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBlockIp(ip.ip)}
                            >
                              <Ban className="w-3 h-3 mr-1" />
                              Block
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleWhitelistIp(ip.ip)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Whitelist
                            </Button>
                          </>
                        )}
                        
                        {ip.blocked && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnblockIp(ip.ip)}
                          >
                            <EyeOff className="w-3 h-3 mr-1" />
                            Unblock
                          </Button>
                        )}
                        
                        {ip.whitelisted && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveWhitelist(ip.ip)}
                          >
                            <EyeOff className="w-3 h-3 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.recentActivity.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No recent activity</p>
                ) : (
                  stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div className="text-sm">
                          <div className="font-medium">{activity.ip}</div>
                          <div className="text-muted-foreground">{activity.details}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{activity.action}</Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatTime(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Protection Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  DDoS protection is currently active and monitoring all incoming requests.
                  Configure advanced settings in your environment variables.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Rate Limits</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Global: 10,000 requests/minute</div>
                    <div>Per IP: 100 requests/minute</div>
                    <div>Per User: 60 requests/minute</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Protection Features</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>✓ XSS Protection</div>
                    <div>✓ SQL Injection Prevention</div>
                    <div>✓ Bot Detection</div>
                    <div>✓ Progressive Delays</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
