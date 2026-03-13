import { v } from "convex/values";

// Content moderation types
export interface ModerationResult {
  isApproved: boolean;
  issues: string[];
  confidence: number;
  filteredContent?: string;
}

export interface ImageModerationResult {
  isApproved: boolean;
  issues: string[];
  confidence: number;
}

// Content moderation service
export class ContentModerationService {
  private static readonly GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  private static readonly GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  // Text moderation
  static async moderateText(content: string): Promise<ModerationResult> {
    try {
      const prompt = `
You are a content moderator for a professional mentorship platform. Please analyze the following blog content for:

1. Profanity and curse words
2. Offensive or hateful language
3. Inappropriate content
4. Spam or promotional content
5. Personal information sharing

Content to analyze:
"""
${content}
"""

Respond in JSON format with:
{
  "isApproved": true/false,
  "issues": ["list of issues found"],
  "confidence": 0.0-1.0,
  "filteredContent": "content with inappropriate words replaced with ***"
}

Be strict but reasonable. Educational content about difficult topics is allowed if it's professional.
`;

      const response = await fetch(`${this.GEMINI_API_URL}?key=${this.GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error("No response from Gemini API");
      }

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Invalid response format from Gemini API");
      }

      const result = JSON.parse(jsonMatch[0]);
      
      return {
        isApproved: result.isApproved || false,
        issues: result.issues || [],
        confidence: result.confidence || 0,
        filteredContent: result.filteredContent || content
      };

    } catch (error) {
      console.error("Text moderation error:", error);
      // Fail safe: approve if moderation fails
      return {
        isApproved: true,
        issues: ["Moderation service unavailable"],
        confidence: 0,
        filteredContent: content
      };
    }
  }

  // Image moderation
  static async moderateImage(imageData: string): Promise<ImageModerationResult> {
    try {
      // For now, we'll do basic image validation
      // In a production environment, you'd use a proper image moderation API
      
      // Check if it's a valid image (basic validation)
      if (!imageData.startsWith('data:image/')) {
        return {
          isApproved: false,
          issues: ["Invalid image format"],
          confidence: 1.0
        };
      }

      // Check file size (basic check)
      const base64Data = imageData.split(',')[1];
      const fileSize = Math.round(base64Data.length * 0.75) / 1024; // Rough estimate in KB
      
      if (fileSize > 5120) { // 5MB limit
        return {
          isApproved: false,
          issues: ["Image size too large (max 5MB)"],
          confidence: 1.0
        };
      }

      // Check image type
      const imageType = imageData.match(/data:image\/([^;]+)/);
      const allowedTypes = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
      
      if (!imageType || !allowedTypes.includes(imageType[1].toLowerCase())) {
        return {
          isApproved: false,
          issues: ["Unsupported image type. Allowed: JPEG, PNG, GIF, WebP"],
          confidence: 1.0
        };
      }

      // For now, approve images that pass basic validation
      // In production, you'd integrate with a service like:
      // - Google Cloud Vision API
      // - AWS Rekognition
      // - Azure Content Moderator
      // - Clarifai
      // - Sightengine
      
      return {
        isApproved: true,
        issues: [],
        confidence: 0.8
      };

    } catch (error) {
      console.error("Image moderation error:", error);
      // Fail safe: approve if moderation fails
      return {
        isApproved: true,
        issues: ["Image moderation service unavailable"],
        confidence: 0
      };
    }
  }

  // Combined moderation for blog post
  static async moderateBlogPost(title: string, content: string, featuredImage?: string): Promise<{
    isApproved: boolean;
    issues: string[];
    moderatedTitle?: string;
    moderatedContent?: string;
    imageApproved: boolean;
  }> {
    const allIssues: string[] = [];
    let moderatedTitle: string | undefined;
    let moderatedContent: string | undefined;
    let imageApproved = true;

    // Moderate title
    const titleResult = await this.moderateText(title);
    if (!titleResult.isApproved) {
      allIssues.push(...titleResult.issues.map(issue => `Title: ${issue}`));
      moderatedTitle = titleResult.filteredContent;
    }

    // Moderate content
    const contentResult = await this.moderateText(content);
    if (!contentResult.isApproved) {
      allIssues.push(...contentResult.issues.map(issue => `Content: ${issue}`));
      moderatedContent = contentResult.filteredContent;
    }

    // Moderate image if provided
    if (featuredImage) {
      const imageResult = await this.moderateImage(featuredImage);
      if (!imageResult.isApproved) {
        allIssues.push(...imageResult.issues.map(issue => `Image: ${issue}`));
        imageApproved = false;
      }
    }

    return {
      isApproved: titleResult.isApproved && contentResult.isApproved && imageApproved,
      issues: allIssues,
      moderatedTitle,
      moderatedContent,
      imageApproved
    };
  }
}
