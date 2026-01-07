import posthog from 'posthog-js';

let posthogInitialized = false;

/**
 * Initialize PostHog analytics
 */
export function initPostHog(): void {
  // Only initialize once
  if (posthogInitialized) {
    return;
  }

  // Check if we're in the browser
  if (typeof window === 'undefined') {
    return;
  }

  const posthogKey = import.meta.env.PUBLIC_POSTHOG_KEY;
  const posthogHost = import.meta.env.PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!posthogKey) {
    console.warn('PostHog key not found. Analytics will not be initialized.');
    return;
  }

  try {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      loaded: (posthog) => {
        if (import.meta.env.DEV) {
          console.log('PostHog initialized');
        }
      },
      // Enable automatic page view tracking
      capture_pageview: true,
      capture_pageleave: true,
      // Enable session recording (optional, can be disabled)
      disable_session_recording: false,
      // Enable autocapture for clicks and form submissions
      autocapture: true,
    });

    posthogInitialized = true;
  } catch (error) {
    console.error('Failed to initialize PostHog:', error);
  }
}

/**
 * Track a custom event
 */
export function trackEvent(eventName: string, properties?: Record<string, any>): void {
  if (typeof window === 'undefined' || !posthogInitialized) {
    return;
  }

  try {
    posthog.capture(eventName, properties);
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

/**
 * Identify a user (optional, for when you have user info)
 */
export function identifyUser(userId: string, properties?: Record<string, any>): void {
  if (typeof window === 'undefined' || !posthogInitialized) {
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
  if (typeof window === 'undefined' || !posthogInitialized) {
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
export function getPostHog(): typeof posthog | null {
  if (typeof window === 'undefined' || !posthogInitialized) {
    return null;
  }
  return posthog;
}

