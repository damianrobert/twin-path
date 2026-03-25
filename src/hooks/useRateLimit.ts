import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  key: string;
  onLimitReached?: () => void;
  showNotification?: boolean;
}

interface RateLimitState {
  remaining: number;
  resetTime: number;
  isLimited: boolean;
  canRequest: boolean;
}

export const useRateLimit = (config: RateLimitConfig) => {
  const [state, setState] = useState<RateLimitState>({
    remaining: config.maxRequests,
    resetTime: Date.now() + config.windowMs,
    isLimited: false,
    canRequest: true,
  });

  const requestHistory = useRef<number[]>([]);

  // Load state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`rate_limit_${config.key}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        
        // Reset if window has expired
        if (now > parsed.resetTime) {
          setState({
            remaining: config.maxRequests,
            resetTime: now + config.windowMs,
            isLimited: false,
            canRequest: true,
          });
        } else {
          setState(parsed);
          requestHistory.current = parsed.requests || [];
        }
      } catch (error) {
        console.error("Failed to parse rate limit state:", error);
      }
    }
  }, [config.key, config.maxRequests, config.windowMs]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const dataToStore = {
      ...state,
      requests: requestHistory.current,
    };
    localStorage.setItem(`rate_limit_${config.key}`, JSON.stringify(dataToStore));
  }, [state, config.key]);

  // Check if a request can be made
  const canMakeRequest = useCallback(() => {
    const now = Date.now();
    
    // Reset window if expired
    if (now > state.resetTime) {
      requestHistory.current = [];
      setState({
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
        isLimited: false,
        canRequest: true,
      });
      return true;
    }

    // Filter old requests
    requestHistory.current = requestHistory.current.filter(
      timestamp => now - timestamp < config.windowMs
    );

    // Check if we can make a request
    if (requestHistory.current.length >= config.maxRequests) {
      setState(prev => ({
        ...prev,
        isLimited: true,
        canRequest: false,
      }));
      
      if (config.showNotification !== false) {
        toast.error(`Rate limit exceeded. Please wait ${Math.ceil((state.resetTime - now) / 1000)} seconds.`);
      }
      
      if (config.onLimitReached) {
        config.onLimitReached();
      }
      
      return false;
    }

    return true;
  }, [config, state.resetTime, config.showNotification, config.onLimitReached]);

  // Record a request
  const recordRequest = useCallback(() => {
    const now = Date.now();
    
    if (!canMakeRequest()) {
      return false;
    }

    requestHistory.current.push(now);
    
    const remaining = Math.max(0, config.maxRequests - requestHistory.current.length);
    
    setState({
      remaining,
      resetTime: now + config.windowMs,
      isLimited: remaining === 0,
      canRequest: remaining > 0,
    });

    return true;
  }, [canMakeRequest, config.maxRequests, config.windowMs]);

  // Execute a function with rate limiting
  const executeWithLimit = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      if (!recordRequest()) {
        return null;
      }

      try {
        return await fn();
      } catch (error) {
        // Don't count failed requests against rate limit
        requestHistory.current.pop();
        setState(prev => ({
          ...prev,
          remaining: prev.remaining + 1,
          canRequest: true,
          isLimited: false,
        }));
        throw error;
      }
    },
    [recordRequest]
  );

  // Reset the rate limit
  const reset = useCallback(() => {
    requestHistory.current = [];
    setState({
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
      isLimited: false,
      canRequest: true,
    });
    localStorage.removeItem(`rate_limit_${config.key}`);
  }, [config.key, config.maxRequests, config.windowMs]);

  // Get time until reset
  const getTimeUntilReset = useCallback(() => {
    const now = Date.now();
    return Math.max(0, state.resetTime - now);
  }, [state.resetTime]);

  return {
    ...state,
    recordRequest,
    executeWithLimit,
    reset,
    getTimeUntilReset,
    canMakeRequest,
  };
};

// Global rate limiter for API calls
export const useGlobalRateLimit = () => {
  return useRateLimit({
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    key: "global_api",
    showNotification: true,
  });
};

// Authentication rate limiter
export const useAuthRateLimit = () => {
  return useRateLimit({
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    key: "auth",
    showNotification: true,
    onLimitReached: () => {
      toast.error("Too many authentication attempts. Please wait before trying again.");
    },
  });
};

// Content creation rate limiter
export const useContentRateLimit = () => {
  return useRateLimit({
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    key: "content_creation",
    showNotification: true,
  });
};

// Search rate limiter
export const useSearchRateLimit = () => {
  return useRateLimit({
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
    key: "search",
    showNotification: false, // Don't show notifications for search
  });
};

// Rate limit indicator component
import React from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface RateLimitIndicatorProps {
  remaining: number;
  maxRequests: number;
  resetTime: number;
  isLimited: boolean;
}

export const RateLimitIndicator: React.FC<RateLimitIndicatorProps> = ({
  remaining,
  maxRequests,
  resetTime,
  isLimited,
}) => {
  const [timeUntilReset, setTimeUntilReset] = React.useState(0);

  React.useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const timeLeft = Math.max(0, resetTime - now);
      setTimeUntilReset(timeLeft);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [resetTime]);

  const percentage = (remaining / maxRequests) * 100;
  const isWarning = percentage <= 20 && percentage > 0;
  const isDanger = percentage === 0;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isDanger ? "bg-red-500" : isWarning ? "bg-yellow-500" : "bg-green-500"
          }`}
          style={{ width: `${Math.max(0, percentage)}%` }}
        />
      </div>
      
      <div className="flex items-center gap-1 min-w-0">
        {isLimited && (
          <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
        )}
        {!isLimited && remaining > 0 && (
          <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        )}
        
        <span className={`truncate ${
          isDanger ? "text-red-500" : isWarning ? "text-yellow-500" : "text-muted-foreground"
        }`}>
          {isLimited ? "Limited" : `${remaining}/${maxRequests}`}
        </span>
        
        {timeUntilReset > 0 && (
          <span className="text-muted-foreground">
            ({formatTime(timeUntilReset)})
          </span>
        )}
      </div>
    </div>
  );
};

// Hook for debounced requests
export const useDebouncedRateLimit = (config: RateLimitConfig, debounceMs: number = 300) => {
  const rateLimit = useRateLimit(config);
  const debounceTimer = useRef<NodeJS.Timeout>();

  const executeDebounced = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      return new Promise((resolve) => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(async () => {
          try {
            const result = await rateLimit.executeWithLimit(fn);
            resolve(result);
          } catch (error) {
            resolve(null);
          }
        }, debounceMs);
      });
    },
    [rateLimit, debounceMs]
  );

  return {
    ...rateLimit,
    executeDebounced,
  };
};

// Hook for progressive delays
export const useProgressiveDelay = () => {
  const [attemptCount, setAttemptCount] = useState(0);
  const [delay, setDelay] = useState(0);

  const calculateDelay = useCallback((attempt: number) => {
    // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms, max 5000ms
    const baseDelay = 100;
    const maxDelay = 5000;
    return Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  }, []);

  const executeWithDelay = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      try {
        const result = await fn();
        setAttemptCount(0); // Reset on success
        setDelay(0);
        return result;
      } catch (error) {
        const newAttemptCount = attemptCount + 1;
        const newDelay = calculateDelay(newAttemptCount);
        
        setAttemptCount(newAttemptCount);
        setDelay(newDelay);
        
        throw error;
      }
    },
    [attemptCount, delay, calculateDelay]
  );

  const reset = useCallback(() => {
    setAttemptCount(0);
    setDelay(0);
  }, []);

  return {
    attemptCount,
    delay,
    executeWithDelay,
    reset,
  };
};
