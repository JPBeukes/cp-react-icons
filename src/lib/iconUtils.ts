/**
 * Generate SVG string from a rendered icon element with applied colors
 * This function extracts the SVG from a DOM element and applies colors
 */
export function getSvgStringFromElement(
  iconElement: HTMLElement | null,
  iconColor: string = '#000000',
  bgColor: string = 'transparent',
  size: number = 64
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
  
  // Ensure viewBox is set (react-icons usually has viewBox="0 0 24 24")
  if (!clonedSvg.hasAttribute('viewBox')) {
    clonedSvg.setAttribute('viewBox', '0 0 24 24');
  }
  
  // Apply background color if needed
  if (bgColor !== 'transparent') {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', size.toString());
    rect.setAttribute('height', size.toString());
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
