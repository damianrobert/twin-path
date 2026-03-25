# TwinPath DDoS Protection & Rate Limiting System

This document describes the comprehensive DDoS protection and rate limiting system implemented to secure TwinPath's API endpoints from attacks and abuse.

## 🛡️ Security Features

### **Multi-Layer Protection**
1. **Global Rate Limiting**: Platform-wide request limits
2. **IP-Based Limiting**: Per-IP address rate limits
3. **User-Based Limiting**: Per-authenticated-user limits
4. **Endpoint-Specific Limits**: Custom limits per API endpoint
5. **Progressive Delays**: Exponential backoff for high-frequency requests
6. **Pattern Detection**: Automated suspicious activity detection
7. **IP Whitelist/Blacklist**: Manual IP access control

### **DDoS Detection**
- **Bot Detection**: Identifies automated tools and crawlers
- **Rapid Endpoint Switching**: Detects endpoint hopping attacks
- **Unusual Patterns**: Flags abnormal request patterns
- **Missing Headers**: Identifies incomplete requests
- **High Frequency**: Blocks excessive request rates

## 📁 File Structure

```
src/
├── lib/
│   ├── ddos-protection.ts           # Core DDoS protection engine
│   ├── enhanced-api-middleware.ts   # API middleware with security
│   └── validation.ts               # Input validation & sanitization
├── hooks/
│   └── useRateLimit.ts             # Client-side rate limiting hooks
├── components/
│   ├── admin/
│   │   └── ddos-dashboard.tsx      # Admin dashboard for monitoring
│   └── ui/
│       └── validated-form.tsx      # Secure form components
└── app/api/
    └── protected-example/
        └── route.ts                # Example protected API endpoint
```

## ⚙️ Configuration

### **Default Configuration**
```typescript
const defaultConfig = {
  // Rate limits
  globalLimit: 10000,        // 10k requests/minute globally
  ipLimit: 100,              // 100 requests/minute per IP
  userLimit: 60,             // 60 requests/minute per user
  
  // DDoS detection
  suspiciousThreshold: 50,   // 50 requests triggers suspicion
  blockThreshold: 100,       // 100 requests triggers block
  blockDuration: 900000,     // 15 minutes block duration
  
  // Features
  enableCaptcha: true,
  enableProgressiveDelays: true,
  enableIpWhitelist: true,
  enableIpBlacklist: true,
};
```

### **Endpoint-Specific Limits**
```typescript
endpointLimits: {
  "/api/auth/sign-in": { limit: 10, windowMs: 60000 },
  "/api/auth/sign-up": { limit: 5, windowMs: 60000 },
  "/api/blog/create": { limit: 10, windowMs: 60000 },
  "/api/upload": { limit: 20, windowMs: 60000 },
  "/api/search": { limit: 30, windowMs: 60000 },
}
```

## 🔧 Usage Examples

### **API Routes**
```typescript
import { apiChains } from "@/lib/enhanced-api-middleware";

// Public endpoint with basic protection
export async function GET(req: NextRequest) {
  return apiChains.public(req, async () => {
    return NextResponse.json({ message: "Public endpoint" });
  });
}

// Protected endpoint requiring authentication
export async function POST(req: NextRequest) {
  return apiChains.protected(req, async () => {
    const user = (req as any).user;
    return NextResponse.json({ user, data: "Protected data" });
  });
}

// Admin-only endpoint
export async function PUT(req: NextRequest) {
  return apiChains.admin(req, async () => {
    return NextResponse.json({ message: "Admin data" });
  });
}

// Strict endpoint with multiple protections
export async function DELETE(req: NextRequest) {
  return apiChains.strict(req, async () => {
    return NextResponse.json({ message: "Strict protection" });
  });
}
```

### **Client-Side Rate Limiting**
```typescript
import { useRateLimit, useAuthRateLimit } from "@/hooks/useRateLimit";

function MyComponent() {
  const rateLimit = useRateLimit({
    maxRequests: 10,
    windowMs: 60000,
    key: "my_action",
    showNotification: true,
  });

  const authLimit = useAuthRateLimit();

  const handleClick = async () => {
    const result = await rateLimit.executeWithLimit(async () => {
      return await apiCall();
    });
    
    if (result) {
      console.log("Request successful");
    } else {
      console.log("Rate limited");
    }
  };

  return (
    <div>
      <button onClick={handleClick} disabled={!rateLimit.canRequest}>
        Make Request
      </button>
      <RateLimitIndicator {...rateLimit} />
    </div>
  );
}
```

### **Convex Function Protection**
```typescript
import { RateLimiter, ServerValidator } from "./validation";

export const createTopic = mutation({
  args: { name: v.string(), description: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Rate limiting
    const rateLimitKey = `create_topic:${user._id}`;
    if (!RateLimiter.checkRateLimit(rateLimitKey, 5, 60 * 60 * 1000)) {
      throw new ConvexError("Too many topics created. Please try again later.");
    }

    // Validation and sanitization
    const sanitizedName = ServerValidator.validateText(args.name, "topic name", 2, 50);
    
    // Store sanitized data
    const topicId = await ctx.db.insert("topics", {
      name: sanitizedName,
    });

    return topicId;
  },
});
```

## 📊 Monitoring & Dashboard

### **Admin Dashboard Features**
- **Real-time Statistics**: Request counts, blocks, suspicious IPs
- **IP Management**: Block/unblock/whitelist IP addresses
- **Activity Logs**: Recent security events and actions
- **Rate Limit Status**: Current limits and remaining requests
- **Protection Settings**: Configure security parameters

### **Rate Limit Indicators**
```typescript
import { RateLimitIndicator } from "@/hooks/useRateLimit";

<RateLimitIndicator
  remaining={75}
  maxRequests={100}
  resetTime={Date.now() + 60000}
  isLimited={false}
/>
```

## 🔍 DDoS Detection Patterns

### **Suspicious Activity Detection**
1. **No User Agent**: Missing or empty user-agent header
2. **Bot Patterns**: Known bot/crawler user agents
3. **Rapid Switching**: Quick endpoint changes
4. **High Frequency**: Excessive request rates
5. **Missing Auth**: No authorization on sensitive endpoints
6. **Unusual Timing**: Automated request patterns

### **Automatic Actions**
- **Warning**: Log suspicious activity
- **Progressive Delays**: Slow down responses
- **Temporary Blocks**: 15-minute automatic blocks
- **Manual Review**: Flag for admin investigation

## 🛠️ Advanced Features

### **Progressive Delays**
```typescript
// Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms, max 5000ms
const delay = calculateProgressiveDelay(requestCount);
await new Promise(resolve => setTimeout(resolve, delay));
```

### **IP Management**
```typescript
// Block an IP
DdosProtection.addToIpBlacklist("192.168.1.100");

// Whitelist an IP
DdosProtection.addToIpWhitelist("10.0.0.50");

// Check IP status
const status = DdosProtection.getIpStatus("192.168.1.100");
```

### **Security Headers**
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## 📈 Performance Impact

### **Memory Usage**
- **In-Memory Storage**: ~1KB per tracked IP
- **Cleanup**: Automatic expired entry removal
- **Scalability**: Suitable for medium-scale applications

### **Response Time**
- **Overhead**: < 5ms per request
- **Delay Addition**: Progressive delays only for abusers
- **Cache**: Efficient lookup structures

### **CPU Impact**
- **Pattern Matching**: Optimized regex patterns
- **Cleanup**: Background cleanup every 5 minutes
- **Minimal**: Negligible impact on legitimate traffic

## 🚀 Deployment Considerations

### **Production Setup**
1. **Redis Integration**: Replace in-memory storage with Redis
2. **Load Balancing**: Synchronize rate limits across instances
3. **Monitoring**: Integrate with logging and alerting
4. **Configuration**: Environment-specific settings

### **Environment Variables**
```bash
# DDoS Protection
DDOS_GLOBAL_LIMIT=10000
DDOS_IP_LIMIT=100
DDOS_USER_LIMIT=60
DDOS_BLOCK_DURATION=900000

# Rate Limiting
RATE_LIMIT_REDIS_URL=redis://localhost:6379
RATE_LIMIT_WINDOW_MS=60000

# Security
ENABLE_CAPTCHA=true
ENABLE_PROGRESIVE_DELAYS=true
IP_WHITELIST=127.0.0.1,::1
IP_BLACKLIST=
```

### **Monitoring Integration**
```typescript
// Log security events
console.warn(`IP ${ip} blocked: ${activity.type}`);

// Metrics collection
metrics.increment('ddos.requests.blocked');
metrics.increment('ddos.requests.suspicious');

// Alerting
if (blockedRequests > threshold) {
  alerting.send('DDoS attack detected');
}
```

## 🧪 Testing

### **Load Testing**
```typescript
// Test rate limiting
for (let i = 0; i < 150; i++) {
  await apiCall(); // Should be rate limited after 100
}

// Test DDoS detection
await rapidEndpointSwitching(); // Should trigger detection
```

### **Security Testing**
```typescript
// Test XSS protection
const xssPayload = '<script>alert("xss")</script>';
await apiCall({ message: xssPayload }); // Should be sanitized

// Test SQL injection
const sqlPayload = "'; DROP TABLE users; --";
await apiCall({ query: sqlPayload }); // Should be blocked
```

## 📋 Best Practices

### **For Developers**
1. **Use Middleware**: Always use provided API chains
2. **Validate Input**: Server-side validation is mandatory
3. **Handle Limits**: Graceful degradation when rate limited
4. **Monitor Logs**: Watch for security events
5. **Test Limits**: Verify rate limiting works

### **For Administrators**
1. **Monitor Dashboard**: Regular review of security metrics
2. **Update Lists**: Maintain IP whitelist/blacklist
3. **Adjust Limits**: Fine-tune based on usage patterns
4. **Review Logs**: Investigate suspicious activity
5. **Backup Config**: Keep configuration backed up

### **For Users**
1. **Respect Limits**: Don't bypass rate limiting
2. **Report Issues**: Report false positives
3. **Use APIs Responsibly**: Implement client-side limiting
4. **Handle Errors**: Graceful error handling
5. **Monitor Usage**: Track API usage

## 🔄 Maintenance

### **Regular Tasks**
- **Review Rate Limits**: Adjust based on traffic patterns
- **Update Detection Rules**: Add new attack patterns
- **Clean Up Storage**: Remove old entries
- **Monitor Performance**: Check impact on response times
- **Update Dependencies**: Keep security libraries current

### **Emergency Procedures**
1. **Attack in Progress**: Lower rate limits temporarily
2. **False Positives**: Add IPs to whitelist
3. **Performance Issues**: Disable non-essential features
4. **Data Breach**: Rotate secrets and reconfigure
5. **Service Outage**: Enable emergency bypass

---

This comprehensive DDoS protection system provides multiple layers of security for TwinPath's API endpoints, ensuring reliable service while protecting against abuse and attacks. The system is designed to be both effective and performant, with minimal impact on legitimate users.
