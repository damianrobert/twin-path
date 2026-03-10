// Simple profanity filter for topic validation
const INAPPROPRIATE_WORDS = [
  // Common profanity (lowercase for case-insensitive matching)
  'fuck', 'fucking', 'shit', 'shitting', 'damn', 'hell', 'bitch', 'bastard',
  'ass', 'asshole', 'crap', 'piss', 'pissing', 'dick', 'cock', 'pussy',
  'slut', 'whore', 'cunt', 'twat', 'wanker', 'bollocks',
  // Potentially inappropriate terms for mentorship platform
  'kill', 'murder', 'suicide', 'terrorist', 'bomb', 'weapon', 'gun',
  'drug', 'drugs', 'overdose', 'addiction', 'illegal', 'criminal',
  // Hate speech terms
  'nazi', 'racist', 'nigger', 'kike', 'spic', 'chink', 'faggot',
  // Sexual content
  'porn', 'porno', 'sex', 'sexual', 'nude', 'naked', 'xxx', 'adult',
  'escort', 'prostitute', 'hooker'
];

export function containsInappropriateContent(text: string): boolean {
  if (!text) return false;
  
  const normalizedText = text.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ');
  const words = normalizedText.split(/\s+/);
  
  return words.some(word => 
    INAPPROPRIATE_WORDS.some(badWord => 
      word.includes(badWord) || badWord.includes(word)
    )
  );
}

export function validateTopicContent(name: string, description?: string): {
  isValid: boolean;
  error?: string;
} {
  // Check topic name
  if (containsInappropriateContent(name)) {
    return {
      isValid: false,
      error: "Topic name contains inappropriate content. Please keep it professional."
    };
  }
  
  // Check description if provided
  if (description && containsInappropriateContent(description)) {
    return {
      isValid: false,
      error: "Topic description contains inappropriate content. Please keep it professional."
    };
  }
  
  // Additional validation
  if (name.length < 2) {
    return {
      isValid: false,
      error: "Topic name must be at least 2 characters long."
    };
  }
  
  if (name.length > 50) {
    return {
      isValid: false,
      error: "Topic name must be less than 50 characters long."
    };
  }
  
  if (description && description.length > 200) {
    return {
      isValid: false,
      error: "Topic description must be less than 200 characters long."
    };
  }
  
  return { isValid: true };
}
