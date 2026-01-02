/**
 * Copy SVG string to clipboard
 */
export async function copySvgToClipboard(svg: string): Promise<void> {
  try {
    // Use the modern Clipboard API if available
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(svg);
      return;
    }
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = svg;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      textArea.remove();
    } catch (err) {
      textArea.remove();
      throw new Error('Failed to copy SVG to clipboard');
    }
  } catch (error) {
    throw new Error(`Failed to copy to clipboard: ${error}`);
  }
}

/**
 * Copy image blob to clipboard (for PNG)
 */
export async function copyImageToClipboard(blob: Blob, format: 'png'): Promise<void> {
  try {
    if (!navigator.clipboard || !navigator.clipboard.write) {
      throw new Error('Clipboard API not available');
    }
    
    const clipboardItem = new ClipboardItem({
      'image/png': blob,
    });
    
    await navigator.clipboard.write([clipboardItem]);
  } catch (error) {
    throw new Error(`Failed to copy image to clipboard: ${error}`);
  }
}

/**
 * Copy SVG as file to clipboard
 * Attempts to copy SVG as a file. If that fails, converts to PNG and copies that.
 * Note: Browser support for SVG files in clipboard is limited.
 */
export async function copySvgFileToClipboard(svg: string, filename: string = 'icon.svg'): Promise<void> {
  if (!navigator.clipboard || !navigator.clipboard.write) {
    throw new Error('Clipboard API not available');
  }

  // First, try to copy SVG directly as a file
  try {
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
    const clipboardItem = new ClipboardItem({
      'image/svg+xml': Promise.resolve(svgBlob),
    });
    
    await navigator.clipboard.write([clipboardItem]);
    return; // Success!
  } catch (svgError) {
    // SVG file copy not supported, try converting to PNG
    console.log('SVG file copy not supported, converting to PNG:', svgError);
  }

  // Fallback: Convert SVG to PNG and copy that
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = async () => {
      try {
        // Use a reasonable size for the canvas
        const size = 256; // Higher resolution for better quality
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Canvas context not available'));
          return;
        }
        
        // Draw the SVG image onto canvas
        ctx.drawImage(img, 0, 0, size, size);
        
        // Convert to PNG blob
        canvas.toBlob(async (pngBlob) => {
          if (!pngBlob) {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to convert SVG to PNG'));
            return;
          }
          
          try {
            // Copy PNG to clipboard as file
            const clipboardItem = new ClipboardItem({
              'image/png': Promise.resolve(pngBlob),
            });
            await navigator.clipboard.write([clipboardItem]);
            URL.revokeObjectURL(url);
            resolve();
          } catch (clipboardError) {
            URL.revokeObjectURL(url);
            console.error('Clipboard write error:', clipboardError);
            reject(new Error('Failed to copy to clipboard. Your browser may not support copying image files.'));
          }
        }, 'image/png');
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG image'));
    };
    
    img.src = url;
  });
}

/**
 * Copy SVG as PNG image to clipboard
 */
export async function copySvgAsPng(svg: string, size: number = 256): Promise<void> {
  if (!navigator.clipboard || !navigator.clipboard.write) {
    throw new Error('Clipboard API not available');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Canvas context not available'));
          return;
        }
        
        // Draw the SVG image onto canvas
        ctx.drawImage(img, 0, 0, size, size);
        
        // Convert to PNG blob
        canvas.toBlob(async (pngBlob) => {
          if (!pngBlob) {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to convert SVG to PNG'));
            return;
          }
          
          try {
            // Copy PNG to clipboard
            const clipboardItem = new ClipboardItem({
              'image/png': Promise.resolve(pngBlob),
            });
            await navigator.clipboard.write([clipboardItem]);
            URL.revokeObjectURL(url);
            resolve();
          } catch (clipboardError) {
            URL.revokeObjectURL(url);
            console.error('Clipboard write error:', clipboardError);
            reject(new Error('Failed to copy PNG to clipboard. Your browser may not support copying image files.'));
          }
        }, 'image/png');
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG image'));
    };
    
    img.src = url;
  });
}


/**
 * Download SVG as file
 */
export function downloadSvgFile(svg: string, filename: string = 'icon.svg'): void {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

