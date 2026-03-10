# Gemini API Setup for Content Moderation

## Getting Your Gemini API Key

### Step 1: Access Google AI Studio
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account (the one with your Gemini subscription)

### Step 2: Create API Key
1. Click "Create API Key" 
2. Give your key a descriptive name (e.g., "twin-path-moderation")
3. Copy the API key - it will look like: `AIzaSy...`

### Step 3: Add to Environment Variables
Create or update your `.env.local` file in the project root:

```env
GEMINI_API_KEY=AIzaSyYourActualApiKeyHere
```

### Step 4: Restart Development Server
```bash
pnpm dev
```

## How It Works

### Multi-Language Support
Gemini automatically supports content analysis in:
- English ✅
- Spanish ✅
- French ✅
- German ✅
- Chinese ✅
- Japanese ✅
- Korean ✅
- And 100+ more languages ✅

### Content Categories
The system checks for:
- **Profanity** - Curse words, vulgar language
- **Hate Speech** - Racial/ethnic slurs, discrimination
- **Violence** - Harm, weapons, threats
- **Sexual Content** - Adult themes, explicit material
- **Illegal Activities** - Drugs, criminal behavior
- **Spam** - Repetitive, low-quality content

### Example Usage

#### Appropriate Content:
```typescript
// These will pass
"Web Development" → ✅ Allowed
"Aprender Programación" → ✅ Allowed (Spanish)
"机器学习入门" → ✅ Allowed (Chinese)
```

#### Inappropriate Content:
```typescript
// These will be blocked
"Fuck Programming" → ❌ Blocked (profanity)
"Contenido para adultos" → ❌ Blocked (Spanish sexual content)
"暴力编程" → ❌ Blocked (Chinese violence)
```

## Cost & Limits

### Gemini 1.5 Flash (Used in Implementation)
- **Free tier**: 15 requests per minute
- **Paid tier**: $0.075 per 1,000 requests
- **Speed**: Very fast (flash model)
- **Context**: Up to 1M tokens

### Estimated Cost for Your Platform
- **Small platform** (<100 users): <$0.50/month
- **Medium platform** (<1000 users): <$5/month  
- **Large platform** (<10000 users): <$50/month

## Testing Your Setup

### 1. Test Basic Functionality
Try creating topics with:
- ✅ Appropriate content: "JavaScript Programming"
- ❌ Inappropriate content: "Fuck Programming"

### 2. Test Multi-Language
Try creating topics in different languages:
- Spanish: "Desarrollo Web"
- French: "Programmation Web" 
- German: "Webentwicklung"

### 3. Test Edge Cases
- Mixed languages
- Slang terms
- Context-dependent content
- Attempts to bypass filters

## Advanced Configuration

### Custom Prompts
You can modify the prompt in `ai-content-filter.ts` to be more or less strict:

```typescript
// More strict
text: `Analyze this text VERY STRICTLY for any potentially inappropriate content...`

// More lenient  
text: `Analyze this text for clearly inappropriate content only, allowing borderline cases...`
```

### Confidence Threshold
Adjust the confidence level for blocking:

```typescript
// In the validation function
if (result.confidence < 0.7) {
  // Flag for human review instead of blocking
}
```

### Category-Specific Actions
Different actions for different content types:

```typescript
if (result.categories.violence) {
  return { isValid: false, error: "Violent content is not allowed" };
} else if (result.categories.spam) {
  return { isValid: false, error: "Please provide more descriptive content" };
}
```

## Troubleshooting

### Common Issues

#### "API key not found"
- Make sure `.env.local` is in the project root
- Check for typos in the variable name
- Restart the development server

#### "Gemini API error: 400"
- Check if your API key is valid
- Ensure you have Gemini API access
- Verify your subscription is active

#### "No response from Gemini"
- Check your internet connection
- Try again (temporary API issues)
- Check Gemini API status page

#### "Failed to parse Gemini response"
- The AI response wasn't valid JSON
- System automatically falls back to keyword filtering
- Check console for debugging info

### Debug Mode
Add this to see detailed logs:

```typescript
// In ai-content-filter.ts
console.log('Gemini request:', text);
console.log('Gemini response:', aiResponse);
```

## Security Notes

### API Key Protection
- ✅ Server-side only (never exposed to browser)
- ✅ Environment variable (not in git)
- ✅ Fallback system if key is missing

### Rate Limiting
- ✅ Built-in Gemini rate limits
- ✅ Fallback to keyword filtering
- ✅ Graceful degradation

### Privacy
- ✅ Content sent to Google for analysis
- ✅ No personal data stored by Gemini
- ✅ Compliant with Google's privacy policy

## Next Steps

1. **Get your API key** from Google AI Studio
2. **Add to .env.local** as `GEMINI_API_KEY=...`
3. **Test with different languages** and content types
4. **Monitor performance** and adjust confidence thresholds
5. **Consider custom prompts** for your specific needs

Your Gemini subscription gives you excellent multi-language content moderation capabilities that are perfect for a global mentorship platform!
