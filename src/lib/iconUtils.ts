/**
 * Generate SVG string from a rendered icon element with applied colors
 * This function extracts the SVG from a DOM element and applies colors
 * @param padding - Padding percentage (0-0.5, e.g., 0.1 for 10% padding)
 */
export function getSvgStringFromElement(
  iconElement: HTMLElement | null,
  iconColor: string = '#000000',
  bgColor: string = 'transparent',
  size: number = 64,
  padding: number = 0
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
    
    // Add invisible border rectangle to ensure draw.io respects the full viewBox dimensions
    // This prevents cropping by defining the full bounds even with transparent background
    // Using a very small opacity (0.001) so it's technically visible for bounding box calculations
    // but effectively invisible to the human eye
    const borderRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    borderRect.setAttribute('x', expandedViewBox.x.toString());
    borderRect.setAttribute('y', expandedViewBox.y.toString());
    borderRect.setAttribute('width', expandedViewBox.width.toString());
    borderRect.setAttribute('height', expandedViewBox.height.toString());
    borderRect.setAttribute('fill', '#ffffff');
    borderRect.setAttribute('opacity', '0.001');
    // Insert at the very beginning to ensure it's part of the bounding box calculation
    clonedSvg.insertBefore(borderRect, clonedSvg.firstChild);
  }
  
  // Apply background color if needed
  if (bgColor !== 'transparent') {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', expandedViewBox.x.toString());
    rect.setAttribute('y', expandedViewBox.y.toString());
    rect.setAttribute('width', expandedViewBox.width.toString());
    rect.setAttribute('height', expandedViewBox.height.toString());
    rect.setAttribute('fill', bgColor);
    clonedSvg.insertBefore(rect, clonedSvg.firstChild);
  }
  
  // Apply icon color to all paths and other elements
  const applyColor = (element: Element) => {
    // For react-icons, paths typically use stroke, not fill
    // Apply stroke color (most Feather icons use stroke)
    if (element.hasAttribute('stroke')) {
      const strokeValue = element.getAttribute('stroke');
      // Only override if it's not 'none' and not already set to a color
      if (strokeValue !== 'none' && strokeValue !== 'currentColor') {
        element.setAttribute('stroke', iconColor);
      } else if (strokeValue === 'currentColor' || !strokeValue) {
        element.setAttribute('stroke', iconColor);
      }
    }
    
    // Apply fill color if present
    if (element.hasAttribute('fill')) {
      const fillValue = element.getAttribute('fill');
      if (fillValue !== 'none' && fillValue !== 'currentColor') {
        element.setAttribute('fill', iconColor);
      } else if (fillValue === 'currentColor' || !fillValue) {
        element.setAttribute('fill', iconColor);
      }
    }
    
    // Recursively apply to children
    Array.from(element.children).forEach(applyColor);
  };
  
  // Apply color to all child elements
  Array.from(clonedSvg.children).forEach(applyColor);
  
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
