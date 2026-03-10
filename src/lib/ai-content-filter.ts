// AI-powered content moderation system
export interface ContentModerationResult {
  isAppropriate: boolean;
  confidence: number;
  categories: {
    profanity: boolean;
    hateSpeech: boolean;
    violence: boolean;
    sexualContent: boolean;
    illegalActivities: boolean;
    spam: boolean;
  };
  reason?: string;
  suggestedAction?: 'allow' | 'block' | 'review';
}

// Fallback simple filter for when AI is unavailable
const FALLBACK_FILTER = {
  profanity: [
    // English
    'fuck', 'fucking', 'shit', 'shitting', 'damn', 'hell', 'bitch', 'bastard',
    'ass', 'asshole', 'crap', 'piss', 'pissing', 'dick', 'cock', 'pussy', 'slut', 'whore', 'cunt',
    // Romanian profanity
    'pula', 'pulă', 'muie', 'cur', 'curva', 'curva', 'fut', 'futu', 'fututi', 'futuţi',
    'cacat', 'căcat', 'prad', 'praf', 'mata', 'mă-ta', 'mata', 'suge', 'suge-pula',
    // Common variations
    'pula', 'pulă', 'muie', 'cur', 'curva', 'fut', 'cacat', 'prad', 'mata'
  ],
  hateSpeech: ['nazi', 'racist', 'nigger', 'kike', 'spic', 'chink', 'faggot', 'kill', 'murder', 'terrorist'],
  sexualContent: ['porn', 'porno', 'sex', 'sexual', 'nude', 'naked', 'xxx', 'adult', 'escort', 'prostitute'],
  illegalActivities: ['drug', 'drugs', 'overdose', 'addiction', 'illegal', 'criminal', 'weapon', 'gun', 'bomb']
};

export function simpleContentFilter(text: string): ContentModerationResult {
  if (!text || text.trim().length === 0) {
    return {
      isAppropriate: true,
      confidence: 1.0,
      categories: {
        profanity: false,
        hateSpeech: false,
        violence: false,
        sexualContent: false,
        illegalActivities: false,
        spam: false
      }
    };
  }

  const normalizedText = text.toLowerCase().trim();
  const words = normalizedText.split(/\s+/);
  
  const categories = {
    profanity: false,
    hateSpeech: false,
    violence: false,
    sexualContent: false,
    illegalActivities: false,
    spam: false
  };

  let flaggedWords: string[] = [];

  // Check each category
  Object.entries(FALLBACK_FILTER).forEach(([category, wordsList]) => {
    const hasViolation = words.some(word => 
      wordsList.some(badWord => 
        word.includes(badWord) || badWord.includes(word)
      )
    );
    (categories as any)[category] = hasViolation;
    
    if (hasViolation) {
      flaggedWords.push(category);
    }
  });

  const hasAnyViolation = Object.values(categories).some(Boolean);
  const confidence = hasAnyViolation ? 0.8 : 0.9;

  return {
    isAppropriate: !hasAnyViolation,
    confidence,
    categories,
    reason: hasAnyViolation ? `Content flagged for: ${flaggedWords.join(', ')}` : undefined,
    suggestedAction: hasAnyViolation ? 'block' : 'allow'
  };
}

// AI-powered content moderation (placeholder for future implementation)
export async function moderateContentWithAI(text: string): Promise<ContentModerationResult> {
  try {
    // Check if Gemini API key is available
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Gemini API key available:', !!apiKey);
    console.log('Text to moderate:', text);
    
    if (!apiKey) {
      console.warn('Gemini API key not found, falling back to simple filter');
      return simpleContentFilter(text);
    }

    // Use Google Gemini for content moderation
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze the following text for inappropriate content. This includes profanity, hate speech, violence, sexual content, or illegal activities in ANY language (English, Spanish, French, German, Romanian, Chinese, Japanese, etc.). Respond with ONLY a JSON object containing:
{
  "isAppropriate": true/false,
  "confidence": 0.0-1.0,
  "categories": {
    "profanity": true/false,
    "hateSpeech": true/false,
    "violence": true/false,
    "sexualContent": true/false,
    "illegalActivities": true/false,
    "spam": true/false
  },
  "reason": "brief explanation if inappropriate, including the language detected"
}

Text to analyze: "${text}"`
          }]
        }],
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE"
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 200,
        }
      })
    });

    console.log('Gemini response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Gemini raw response:', result);
    
    const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('Gemini AI response:', aiResponse);
    
    if (!aiResponse) {
      console.error('No response from Gemini');
      return simpleContentFilter(text);
    }

    // Parse the JSON response
    let moderationResult;
    try {
      moderationResult = JSON.parse(aiResponse.replace(/```json\n|\n```/g, ''));
      console.log('Parsed moderation result:', moderationResult);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', aiResponse, parseError);
      return simpleContentFilter(text);
    }

    // Validate the response structure
    if (!moderationResult || typeof moderationResult.isAppropriate !== 'boolean') {
      console.error('Invalid Gemini response structure:', moderationResult);
      return simpleContentFilter(text);
    }

    return {
      isAppropriate: moderationResult.isAppropriate,
      confidence: moderationResult.confidence || 0.8,
      categories: moderationResult.categories || {
        profanity: false,
        hateSpeech: false,
        violence: false,
        sexualContent: false,
        illegalActivities: false,
        spam: false
      },
      reason: moderationResult.reason,
      suggestedAction: moderationResult.isAppropriate ? 'allow' : 'block'
    };

  } catch (error) {
    console.error('AI moderation failed, falling back to simple filter:', error);
    return simpleContentFilter(text);
  }
}

// Combined moderation function with fallback
export async function moderateContent(text: string): Promise<ContentModerationResult> {
  // Try AI moderation first
  try {
    return await moderateContentWithAI(text);
  } catch (error) {
    console.warn('AI moderation unavailable, using fallback:', error);
    return simpleContentFilter(text);
  }
}

// Validation function for topics
export async function validateTopicContentAI(
  name: string, 
  description?: string
): Promise<{ isValid: boolean; error?: string; confidence?: number }> {
  
  // Validate topic name
  const nameResult = await moderateContent(name);
  if (!nameResult.isAppropriate) {
    return {
      isValid: false,
      error: `Topic name ${nameResult.reason || 'contains inappropriate content'}. Please keep it professional.`,
      confidence: nameResult.confidence
    };
  }
  
  // Validate description if provided
  if (description) {
    const descResult = await moderateContent(description);
    if (!descResult.isAppropriate) {
      return {
        isValid: false,
        error: `Topic description ${descResult.reason || 'contains inappropriate content'}. Please keep it professional.`,
        confidence: descResult.confidence
      };
    }
  }
  
  // Length validation
  if (name.length < 2) {
    return { isValid: false, error: "Topic name must be at least 2 characters long." };
  }
  
  if (name.length > 50) {
    return { isValid: false, error: "Topic name must be less than 50 characters long." };
  }
  
  if (description && description.length > 200) {
    return { isValid: false, error: "Topic description must be less than 200 characters long." };
  }
  
  return { 
    isValid: true, 
    confidence: Math.min(nameResult.confidence, description ? (await moderateContent(description)).confidence : 1.0)
  };
}
