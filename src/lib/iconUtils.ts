/**
 * Generate SVG string from a rendered icon element with applied colors
 * This function extracts the SVG from a DOM element and applies colors
 * @param padding - Padding percentage (0-0.5, e.g., 0.1 for 10% padding)
 * @param cornerRadius - Corner radius percentage (0-50, e.g., 50 for fully rounded/circle)
 */
export function getSvgStringFromElement(
  iconElement: HTMLElement | null,
  iconColor: string = '#000000',
  bgColor: string = 'transparent',
  size: number = 64,
  padding: number = 0,
  cornerRadius: number = 0
): string | null {
  if (!iconElement) return null;
  
  // Find the SVG element within the icon (could be direct child or nested)
  const svg = iconElement.querySelector('svg') || (iconElement.tagName === 'svg' ? iconElement : null);
  if (!svg || svg.tagName !== 'svg') return null;
  
  // Clone the SVG to avoid modifying the original
  const clonedSvg = svg.cloneNode(true) as SVGElement;
  
  // Set size attributes
  clonedSvg.setAttribute('width', size.toString());
  clonedSvg.setAttribute('height', size.toString());
  
  // Remove any color-related attributes from the SVG element itself
  // These will be overridden by the applyColor function on child elements
  clonedSvg.removeAttribute('color');
  const svgStyle = clonedSvg.getAttribute('style');
  if (svgStyle) {
    const cleanedStyle = svgStyle
      .replace(/color\s*:\s*[^;]+;?/gi, '')
      .trim();
    if (cleanedStyle) {
      clonedSvg.setAttribute('style', cleanedStyle);
    } else {
      clonedSvg.removeAttribute('style');
    }
  }
  
  // Get or set default viewBox (react-icons usually has viewBox="0 0 24 24")
  let viewBox = clonedSvg.getAttribute('viewBox');
  if (!viewBox) {
    viewBox = '0 0 24 24';
    clonedSvg.setAttribute('viewBox', viewBox);
  }
  
  // Parse viewBox values
  const viewBoxValues = viewBox.split(/\s+/).map(Number);
  if (viewBoxValues.length !== 4) {
    // Invalid viewBox, use default
    viewBoxValues[0] = 0;
    viewBoxValues[1] = 0;
    viewBoxValues[2] = 24;
    viewBoxValues[3] = 24;
  }
  
  const [x, y, width, height] = viewBoxValues;
  
  // Apply padding if specified (padding is a percentage of the icon size)
  let expandedViewBox = { x, y, width, height };
  if (padding > 0 && padding <= 0.5) {
    const paddingAmount = Math.min(width, height) * padding;
    expandedViewBox.x = x - paddingAmount;
    expandedViewBox.y = y - paddingAmount;
    expandedViewBox.width = width + (paddingAmount * 2);
    expandedViewBox.height = height + (paddingAmount * 2);
    
    clonedSvg.setAttribute('viewBox', `${expandedViewBox.x} ${expandedViewBox.y} ${expandedViewBox.width} ${expandedViewBox.height}`);
  }
  
  // Apply icon color to all paths and other elements FIRST
  // This ensures colors are applied before we add background elements
  const applyColor = (element: Element) => {
    // Get the tag name to determine if this is a shape element
    const tagName = element.tagName.toLowerCase();
    const isShapeElement = ['path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon'].includes(tagName);
    const isGroup = tagName === 'g';
    
    if (isShapeElement || isGroup) {
      const strokeValue = element.getAttribute('stroke');
      const fillValue = element.getAttribute('fill');
      
      // Apply stroke color (for Feather icons and other stroke-based icons)
      // Override stroke unless it's explicitly set to 'none'
      if (strokeValue !== null && strokeValue !== 'none') {
        element.setAttribute('stroke', iconColor);
      }
      
      // Apply fill color (for Phosphor icons and other fill-based icons)
      // Always override fill if it exists (even if it's a hardcoded color like #6b7280)
      // This ensures Phosphor icons get the correct color
      if (fillValue !== null) {
        // Override any existing fill value with icon color
        // This handles: fill="#6b7280", fill="currentColor", fill="black", etc.
        element.setAttribute('fill', iconColor);
      } else if (isShapeElement) {
        // If fill doesn't exist and this is a shape element, add fill
        // This handles Phosphor icons that might not have fill set initially
        // Only do this if stroke is not being used (stroke is 'none' or doesn't exist)
        if (strokeValue === null || strokeValue === '' || strokeValue === 'none') {
          element.setAttribute('fill', iconColor);
        }
      }
      
      // Remove any style attributes that might contain color overrides
      const styleAttr = element.getAttribute('style');
      if (styleAttr) {
        // Remove color, stroke, and fill from style
        const cleanedStyle = styleAttr
          .replace(/color\s*:\s*[^;]+;?/gi, '')
          .replace(/stroke\s*:\s*[^;]+;?/gi, '')
          .replace(/fill\s*:\s*[^;]+;?/gi, '')
          .trim();
        if (cleanedStyle) {
          element.setAttribute('style', cleanedStyle);
        } else {
          element.removeAttribute('style');
        }
      }
    }
    
    // Recursively apply to children
    Array.from(element.children).forEach(applyColor);
  };
  
  // Apply color to all original icon content BEFORE adding background
  // This ensures icon colors are set correctly
  Array.from(clonedSvg.children).forEach(applyColor);
  
  // Calculate corner radius in viewBox units
  const containerSize = Math.min(expandedViewBox.width, expandedViewBox.height);
  const radiusInViewBox = (containerSize * cornerRadius) / 100;
  
  // Apply corner radius clipping if needed
  if (cornerRadius > 0) {
    // Create a clipPath for rounded corners
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPath.setAttribute('id', 'rounded-corner-clip');
    const clipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    clipRect.setAttribute('x', expandedViewBox.x.toString());
    clipRect.setAttribute('y', expandedViewBox.y.toString());
    clipRect.setAttribute('width', expandedViewBox.width.toString());
    clipRect.setAttribute('height', expandedViewBox.height.toString());
    clipRect.setAttribute('rx', radiusInViewBox.toString());
    clipRect.setAttribute('ry', radiusInViewBox.toString());
    clipPath.appendChild(clipRect);
    defs.appendChild(clipPath);
    clonedSvg.insertBefore(defs, clonedSvg.firstChild);
    
    // Apply clipPath to the entire SVG
    clonedSvg.setAttribute('clip-path', 'url(#rounded-corner-clip)');
  }

  // NOW add background elements (after colors are applied to icon)
  // Apply background color FIRST (before any icon content) if needed
  // This ensures the background is rendered behind the icon
  if (bgColor !== 'transparent') {
    // Create rounded rectangle using a path or rect with rx/ry
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', expandedViewBox.x.toString());
    bgRect.setAttribute('y', expandedViewBox.y.toString());
    bgRect.setAttribute('width', expandedViewBox.width.toString());
    bgRect.setAttribute('height', expandedViewBox.height.toString());
    bgRect.setAttribute('rx', radiusInViewBox.toString());
    bgRect.setAttribute('ry', radiusInViewBox.toString());
    bgRect.setAttribute('fill', bgColor);
    // Insert after defs (if exists) but before icon content
    const defs = clonedSvg.querySelector('defs');
    if (defs && defs.nextSibling) {
      clonedSvg.insertBefore(bgRect, defs.nextSibling);
    } else if (defs) {
      clonedSvg.insertBefore(bgRect, clonedSvg.firstChild?.nextSibling || null);
    } else {
      clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);
    }
  }
  
  // Add invisible border rectangle AFTER background (if padding exists)
  // This prevents cropping by defining the full bounds even with transparent background
  if (padding > 0 && padding <= 0.5) {
    const borderRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    borderRect.setAttribute('x', expandedViewBox.x.toString());
    borderRect.setAttribute('y', expandedViewBox.y.toString());
    borderRect.setAttribute('width', expandedViewBox.width.toString());
    borderRect.setAttribute('height', expandedViewBox.height.toString());
    borderRect.setAttribute('rx', radiusInViewBox.toString());
    borderRect.setAttribute('ry', radiusInViewBox.toString());
    borderRect.setAttribute('fill', '#ffffff');
    borderRect.setAttribute('opacity', '0.001');
    // Insert after background (if exists) but before icon content
    // If background was inserted, it's now after defs, so insert border after it
    // Otherwise, insert after defs (if exists) or at the beginning
    const defs = clonedSvg.querySelector('defs');
    const bgRect = clonedSvg.querySelector('rect[fill]:not([opacity="0.001"])');
    if (bgRect && bgRect.nextSibling) {
      clonedSvg.insertBefore(borderRect, bgRect.nextSibling);
    } else if (defs && defs.nextSibling) {
      clonedSvg.insertBefore(borderRect, defs.nextSibling);
    } else if (defs) {
      clonedSvg.insertBefore(borderRect, clonedSvg.firstChild?.nextSibling || null);
    } else {
      clonedSvg.insertBefore(borderRect, clonedSvg.firstChild);
    }
  }
  
  return clonedSvg.outerHTML;
}

/**
 * Create a data URL from SVG string (for preview or download)
 */
export function svgToDataUrl(svgString: string): string {
  const encoded = encodeURIComponent(svgString);
  return `data:image/svg+xml,${encoded}`;
}

// Color conversion utilities for complementary color generation

/**
 * Convert hex color to HSL
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff) % 6;
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else {
      h = (r - g) / diff + 4;
    }
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  
  const l = (max + min) / 2;
  const s = diff === 0 ? 0 : diff / (1 - Math.abs(2 * l - 1));
  
  return {
    h,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to hex color
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Generate a complementary foreground color from a background color
 * Similar to Tailwind's color shading - keeps the same hue but adjusts lightness
 */
export function generateComplementaryColor(backgroundHex: string): string {
  const hsl = hexToHsl(backgroundHex);
  if (!hsl) return '#64748b'; // Default fallback
  
  let newLightness: number;
  
  // If background is very light (L > 85%), make foreground much darker
  if (hsl.l > 85) {
    newLightness = hsl.l - 45; // Much darker
  } 
  // If background is medium (L 40-85%), make foreground darker by ~40%
  else if (hsl.l > 40) {
    newLightness = hsl.l - 40; // Moderately darker
  } 
  // If background is dark (L < 40%), make foreground lighter
  else {
    newLightness = hsl.l + 30; // Lighter for dark backgrounds
  }
  
  // Clamp lightness between 10% and 90%
  newLightness = Math.max(10, Math.min(90, newLightness));
  
  // Slightly adjust saturation for better contrast (increase if low)
  const newSaturation = hsl.s < 30 ? Math.min(100, hsl.s + 20) : hsl.s;
  
  return hslToHex(hsl.h, newSaturation, newLightness);
}

/**
 * Check if dark mode is active
 */
export function isDarkMode(): boolean {
  // Check for .dark class on document element (Tailwind dark mode)
  if (document.documentElement.classList.contains('dark')) {
    return true;
  }
  
  // Check for prefers-color-scheme media query
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return true;
  }
  
  return false;
}

/**
 * Lighten a color for dark mode
 */
function lightenColor(hex: string, amount: number = 30): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;
  
  const newLightness = Math.min(90, hsl.l + amount);
  return hslToHex(hsl.h, hsl.s, newLightness);
}

/**
 * Adjust colors for dark mode - swaps background and foreground
 */
export function adjustColorsForDarkMode(
  bg: string, 
  fg: string
): { bg: string; fg: string } {
  if (bg === 'transparent') {
    // For transparent backgrounds, just lighten foreground for dark mode
    return { bg: 'transparent', fg: lightenColor(fg, 20) };
  }
  // Swap colors for dark mode
  return { bg: fg, fg: bg };
}
