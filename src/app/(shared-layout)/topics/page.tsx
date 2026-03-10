"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { validateTopicContentAI } from "@/lib/ai-content-filter";

const TopicsPage = () => {
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicDescription, setNewTopicDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  const topics = useQuery(api.topics.getAllTopics);
  const createTopic = useMutation(api.topics.createTopic);
  const initializeTopics = useMutation(api.topics.initializeDefaultTopics);
  const addTopicToUser = useMutation(api.users.addUserTopic);
  const removeTopicFromUser = useMutation(api.users.removeUserTopic);
  const currentProfile = useQuery(api.users.getCurrentProfile);
  const userTopics = useQuery(
  api.users.getUserTopics, 
  currentProfile?._id ? { userId: currentProfile._id } : "skip"
);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;

    setIsCreating(true);

    try {
      // AI-powered content validation
      const validation = await validateTopicContentAI(newTopicName.trim(), newTopicDescription.trim());
      if (!validation.isValid) {
        toast.error(validation.error || "Content validation failed");
        return;
      }

      await createTopic({
        name: newTopicName.trim(),
        description: newTopicDescription.trim() || undefined,
      });
      setNewTopicName("");
      setNewTopicDescription("");
      toast.success("Topic created successfully!");
    } catch (error) {
      toast.error("Failed to create topic");
    } finally {
      setIsCreating(false);
    }
  };

  const handleInitializeTopics = async () => {
    try {
      await initializeTopics();
      toast.success("Default topics initialized!");
    } catch (error) {
      toast.error("Failed to initialize topics");
    }
  };

  const handleAddTopic = async (topicId: string, type: "expertise" | "interest") => {
    try {
      await addTopicToUser({
        topicId: topicId as any,
        type,
        skillLevel: type === "expertise" ? "expert" : "beginner",
      });
      toast.success(`Topic added as ${type}!`);
    } catch (error: any) {
      if (error.message?.includes("already added as")) {
        toast.error(error.message);
      } else if (error.message?.includes("already associated")) {
        toast.error("This topic is already added to your profile");
      } else {
        toast.error("Failed to add topic. Please try again.");
      }
    }
  };

  if (topics === undefined || currentProfile === undefined || (userTopics === undefined && currentProfile?._id)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  // Helper function to check if a topic is already added
  const isTopicAdded = (topicId: string, type: "expertise" | "interest") => {
    if (!userTopics) return false; // Handle case where userTopics is skipped or undefined
    return userTopics.some((userTopic: any) => 
      userTopic.topicId === topicId && userTopic.type === type
    );
  };

  // Helper function to find user topic ID for removal
  const findUserTopicId = (topicId: string, type: "expertise" | "interest") => {
    if (!userTopics) return null;
    const userTopic = userTopics.find((ut: any) => 
      ut.topicId === topicId && ut.type === type
    );
    return userTopic?._id || null;
  };

  return (
    <div className="py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Topics Management
        </h1>
        <p className="text-xl text-muted-foreground">
          Manage mentorship topics and your expertise areas
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Initialize Default Topics */}
        {topics.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Initialize Topics</CardTitle>
              <CardDescription>
                Start by adding some default topics to the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleInitializeTopics}>
                Initialize Default Topics
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create New Topic */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Topic</CardTitle>
            <CardDescription>
              Add a new mentorship topic to the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <Input
                placeholder="Topic name"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                required
              />
              <Textarea
                placeholder="Topic description (optional)"
                value={newTopicDescription}
                onChange={(e) => setNewTopicDescription(e.target.value)}
                className="min-h-[80px]"
              />
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Plus className="size-4 mr-2" />
                    Create Topic
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Available Topics */}
        {topics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Available Topics</CardTitle>
              <CardDescription>
                Topics available for mentorship on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topics.map((topic) => {
                  const isExpertiseAdded = isTopicAdded(topic._id, "expertise");
                  const isInterestAdded = isTopicAdded(topic._id, "interest");
                  
                  return (
                    <div key={topic._id} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-lg">{topic.name}</h3>
                      {topic.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {topic.description}
                        </p>
                      )}
                      
                      {/* Show user's current associations */}
                      {(isExpertiseAdded || isInterestAdded) && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {isExpertiseAdded && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Expertise ✓
                            </span>
                          )}
                          {isInterestAdded && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Interest ✓
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          title={isExpertiseAdded ? "Remove expertise" : "Add as expertise"}
                          className={`transition-all duration-200 ${
                            isExpertiseAdded 
                              ? "border-green-500 text-green-700 hover:bg-green-50 hover:border-red-400 hover:text-red-600" 
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => {
                            if (isExpertiseAdded) {
                              // Remove expertise
                              const userTopicId = findUserTopicId(topic._id, "expertise");
                              if (userTopicId) {
                                removeTopicFromUser({ userTopicId });
                                toast.success("Expertise removed");
                              }
                            } else {
                              handleAddTopic(topic._id, "expertise");
                            }
                          }}
                        >
                          {isExpertiseAdded ? "✓ Expertise" : "Add as Expertise"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          title={isInterestAdded ? "Remove interest" : "Add as interest"}
                          className={`transition-all duration-200 ${
                            isInterestAdded 
                              ? "border-green-500 text-green-700 hover:bg-green-50 hover:border-red-400 hover:text-red-600" 
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => {
                            if (isInterestAdded) {
                              // Remove interest
                              const userTopicId = findUserTopicId(topic._id, "interest");
                              if (userTopicId) {
                                removeTopicFromUser({ userTopicId });
                                toast.success("Interest removed");
                              }
                            } else {
                              handleAddTopic(topic._id, "interest");
                            }
                          }}
                        >
                          {isInterestAdded ? "✓ Interest" : "Add as Interest"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TopicsPage;
