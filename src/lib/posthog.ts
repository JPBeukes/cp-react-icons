/**
 * Get the PostHog instance from window
 * PostHog is initialized via the inline script in posthog.astro
 */
function getPostHogInstance(): any {
  if (typeof window === 'undefined') {
    return null;
  }
  
  // PostHog is initialized via inline script, so it should be available on window
  const posthog = (window as any).posthog;
  
  // PostHog creates a stub that queues events before the library loads
  // The stub has methods like capture() that push to _i array
  return posthog || null;
}

/**
 * Track a custom event
 */
export function trackEvent(eventName: string, properties?: Record<string, any>): void {
  if (typeof window === 'undefined') {
    return;
  }

  const posthog = getPostHogInstance();
  
  if (!posthog) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ PostHog not available. Event not tracked:', eventName);
    }
    return;
  }

  try {
    // PostHog's inline script creates stub methods that queue events
    // The capture method should always be available as a function
    // It will either execute immediately (if loaded) or queue the event (if still loading)
    if (typeof posthog.capture === 'function') {
      posthog.capture(eventName, properties);
      
      if (import.meta.env.DEV) {
        console.log('✅ PostHog event tracked:', eventName, properties);
      }
    } else {
      // Fallback: manually queue the event if capture method isn't available
      // This shouldn't happen with the inline script, but just in case
      if (posthog._i && Array.isArray(posthog._i)) {
        posthog._i.push(['capture', eventName, properties]);
        if (import.meta.env.DEV) {
          console.log('📋 PostHog event queued manually:', eventName, properties);
        }
      } else {
        if (import.meta.env.DEV) {
          console.warn('⚠️ PostHog capture method not available. Event:', eventName);
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to track event:', error, eventName, properties);
  }
}

/**
 * Identify a user (optional, for when you have user info)
 */
export function identifyUser(userId: string, properties?: Record<string, any>): void {
  const posthog = getPostHogInstance();
  if (!posthog) {
    return;
  }

  try {
    posthog.identify(userId, properties);
  } catch (error) {
    console.error('Failed to identify user:', error);
  }
}

/**
 * Reset user identification (for logout)
 */
export function resetUser(): void {
  const posthog = getPostHogInstance();
  if (!posthog) {
    return;
  }

  try {
    posthog.reset();
  } catch (error) {
    console.error('Failed to reset user:', error);
  }
}

/**
 * Get the PostHog instance (for advanced usage)
 */
export function getPostHog(): any {
  return getPostHogInstance();
}

