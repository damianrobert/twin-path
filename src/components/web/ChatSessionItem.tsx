"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
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
  const unseenCount =
    useQuery(
      api.messages.getUnseenCountForSession,
      session.type === "mentorship"
        ? { mentorshipId: session._id as Id<"mentorships"> }
        : { chatSessionId: session._id as Id<"chatSessions"> }
    ) || 0;

  const onlineStatus = useQuery(api.presence.getOnlineStatus, {
    userId: session.otherParticipant._id,
  });

  const isOnline = onlineStatus?.isOnline || false;

  return (
    <button
      onClick={() => onSelect(session)}
      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 ${
        isSelected
          ? "bg-violet-500/15 border border-violet-500/25"
          : "border border-transparent hover:bg-white/5 hover:border-white/8"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <GlobalAvatar
            user={{ name: session.otherParticipant.name, role: session.otherParticipant.role }}
            size="sm"
            clickable={false}
          />
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5">
              <PresenceIndicator isOnline={true} size="sm" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className={`text-sm font-medium truncate ${isSelected ? "text-white" : "text-white/75"}`}>
              {session.otherParticipant.name}
            </span>
            {unseenCount > 0 && (
              <span className="shrink-0 flex items-center gap-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold px-2 py-0.5 rounded-full">
                <Bell className="h-2.5 w-2.5" />
                {unseenCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-white/30">
              {session.type === "mentorship" ? "Mentorship" : "Direct Message"}
            </span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full border ${
                session.otherParticipant.role === "mentor"
                  ? "bg-violet-500/10 border-violet-500/20 text-violet-400"
                  : session.otherParticipant.role === "mentee"
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              }`}
            >
              {session.otherParticipant.role}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
