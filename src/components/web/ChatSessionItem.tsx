"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import GlobalAvatar from "./GlobalAvatar";
import { PresenceIndicator } from "./PresenceIndicator";

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

interface ChatSessionItemProps {
  session: ChatSession;
  isSelected: boolean;
  onSelect: (session: ChatSession) => void;
}

export default function ChatSessionItem({ session, isSelected, onSelect }: ChatSessionItemProps) {
  // Get unseen count for this specific session
  const unseenCount = useQuery(
    api.messages.getUnseenCountForSession,
    session.type === "mentorship" 
      ? { mentorshipId: session._id as Id<"mentorships"> }
      : { chatSessionId: session._id as Id<"chatSessions"> }
  ) || 0;

  // Get online status of the other participant
  const onlineStatus = useQuery(api.presence.getOnlineStatus, {
    userId: session.otherParticipant._id,
  });

  const isOnline = onlineStatus?.isOnline || false;
  const lastSeen = onlineStatus?.lastSeen;

  return (
    <Card
      className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
        isSelected ? "bg-muted" : ""
      }`}
      onClick={() => onSelect(session)}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <GlobalAvatar 
            user={{
              name: session.otherParticipant.name,
              role: session.otherParticipant.role
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">
              {session.otherParticipant.name}
            </p>
            <Badge variant="outline" className="text-xs">
              {session.otherParticipant.role}
            </Badge>
            {unseenCount > 0 && (
              <div className="flex items-center gap-1 ml-auto">
                <Bell className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">
                  {unseenCount}
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {session.type === "mentorship" ? "Mentorship Chat" : "Direct Message"}
          </p>
        </div>
      </div>
    </Card>
  );
}
