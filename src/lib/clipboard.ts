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
 * Copy image blob to clipboard (for PNG/JPEG)
 */
export async function copyImageToClipboard(blob: Blob, format: 'png' | 'jpeg'): Promise<void> {
  try {
    if (!navigator.clipboard || !navigator.clipboard.write) {
      throw new Error('Clipboard API not available');
    }
    
    const clipboardItem = new ClipboardItem({
      [format === 'png' ? 'image/png' : 'image/jpeg']: blob,
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
 * Copy SVG as JPG/JPEG image to clipboard
 */
export async function copySvgAsJpg(svg: string, size: number = 256): Promise<void> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/7efbe24a-7b62-4ace-9a78-8a540934a69c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clipboard.ts:207',message:'copySvgAsJpg function entry',data:{size,svgLength:svg.length,hasClipboard:!!navigator.clipboard,hasClipboardWrite:!!navigator.clipboard?.write},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'ALL'})}).catch(()=>{});
  // #endregion
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
        
        // Fill with white background for JPG (JPG doesn't support transparency)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        
        // Draw the SVG image onto canvas
        ctx.drawImage(img, 0, 0, size, size);
        
        // Convert to JPEG blob (quality 0.92 for good quality)
        canvas.toBlob(async (jpgBlob) => {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/7efbe24a-7b62-4ace-9a78-8a540934a69c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clipboard.ts:238',message:'toBlob callback entered',data:{jpgBlobExists:!!jpgBlob,jpgBlobType:jpgBlob?.type,jpgBlobSize:jpgBlob?.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          if (!jpgBlob) {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to convert SVG to JPG'));
            return;
          }
          
          try {
            // Try using the blob directly from canvas.toBlob() without wrapping
            // Chrome's ClipboardItem API may have issues with wrapped blobs
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/7efbe24a-7b62-4ace-9a78-8a540934a69c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clipboard.ts:251',message:'Attempting clipboard copy with direct blob',data:{jpgBlobType:jpgBlob.type,jpgBlobSize:jpgBlob.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            
            // Approach 1: Use blob directly with Promise.resolve (no Blob wrapper)
            try {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/7efbe24a-7b62-4ace-9a78-8a540934a69c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clipboard.ts:256',message:'Attempting image/jpeg with Promise.resolve (direct blob)',data:{blobType:jpgBlob.type,blobSize:jpgBlob.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
              const clipboardItem = new ClipboardItem({
                'image/jpeg': Promise.resolve(jpgBlob),
              });
              await navigator.clipboard.write([clipboardItem]);
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/7efbe24a-7b62-4ace-9a78-8a540934a69c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clipboard.ts:260',message:'image/jpeg clipboard write succeeded',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
              URL.revokeObjectURL(url);
              resolve();
              return;
            } catch (jpegError) {
              // #region agent log
              const errData = {errorName:jpegError instanceof Error ? jpegError.name : String(jpegError),errorMessage:jpegError instanceof Error ? jpegError.message : String(jpegError)};
              console.error('JPG clipboard copy - image/jpeg failed:', errData);
              fetch('http://127.0.0.1:7242/ingest/7efbe24a-7b62-4ace-9a78-8a540934a69c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clipboard.ts:264',message:'image/jpeg failed, trying image/jpg',data:errData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
              
              // Approach 2: Try 'image/jpg' MIME type (some browsers prefer this)
              try {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/7efbe24a-7b62-4ace-9a78-8a540934a69c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clipboard.ts:268',message:'Attempting image/jpg MIME type',data:{blobType:jpgBlob.type,blobSize:jpgBlob.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                const clipboardItem = new ClipboardItem({
                  'image/jpg': Promise.resolve(jpgBlob),
                });
                await navigator.clipboard.write([clipboardItem]);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/7efbe24a-7b62-4ace-9a78-8a540934a69c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clipboard.ts:272',message:'image/jpg clipboard write succeeded',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                URL.revokeObjectURL(url);
                resolve();
                return;
              } catch (jpgError) {
                // #region agent log
                const errData = {jpegError:jpegError instanceof Error ? jpegError.message : String(jpegError),jpgError:jpgError instanceof Error ? jpgError.message : String(jpgError)};
                console.error('JPG clipboard copy - Both attempts failed:', errData);
                fetch('http://127.0.0.1:7242/ingest/7efbe24a-7b62-4ace-9a78-8a540934a69c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clipboard.ts:276',message:'All JPG clipboard attempts failed, converting to PNG',data:errData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'ALL'})}).catch(()=>{});
                // #endregion
                // Chrome's ClipboardItem API doesn't support image/jpeg or image/jpg
                // Workaround: Convert JPEG to PNG for clipboard (Chrome only supports PNG)
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/7efbe24a-7b62-4ace-9a78-8a540934a69c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clipboard.ts:280',message:'Converting JPEG to PNG for clipboard',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'FIX'})}).catch(()=>{});
                // #endregion
                
                // Convert JPEG blob to PNG by loading it as an image and drawing to canvas
                const pngImg = new Image();
                const jpgUrl = URL.createObjectURL(jpgBlob);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/7efbe24a-7b62-4ace-9a78-8a540934a69c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clipboard.ts:309',message:'Created image object and object URL for PNG conversion',data:{jpgUrlCreated:!!jpgUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'FIX'})}).catch(()=>{});
                // #endregion
                
                pngImg.onload = async () => {
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/7efbe24a-7b62-4ace-9a78-8a540934a69c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clipboard.ts:312',message:'PNG image loaded, creating canvas',data:{imgWidth:pngImg.width,imgHeight:pngImg.height},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'FIX'})}).catch(()=>{});
                  // #endregion
                  try {
                    const pngCanvas = document.createElement('canvas');
                    pngCanvas.width = size;
                    pngCanvas.height = size;
                    const pngCtx = pngCanvas.getContext('2d');
                    
                    if (!pngCtx) {
                      URL.revokeObjectURL(url);
                      URL.revokeObjectURL(jpgUrl);
                      reject(new Error('Failed to copy JPG to clipboard. Canvas context not available.'));
                      return;
                    }
                    
                    // Fill with white background (same as JPG)
                    pngCtx.fillStyle = '#FFFFFF';
                    pngCtx.fillRect(0, 0, size, size);
                    pngCtx.drawImage(pngImg, 0, 0, size, size);
                    
                    pngCanvas.toBlob(async (pngBlob) => {
                      URL.revokeObjectURL(jpgUrl);
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/7efbe24a-7b62-4ace-9a78-8a540934a69c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clipboard.ts:332',message:'Canvas toBlob callback',data:{pngBlobExists:!!pngBlob,pngBlobSize:pngBlob?.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'FIX'})}).catch(()=>{});
                      // #endregion
                      if (!pngBlob) {
                        URL.revokeObjectURL(url);
                        reject(new Error('Failed to copy JPG to clipboard. Could not convert to PNG.'));
                        return;
                      }
                      
                      try {
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/7efbe24a-7b62-4ace-9a78-8a540934a69c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clipboard.ts:305',message:'Copying PNG to clipboard (JPG workaround)',data:{pngBlobSize:pngBlob.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'FIX'})}).catch(()=>{});
                        // #endregion
                        const clipboardItem = new ClipboardItem({
                          'image/png': Promise.resolve(pngBlob),
                        });
                        await navigator.clipboard.write([clipboardItem]);
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/7efbe24a-7b62-4ace-9a78-8a540934a69c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clipboard.ts:310',message:'PNG clipboard write succeeded (JPG workaround)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'FIX'})}).catch(()=>{});
                        // #endregion
                        URL.revokeObjectURL(url);
                        resolve();
                      } catch (pngError) {
                        // #region agent log
                        const pngErrData = {errorName:pngError instanceof Error ? pngError.name : String(pngError),errorMessage:pngError instanceof Error ? pngError.message : String(pngError)};
                        fetch('http://127.0.0.1:7242/ingest/7efbe24a-7b62-4ace-9a78-8a540934a69c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clipboard.ts:353',message:'PNG clipboard write error',data:pngErrData,timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'FIX'})}).catch(()=>{});
                        // #endregion
                        URL.revokeObjectURL(url);
                        reject(new Error('Failed to copy JPG to clipboard. Your browser may not support copying image files.'));
                      }
                    }, 'image/png');
                  } catch (error) {
                    URL.revokeObjectURL(url);
                    URL.revokeObjectURL(jpgUrl);
                    reject(new Error('Failed to copy JPG to clipboard. Could not convert to PNG.'));
                  }
                };
                
                pngImg.onerror = (error) => {
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/7efbe24a-7b62-4ace-9a78-8a540934a69c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clipboard.ts:360',message:'PNG image load error',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'FIX'})}).catch(()=>{});
                  // #endregion
                  URL.revokeObjectURL(url);
                  URL.revokeObjectURL(jpgUrl);
                  reject(new Error('Failed to copy JPG to clipboard. Could not load JPEG image.'));
                };
                
                pngImg.src = jpgUrl;
              }
            }
          } catch (clipboardError) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/7efbe24a-7b62-4ace-9a78-8a540934a69c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'clipboard.ts:279',message:'Outer catch block triggered',data:{errorName:clipboardError instanceof Error ? clipboardError.name : String(clipboardError),errorMessage:clipboardError instanceof Error ? clipboardError.message : String(clipboardError),errorStack:clipboardError instanceof Error ? clipboardError.stack?.substring(0,300) : undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            URL.revokeObjectURL(url);
            console.error('Clipboard write error:', clipboardError);
            reject(new Error('Failed to copy JPG to clipboard. Your browser may not support copying image files.'));
          }
        }, 'image/jpeg', 0.92);
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

