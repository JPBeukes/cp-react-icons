import { useState, useRef, useEffect, useCallback } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const STORAGE_KEY = 'colorPickerCustomColors';
const DEFAULT_COLOR = '#64748b'; // rgb(100, 116, 139)

// Preset colors - removed light gray, added black
const PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#84cc16', // Light green
  '#3b82f6', // Light blue
  '#a855f7', // Purple
  '#000000', // Black
  '#64748b', // Dark gray
];

function loadCustomColors(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const colors = JSON.parse(stored);
      return Array.isArray(colors) ? colors : [];
    }
  } catch (error) {
    console.error('Failed to load custom colors:', error);
  }
  return [];
}

function saveCustomColors(colors: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  } catch (error) {
    console.error('Failed to save custom colors:', error);
  }
}

// Color conversion utilities
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;

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

  const s = max === 0 ? 0 : diff / max;
  const v = max;

  return { h, s: s * 100, v: v * 100 };
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  s /= 100;
  v /= 100;

  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

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

  return { r, g, b };
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customColors, setCustomColors] = useState<string[]>(loadCustomColors);
  const [tempColor, setTempColor] = useState(value || DEFAULT_COLOR);
  const [isEditingNewColor, setIsEditingNewColor] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const [hsv, setHsv] = useState(() => {
    const rgb = hexToRgb(value || DEFAULT_COLOR);
    return rgb ? rgbToHsv(rgb.r, rgb.g, rgb.b) : { h: 0, s: 0, v: 100 };
  });

  useEffect(() => {
    const rgb = hexToRgb(value || DEFAULT_COLOR);
    if (rgb) {
      setHsv(rgbToHsv(rgb.r, rgb.g, rgb.b));
      setTempColor(value || DEFAULT_COLOR);
    }
  }, [value]);

  const savePendingColor = useCallback(() => {
    if (!isEditingNewColor) {
      setIsEditingNewColor(false);
      return;
    }
    
    const currentColor = tempColor.toLowerCase();
    
    // Check if color is already in presets or custom colors
    const isPreset = PRESET_COLORS.some(c => c.toLowerCase() === currentColor);
    const isCustom = customColors.some(c => c.toLowerCase() === currentColor);
    
    // Only add if it's not already in the list
    if (!isPreset && !isCustom) {
      const updatedColors = [...customColors, tempColor];
      setCustomColors(updatedColors);
      saveCustomColors(updatedColors);
    }
    
    setIsEditingNewColor(false);
  }, [isEditingNewColor, tempColor, customColors]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        savePendingColor();
        setIsOpen(false);
        setShowCustomPicker(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        savePendingColor();
        setIsOpen(false);
        setShowCustomPicker(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, savePendingColor]);

  const handleColorSelect = (color: string) => {
    savePendingColor();
    setIsEditingNewColor(false);
    onChange(color);
    setIsOpen(false);
    setShowCustomPicker(false);
  };

  const handleStartEditingNewColor = () => {
    setIsEditingNewColor(true);
    setShowCustomPicker(true);
    // Set the current temp color as the selected value so it shows as highlighted
    onChange(tempColor);
  };


  const handleRemoveCustomColor = (e: React.MouseEvent, color: string) => {
    e.stopPropagation();
    const updatedColors = customColors.filter(c => c.toLowerCase() !== color.toLowerCase());
    setCustomColors(updatedColors);
    saveCustomColors(updatedColors);
  };

  const handleGradientClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gradientRef.current) return;
    const rect = gradientRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    
    const newS = x * 100;
    const newV = (1 - y) * 100;
    const newHsv = { ...hsv, s: newS, v: newV };
    setHsv(newHsv);
    
    const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
    const newColor = rgbToHex(rgb.r, rgb.g, rgb.b);
    setTempColor(newColor);
    onChange(newColor);
  };

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newH = x * 360;
    const newHsv = { ...hsv, h: newH };
    setHsv(newHsv);
    
    const rgb = hsvToRgb(newHsv.h, newHsv.s, newHsv.v);
    const newColor = rgbToHex(rgb.r, rgb.g, rgb.b);
    setTempColor(newColor);
    onChange(newColor);
  };

  const handleRgbChange = (channel: 'r' | 'g' | 'b', val: number) => {
    const rgb = hexToRgb(tempColor);
    if (!rgb) return;
    
    const newRgb = { ...rgb, [channel]: Math.max(0, Math.min(255, val)) };
    const newColor = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setTempColor(newColor);
    onChange(newColor);
    
    const newHsv = rgbToHsv(newRgb.r, newRgb.g, newRgb.b);
    setHsv(newHsv);
  };

  const currentRgb = hexToRgb(tempColor) || { r: 0, g: 0, b: 0 };
  const gradientBg = `hsl(${hsv.h}, 100%, 50%)`;
  const sliderBg = `linear-gradient(to right, 
    hsl(0, 100%, 50%), 
    hsl(60, 100%, 50%), 
    hsl(120, 100%, 50%), 
    hsl(180, 100%, 50%), 
    hsl(240, 100%, 50%), 
    hsl(300, 100%, 50%), 
    hsl(360, 100%, 50%))`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 cursor-pointer rounded-md border-2 border-border hover:border-primary transition-colors"
        style={{ backgroundColor: value || DEFAULT_COLOR }}
        aria-label="Select color"
      />

      {isOpen && (
        <div className="absolute top-12 left-0 z-50 bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[240px]">
          {/* Preset Colors */}
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleColorSelect(color)}
                className={`h-10 w-10 rounded-lg border-2 transition-all hover:scale-110 ${
                  value.toLowerCase() === color.toLowerCase()
                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                    : 'border-border hover:border-primary'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              >
                {value.toLowerCase() === color.toLowerCase() && (
                  <svg
                    className="w-5 h-5 m-auto text-white drop-shadow-lg"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Divider and Custom Colors */}
          {customColors.length > 0 && (
            <>
              <div className="border-t border-border my-3" />
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {customColors.map((color) => (
                  <div
                    key={color}
                    className="relative group"
                  >
                    <button
                      type="button"
                      onClick={() => handleColorSelect(color)}
                      className={`h-10 w-10 rounded-lg border-2 transition-all hover:scale-110 ${
                        value.toLowerCase() === color.toLowerCase()
                          ? 'border-primary ring-2 ring-primary ring-offset-2'
                          : 'border-border hover:border-primary'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    >
                      {value.toLowerCase() === color.toLowerCase() && (
                        <svg
                          className="w-5 h-5 m-auto text-white drop-shadow-lg"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveCustomColor(e, color)}
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center border border-background shadow-sm hover:bg-destructive/90"
                      aria-label={`Remove color ${color}`}
                    >
                      <svg
                        className="w-2.5 h-2.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
                {/* Add new color button or preview of new color being edited */}
                {isEditingNewColor ? (
                  <button
                    type="button"
                    onClick={() => handleColorSelect(tempColor)}
                    className={`h-10 w-10 rounded-lg border-2 transition-all hover:scale-110 ${
                      value.toLowerCase() === tempColor.toLowerCase()
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-border hover:border-primary'
                    }`}
                    style={{ backgroundColor: tempColor }}
                    aria-label={`Select color ${tempColor}`}
                  >
                    {value.toLowerCase() === tempColor.toLowerCase() && (
                      <svg
                        className="w-5 h-5 m-auto text-white drop-shadow-lg"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartEditingNewColor}
                    className="h-10 w-10 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-accent transition-all flex items-center justify-center"
                    aria-label="Add new color"
                  >
                    <svg
                      className="w-5 h-5 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </>
          )}

          {/* Custom Color Picker Section */}
          {customColors.length === 0 && (
            <div className="border-t border-border pt-3">
              {!showCustomPicker ? (
                <button
                  type="button"
                  onClick={handleStartEditingNewColor}
                  className="w-full text-sm text-muted-foreground hover:text-foreground py-2 px-3 rounded-md hover:bg-accent transition-colors"
                >
                  Custom Color
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tempColor || DEFAULT_COLOR}
                    onChange={(e) => {
                      const newColor = e.target.value;
                      setTempColor(newColor);
                      onChange(newColor);
                    }}
                    className="h-10 w-20 cursor-pointer rounded border"
                  />
                </div>
              )}
            </div>
          )}

          {/* Expanded Color Picker (when custom colors exist) */}
          {customColors.length > 0 && showCustomPicker && (
            <div className="pt-3">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={tempColor || DEFAULT_COLOR}
                  onChange={(e) => {
                    const newColor = e.target.value;
                    setTempColor(newColor);
                    onChange(newColor);
                  }}
                  className="h-10 w-20 cursor-pointer rounded border"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

