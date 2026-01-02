import { useState, useRef, useEffect, useCallback } from 'react';
import { generateComplementaryColor } from '@/lib/iconUtils';

interface ColorPickerProps {
  backgroundValue: string;
  foregroundValue: string;
  onBackgroundChange: (color: string) => void;
  onForegroundChange: (color: string) => void;
  onSwap?: () => void;
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

type ColorMode = 'foreground' | 'background';

export default function ColorPicker({ 
  backgroundValue, 
  foregroundValue, 
  onBackgroundChange, 
  onForegroundChange,
  onSwap 
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>('foreground');
  const [isLinked, setIsLinked] = useState(true); // Linked by default
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customColors, setCustomColors] = useState<string[]>(loadCustomColors);
  const [isEditingNewColor, setIsEditingNewColor] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine which color we're currently editing
  const currentValue = colorMode === 'background' ? backgroundValue : foregroundValue;
  const currentOnChange = colorMode === 'background' ? onBackgroundChange : onForegroundChange;
  const [tempColor, setTempColor] = useState(currentValue === 'transparent' ? DEFAULT_COLOR : currentValue);

  useEffect(() => {
    const colorToUse = currentValue === 'transparent' ? DEFAULT_COLOR : currentValue;
    setTempColor(colorToUse);
  }, [currentValue]);

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
    
    if (colorMode === 'foreground') {
      onForegroundChange(color);
      // If linked, auto-generate complementary background
      if (isLinked && color !== 'transparent') {
        const complementary = generateComplementaryColor(color);
        onBackgroundChange(complementary);
      }
    } else {
      onBackgroundChange(color);
    }
    
    setIsOpen(false);
    setShowCustomPicker(false);
  };

  const handleTransparentSelect = () => {
    if (colorMode === 'background') {
      onBackgroundChange('transparent');
      setIsOpen(false);
      setShowCustomPicker(false);
    }
  };

  const handleStartEditingNewColor = () => {
    setIsEditingNewColor(true);
    setShowCustomPicker(true);
    const colorToUse = currentValue === 'transparent' ? DEFAULT_COLOR : currentValue;
    setTempColor(colorToUse);
    if (currentValue !== 'transparent') {
      currentOnChange(colorToUse);
    }
  };

  const handleRemoveCustomColor = (e: React.MouseEvent, color: string) => {
    e.stopPropagation();
    const updatedColors = customColors.filter(c => c.toLowerCase() !== color.toLowerCase());
    setCustomColors(updatedColors);
    saveCustomColors(updatedColors);
  };

  const handleToggleLink = () => {
    setIsLinked(!isLinked);
    // If linking, update background to match foreground
    if (!isLinked) {
      if (foregroundValue !== 'transparent') {
        const complementary = generateComplementaryColor(foregroundValue);
        onBackgroundChange(complementary);
      }
    }
  };

  // Render checkerboard pattern for transparent background
  const renderTransparentPattern = () => (
    <div
      className="absolute inset-0 rounded-lg"
      style={{
        backgroundImage: `
          linear-gradient(45deg, #ccc 25%, transparent 25%),
          linear-gradient(-45deg, #ccc 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #ccc 75%),
          linear-gradient(-45deg, transparent 75%, #ccc 75%)
        `,
        backgroundSize: '8px 8px',
        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
      }}
    />
  );

  const openColorPicker = (mode: ColorMode) => {
    setColorMode(mode);
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-3">
        {/* Foreground Color Swatch */}
        <div className="flex flex-col items-center gap-1.5">
          <label className="text-xs font-semibold text-foreground">FG</label>
          <button
            type="button"
            onClick={() => openColorPicker('foreground')}
            className="relative h-16 w-16 cursor-pointer rounded-lg border-2 border-border hover:border-primary transition-colors overflow-hidden"
            style={{ backgroundColor: foregroundValue }}
            aria-label="Select foreground color"
          >
            {foregroundValue === 'transparent' && renderTransparentPattern()}
          </button>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-col items-center gap-2">
          {/* Swap Button */}
          {onSwap && backgroundValue !== 'transparent' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSwap();
              }}
              className="h-8 w-8 rounded-md border border-border hover:border-primary hover:bg-accent transition-colors flex items-center justify-center"
              aria-label="Swap background and foreground colors"
              title="Swap colors"
            >
              <svg
                className="w-4 h-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </button>
          )}

          {/* Link/Unlink Button */}
          <button
            type="button"
            onClick={handleToggleLink}
            className={`h-8 w-8 rounded-md border transition-colors flex items-center justify-center ${
              isLinked
                ? 'border-primary bg-primary/10 hover:bg-primary/20'
                : 'border-border hover:border-primary hover:bg-accent'
            }`}
            aria-label={isLinked ? 'Unlink colors' : 'Link colors'}
            title={isLinked ? 'Unlink colors' : 'Link colors'}
          >
            <svg
              className={`w-4 h-4 ${isLinked ? 'text-primary' : 'text-muted-foreground'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isLinked ? (
                // Linked chain icon
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              ) : (
                // Unlinked chain icon (broken chain with slash)
                <>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    opacity="0.5"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6"
                  />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Background Color Swatch */}
        <div className="flex flex-col items-center gap-1.5">
          <label className="text-xs font-semibold text-foreground">BG</label>
          <button
            type="button"
            onClick={() => openColorPicker('background')}
            className="relative h-16 w-16 cursor-pointer rounded-lg border-2 border-border hover:border-primary transition-colors overflow-hidden"
            style={{ backgroundColor: backgroundValue === 'transparent' ? 'transparent' : backgroundValue }}
            aria-label="Select background color"
          >
            {backgroundValue === 'transparent' && renderTransparentPattern()}
          </button>
        </div>
      </div>

      {/* Color Picker Popup */}
      {isOpen && (
        <div className="absolute top-20 left-0 z-50 bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[280px]">
          {/* Mode Indicator */}
          <div className="mb-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md ${
              colorMode === 'foreground'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            }`}>
              <span className="font-medium">
                {colorMode === 'foreground' ? 'Foreground' : 'Background'} Color
              </span>
            </div>
          </div>

          {/* Transparent option for background */}
          {colorMode === 'background' && (
            <div className="mb-3">
              <button
                type="button"
                onClick={handleTransparentSelect}
                className={`w-full h-10 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                  backgroundValue === 'transparent'
                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                    : 'border-border hover:border-primary'
                }`}
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, #ccc 25%, transparent 25%),
                    linear-gradient(-45deg, #ccc 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #ccc 75%),
                    linear-gradient(-45deg, transparent 75%, #ccc 75%)
                  `,
                  backgroundSize: '12px 12px',
                  backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
                }}
              >
                <span className="text-sm font-medium bg-background/80 px-2 py-1 rounded">
                  Transparent
                </span>
                {backgroundValue === 'transparent' && (
                  <svg
                    className="w-5 h-5 text-primary drop-shadow-lg"
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
            </div>
          )}

          {/* Preset Colors */}
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {PRESET_COLORS.map((color) => {
              const isSelected = currentValue !== 'transparent' && 
                currentValue.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={`h-10 w-10 rounded-lg border-2 transition-all hover:scale-110 ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary ring-offset-2'
                      : 'border-border hover:border-primary'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                >
                  {isSelected && (
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
              );
            })}
          </div>

          {/* Divider and Custom Colors */}
          {customColors.length > 0 && (
            <>
              <div className="border-t border-border my-3" />
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {customColors.map((color) => {
                  const isSelected = currentValue !== 'transparent' && 
                    currentValue.toLowerCase() === color.toLowerCase();
                  return (
                    <div key={color} className="relative group">
                      <button
                        type="button"
                        onClick={() => handleColorSelect(color)}
                        className={`h-10 w-10 rounded-lg border-2 transition-all hover:scale-110 ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary ring-offset-2'
                            : 'border-border hover:border-primary'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                      >
                        {isSelected && (
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
                  );
                })}
                {/* Add new color button or preview of new color being edited */}
                {isEditingNewColor ? (
                  <button
                    type="button"
                    onClick={() => handleColorSelect(tempColor)}
                    className={`h-10 w-10 rounded-lg border-2 transition-all hover:scale-110 ${
                      currentValue !== 'transparent' && 
                      currentValue.toLowerCase() === tempColor.toLowerCase()
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-border hover:border-primary'
                    }`}
                    style={{ backgroundColor: tempColor }}
                    aria-label={`Select color ${tempColor}`}
                  >
                    {currentValue !== 'transparent' && 
                     currentValue.toLowerCase() === tempColor.toLowerCase() && (
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
                      currentOnChange(newColor);
                      // If linked and changing foreground, update background
                      if (isLinked && colorMode === 'foreground' && newColor !== 'transparent') {
                        const complementary = generateComplementaryColor(newColor);
                        onBackgroundChange(complementary);
                      }
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
                    currentOnChange(newColor);
                    // If linked and changing foreground, update background
                    if (isLinked && colorMode === 'foreground' && newColor !== 'transparent') {
                      const complementary = generateComplementaryColor(newColor);
                      onBackgroundChange(complementary);
                    }
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
