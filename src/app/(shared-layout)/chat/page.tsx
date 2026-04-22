"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Send,
  MessageCircle,
  Search,
  Check,
  CheckCheck,
  Paperclip,
  X,
  Users,
} from "lucide-react";
import GlobalAvatar from "@/components/web/GlobalAvatar";
import DMRequestModal from "@/components/web/DMRequestModal";
import ChatSessionItem from "@/components/web/ChatSessionItem";
import { PresenceIndicator } from "@/components/web/PresenceIndicator";
import { useMultipleOnlineStatus } from "@/hooks/usePresence";
import { useChatFileUpload, getFileIcon, formatFileSize } from "@/hooks/useChatFileUpload";
import { toast } from "sonner";
import { FileAttachments } from "@/components/web/FileAttachments";

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

const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

export default function ChatPage() {
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { uploadFiles, uploadingFiles, isUploading } = useChatFileUpload();

  const chatSessions = useQuery(api.messages.getChatSessions) || [];
  const searchResults =
    useQuery(
      api.messages.searchUsers,
      searchQuery.trim() ? { searchQuery: searchQuery.trim() } : "skip"
    ) || [];
  const searchResultStatuses = useMultipleOnlineStatus(searchResults.map((u) => u._id));
  const selectedSessionStatus = useQuery(
    api.presence.getOnlineStatus,
    selectedSession?.otherParticipant._id
      ? { userId: selectedSession.otherParticipant._id }
      : "skip"
  );
  const sessionMessages =
    useQuery(
      selectedSession?.type === "mentorship"
        ? api.messages.getMessages
        : api.messages.getDMMessages,
      selectedSession?.type === "mentorship"
        ? { mentorshipId: selectedSession._id as Id<"mentorships"> }
        : selectedSession?.type === "dm"
        ? { chatSessionId: selectedSession._id as Id<"chatSessions"> }
        : "skip"
    ) || [];

  const sendMessage = useMutation(
    selectedSession?.type === "mentorship"
      ? api.messages.sendMessage
      : api.messages.sendDMMessage
  );
  const dmRequests = useQuery(api.messages.getDMRequests) || [];
  const respondToDMRequest = useMutation(api.messages.respondToDMRequest);
  const markMessagesAsSeen = useMutation(api.messages.markMessagesAsSeen);

  useEffect(() => {
    if (selectedSession) {
      if (selectedSession.type === "mentorship") {
        markMessagesAsSeen({ mentorshipId: selectedSession._id as Id<"mentorships"> });
      } else if (selectedSession.type === "dm") {
        markMessagesAsSeen({ chatSessionId: selectedSession._id as Id<"chatSessions"> });
      }
    }
  }, [selectedSession, markMessagesAsSeen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessionMessages]);

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && attachedFiles.length === 0) || !selectedSession) return;
    try {
      let uploadedAttachments: any[] = [];
      if (attachedFiles.length > 0) {
        uploadedAttachments = await uploadFiles(attachedFiles);
        if (uploadedAttachments.length === 0 && !messageInput.trim()) {
          toast.error("No valid files to send");
          setAttachedFiles([]);
          return;
        }
        if (uploadedAttachments.length !== attachedFiles.length) {
          toast.error("Some files failed to upload");
        }
      }
      if (messageInput.trim() || uploadedAttachments.length > 0) {
        if (selectedSession.type === "mentorship") {
          await sendMessage({
            mentorshipId: selectedSession._id as Id<"mentorships">,
            content: messageInput.trim(),
            attachments: uploadedAttachments,
          });
        } else {
          await sendMessage({
            chatSessionId: selectedSession._id as Id<"chatSessions">,
            content: messageInput.trim(),
            attachments: uploadedAttachments,
          });
        }
        setMessageInput("");
        setAttachedFiles([]);
      }
    } catch {
      toast.error("Failed to send message");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);
  };

  const handleRespondToRequest = async (requestId: Id<"dmRequests">, action: "accept" | "reject") => {
    try {
      await respondToDMRequest({ requestId, action });
    } catch {
      toast.error("Failed to respond to request");
    }
  };

  const isUploadingAny = Object.keys(uploadingFiles).length > 0;

  return (
    <div className="h-[calc(100vh-56px)] px-4 py-4 flex gap-4">
      {/* ── Sidebar ── */}
      <div className="w-72 shrink-0 flex flex-col bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/8">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Messages</h2>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
            <input
              type="text"
              placeholder="Search users…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearching(true)}
              onBlur={() => { if (!searchQuery) setIsSearching(false); }}
              className="w-full h-8 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl text-white/80 placeholder:text-white/25 text-xs focus:outline-none focus:border-purple-500/40 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setIsSearching(false); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3" style={{ scrollbarWidth: "none" }}>
          {/* Search results */}
          {isSearching && searchQuery.trim() && (
            <div className="space-y-1">
              <p className="text-xs text-white/30 px-2 pt-1 uppercase tracking-widest font-semibold">Results</p>
              {searchResults.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-white/30">No users found</p>
                </div>
              ) : (
                searchResults.map((user) => {
                  const isOnline = searchResultStatuses[user._id]?.isOnline || false;
                  return (
                    <div
                      key={user._id}
                      className="flex items-center justify-between gap-2 px-3 py-2.5 bg-white/[0.03] border border-white/8 rounded-xl"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative shrink-0">
                          <GlobalAvatar user={{ name: user.name, role: user.role }} size="sm" clickable={false} />
                          {isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5">
                              <PresenceIndicator isOnline={true} size="sm" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white/80 truncate">{user.name}</p>
                          {user.bio && (
                            <p className="text-xs text-white/35 line-clamp-1">{user.bio}</p>
                          )}
                        </div>
                      </div>
                      <DMRequestModal recipientId={user._id} recipientName={user.name}>
                        <button className="shrink-0 text-xs px-2.5 py-1 bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                          Message
                        </button>
                      </DMRequestModal>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* DM Requests */}
          {dmRequests.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-white/30 px-2 uppercase tracking-widest font-semibold">
                Pending ({dmRequests.length})
              </p>
              {dmRequests.map((request) => (
                <div
                  key={request._id}
                  className="px-3 py-3 bg-amber-500/5 border border-amber-500/15 rounded-xl space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <GlobalAvatar user={{ name: request.sender.name, role: request.sender.role }} size="sm" clickable={false} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white/80 truncate">{request.sender.name}</p>
                      <p className="text-xs text-white/35 line-clamp-2 mt-0.5">{request.message}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRespondToRequest(request._id, "accept")}
                      className="flex-1 text-xs h-7 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors font-medium"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespondToRequest(request._id, "reject")}
                      className="flex-1 text-xs h-7 bg-white/5 border border-white/10 text-white/40 hover:text-white/60 rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active chats */}
          {chatSessions.length > 0 && (
            <div className="space-y-0.5">
              <p className="text-xs text-white/30 px-2 uppercase tracking-widest font-semibold">Chats</p>
              {chatSessions.map((session) => (
                <ChatSessionItem
                  key={session._id}
                  session={session}
                  isSelected={selectedSession?._id === session._id}
                  onSelect={setSelectedSession}
                />
              ))}
            </div>
          )}

          {chatSessions.length === 0 && dmRequests.length === 0 && !isSearching && (
            <div className="flex flex-col items-center text-center py-10 px-4">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-4">
                <Users className="h-5 w-5 text-white/20" />
              </div>
              <p className="text-sm text-white/35">No conversations yet</p>
              <p className="text-xs text-white/20 mt-1">
                Start a mentorship or search for someone to message
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        {selectedSession ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-white/8 shrink-0">
              <div className="relative">
                <GlobalAvatar
                  user={{ name: selectedSession.otherParticipant.name, role: selectedSession.otherParticipant.role }}
                  size="md"
                  clickable={false}
                />
                {selectedSessionStatus?.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <PresenceIndicator isOnline={true} size="sm" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-white">
                  {selectedSession.otherParticipant.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      selectedSession.otherParticipant.role === "mentor"
                        ? "bg-violet-500/10 border-violet-500/20 text-violet-400"
                        : selectedSession.otherParticipant.role === "mentee"
                        ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {selectedSession.otherParticipant.role}
                  </span>
                  <span className="text-xs text-white/30">
                    {selectedSession.type === "mentorship" ? "Mentorship Chat" : "Direct Message"}
                  </span>
                  {selectedSessionStatus?.isOnline && (
                    <span className="text-xs text-emerald-400 font-medium">● Online</span>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 px-5 py-4 space-y-3 overflow-y-auto"
              style={{ scrollbarWidth: "none" }}
            >
              {sessionMessages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="h-10 w-10 text-white/15 mx-auto mb-3" />
                    <p className="text-sm text-white/30">No messages yet — say hello!</p>
                  </div>
                </div>
              )}

              {sessionMessages.map((message) => {
                const isOwn = message.sender._id !== selectedSession.otherParticipant._id;
                return (
                  <div
                    key={message._id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    {!isOwn && (
                      <div className="shrink-0 mr-2 self-end mb-1">
                        <GlobalAvatar
                          user={{ name: message.sender.name, role: message.sender.role }}
                          size="sm"
                          clickable={false}
                        />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                        isOwn
                          ? "bg-violet-600/30 border border-violet-500/25 rounded-br-sm"
                          : "bg-white/[0.06] border border-white/8 rounded-bl-sm"
                      }`}
                    >
                      {message.content && (
                        <p className={`text-sm leading-relaxed ${isOwn ? "text-white" : "text-white/85"}`}>
                          {message.content}
                        </p>
                      )}
                      <FileAttachments
                        attachments={(message as any).attachments || []}
                        isOwnMessage={isOwn}
                      />
                      <div className={`flex items-center justify-between gap-3 mt-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                        <p className="text-[10px] text-white/30">{formatDate(message.createdAt)}</p>
                        {isOwn && (
                          <span className="text-white/30">
                            {(message as any).seenBy?.length > 1 ? (
                              <CheckCheck className="h-3 w-3 text-violet-400" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="px-4 py-3 border-t border-white/8 shrink-0">
              {/* File preview */}
              {attachedFiles.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {attachedFiles.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs"
                    >
                      <span>{getFileIcon(file.type)}</span>
                      <span className="text-white/60 truncate max-w-[120px]">{file.name}</span>
                      <span className="text-white/30">({formatFileSize(file.size)})</span>
                      <button
                        onClick={() => setAttachedFiles((prev) => prev.filter((_, j) => j !== i))}
                        disabled={isUploading(file.name)}
                        className="text-white/30 hover:text-red-400 transition-colors ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* Attachment */}
                <div className="relative shrink-0">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    disabled={isUploadingAny}
                  />
                  <button
                    disabled={isUploadingAny}
                    className="h-9 w-9 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/8 transition-colors disabled:opacity-40"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                </div>

                {/* Text input */}
                <input
                  type="text"
                  placeholder="Type a message…"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isUploadingAny}
                  className="flex-1 h-9 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-purple-500/40 transition-colors disabled:opacity-50"
                />

                {/* Send */}
                <button
                  onClick={handleSendMessage}
                  disabled={(!messageInput.trim() && attachedFiles.length === 0) || isUploadingAny}
                  className="h-9 w-9 shrink-0 flex items-center justify-center bg-violet-600/40 border border-violet-500/30 text-violet-300 hover:bg-violet-600/60 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

              {isUploadingAny && (
                <p className="text-xs text-white/30 mt-1.5">
                  Uploading {Object.keys(uploadingFiles).length} file(s)…
                </p>
              )}
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <MessageCircle className="h-7 w-7 text-white/20" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Select a conversation</h3>
              <p className="text-white/35 text-sm">Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
