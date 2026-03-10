"use client";

import React, { useState } from "react";
import { enhancedProfileSchema } from "@/app/schemas/enhanced-profile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { api } from "../../../../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { useTransition } from "react";
import { Loader2, Briefcase, Github, Linkedin, Globe, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const EnhancedProfilePage = () => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const mutation = useMutation(api.users.createOrUpdateProfile);
  const currentProfile = useQuery(api.users.getCurrentProfile);
  const { isAuthenticated, isLoading } = useConvexAuth();

  const form = useForm({
    resolver: zodResolver(enhancedProfileSchema),
    defaultValues: {
      name: currentProfile?.name || "",
      role: currentProfile?.role || "mentee",
      bio: currentProfile?.bio || "",
      availability: currentProfile?.availability || "",
      professionalExperience: currentProfile?.professionalExperience || "",
      portfolioUrl: currentProfile?.portfolioUrl || "",
      githubUrl: currentProfile?.githubUrl || "",
      linkedinUrl: currentProfile?.linkedinUrl || "",
      yearsOfExperience: currentProfile?.yearsOfExperience || undefined,
      teachingExperience: currentProfile?.teachingExperience || "",
    },
  });

  // Watch the role field to show/hide mentor-specific sections
  const selectedRole = useWatch({
    control: form.control,
    name: "role",
  });

  // Update form when profile data loads
  React.useEffect(() => {
    if (currentProfile) {
      form.reset({
        name: currentProfile.name || "",
        role: (currentProfile.role as any) || "mentee",
        bio: currentProfile.bio || "",
        availability: currentProfile.availability || "",
        professionalExperience: currentProfile.professionalExperience || "",
        portfolioUrl: currentProfile.portfolioUrl || "",
        githubUrl: currentProfile.githubUrl || "",
        linkedinUrl: currentProfile.linkedinUrl || "",
        yearsOfExperience: currentProfile.yearsOfExperience || undefined,
        teachingExperience: currentProfile.teachingExperience || "",
      });
    }
  }, [currentProfile, form]);

  function onSubmit(values: any) {
    startTransition(async () => {
      try {
        await mutation(values);
        toast.success("Profile updated successfully!");
        router.push("/dashboard");
      } catch (error) {
        toast.error("Failed to update profile. Please try again.");
      }
    });
  }

  const isMentor = selectedRole === "mentor" || selectedRole === "both";

  if (isLoading || currentProfile === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          {currentProfile?._id ? "Edit Your Profile" : "Create Your Profile"}
        </h1>
        <p className="text-xl text-muted-foreground">
          {currentProfile?._id 
            ? "Update your profile information" 
            : "Tell us about yourself to get started with mentorship"
          }
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Basic Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Your core profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup className="space-y-6">
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Full Name</FieldLabel>
                      <Input
                        aria-invalid={fieldState.invalid}
                        placeholder="Your name"
                        {...field}
                        readOnly
                        className="bg-muted cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Name is automatically retrieved from your account
                      </p>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="role"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>I want to be a...</FieldLabel>
                      <div className="relative">
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 appearance-none cursor-pointer"
                        >
                          <option value="">Select your role</option>
                          <option value="mentee">Mentee - I want to learn</option>
                          <option value="mentor">Mentor - I want to teach</option>
                          <option value="both">Both - I want to learn and teach</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                          </svg>
                        </div>
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="bio"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Bio</FieldLabel>
                      <Textarea
                        aria-invalid={fieldState.invalid}
                        placeholder="Tell us about yourself, your background, experience, and what you're passionate about..."
                        className="min-h-[120px]"
                        {...field}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="availability"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Availability (Optional)</FieldLabel>
                      <Textarea
                        aria-invalid={fieldState.invalid}
                        placeholder="e.g., Available weekdays after 6 PM, weekends flexible"
                        className="min-h-[80px]"
                        {...field}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        {/* Mentor-Specific Section */}
        {isMentor && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="size-5" />
                Mentor Information
              </CardTitle>
              <CardDescription>
                Showcase your expertise and experience to help mentees choose you as their mentor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup className="space-y-6">
                <Controller
                  name="professionalExperience"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Professional Experience *</FieldLabel>
                      <Textarea
                        aria-invalid={fieldState.invalid}
                        placeholder="Describe your professional background, key achievements, and areas of expertise..."
                        className="min-h-[150px]"
                        {...field}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        * Required for mentors - this helps mentees understand your background
                      </p>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="yearsOfExperience"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Years of Experience</FieldLabel>
                      <Input
                        type="number"
                        aria-invalid={fieldState.invalid}
                        placeholder="e.g., 5"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="teachingExperience"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel className="flex items-center gap-2">
                        <GraduationCap className="size-4" />
                        Teaching/Mentoring Experience
                      </FieldLabel>
                      <Textarea
                        aria-invalid={fieldState.invalid}
                        placeholder="Any previous teaching, mentoring, or leadership experience..."
                        className="min-h-[100px]"
                        {...field}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Controller
                    name="portfolioUrl"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel className="flex items-center gap-2">
                          <Globe className="size-4" />
                          Portfolio URL
                        </FieldLabel>
                        <Input
                          type="url"
                          aria-invalid={fieldState.invalid}
                          placeholder="https://yourportfolio.com"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="githubUrl"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel className="flex items-center gap-2">
                          <Github className="size-4" />
                          GitHub URL
                        </FieldLabel>
                        <Input
                          type="url"
                          aria-invalid={fieldState.invalid}
                          placeholder="https://github.com/username"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="linkedinUrl"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel className="flex items-center gap-2">
                          <Linkedin className="size-4" />
                          LinkedIn URL
                        </FieldLabel>
                        <Input
                          type="url"
                          aria-invalid={fieldState.invalid}
                          placeholder="https://linkedin.com/in/username"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>
              </FieldGroup>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              type="submit" 
              disabled={isPending}
              className="w-full"
              onClick={form.handleSubmit(onSubmit)}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                currentProfile?._id ? "Update Profile" : "Create Profile"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedProfilePage;
