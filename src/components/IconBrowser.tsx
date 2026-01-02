import { useState, useEffect, useRef } from 'react';
import IconItem from './IconItem';
import { featherIcons } from '@/lib/iconData';
import { Input } from './ui/input';
import ColorPicker from './ColorPicker';
import { Dropdown, DropdownItem } from './ui/dropdown';
import { Button } from './ui/button';
import PaddingSettings from './PaddingSettings';
import { generateComplementaryColor, isDarkMode, adjustColorsForDarkMode } from '@/lib/iconUtils';

interface IconBrowserProps {
  initialColor?: string;
}

const DEFAULT_SIZES = [64, 128, 512, 1024];
const DISPLAY_SIZE = 64; // Fixed size for gallery display

const DEFAULT_COLOR = '#64748b'; // rgb(100, 116, 139)
const DEFAULT_PADDING = 0.10; // 10% padding (Medium preset)

export default function IconBrowser({ initialColor = DEFAULT_COLOR }: IconBrowserProps) {
  const [searchValue, setSearchValue] = useState('');
  const [backgroundColor, setBackgroundColor] = useState<string>('transparent');
  const [foregroundColor, setForegroundColor] = useState(initialColor);
  const [copyFormat, setCopyFormat] = useState<'text' | 'png'>('text');
  const [iconSize, setIconSize] = useState<number>(64);
  const [customSize, setCustomSize] = useState<string>('');
  const [showCustomSize, setShowCustomSize] = useState(false);
  const [iconPadding, setIconPadding] = useState<number>(DEFAULT_PADDING);
  const [filteredIcons, setFilteredIcons] = useState<typeof featherIcons>([]);
  const [darkMode, setDarkMode] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Detect platform for keyboard shortcut display
  const [shortcutKey, setShortcutKey] = useState('⌘K');
  
  useEffect(() => {
    // Better platform detection
    const isMac = navigator.platform.toUpperCase().includes('MAC') || 
                  navigator.userAgent.toUpperCase().includes('MAC');
    setShortcutKey(isMac ? '⌘K' : 'Ctrl+K');
  }, []);

  useEffect(() => {
    // Load saved colors, or use defaults if none saved
    const savedForeground = localStorage.getItem('iconColor');
    const savedBackground = localStorage.getItem('iconBackgroundColor');
    
    let initialBg = 'transparent';
    let initialFg = DEFAULT_COLOR;
    
    if (savedBackground) {
      initialBg = savedBackground;
    } else {
      localStorage.setItem('iconBackgroundColor', 'transparent');
    }
    
    if (savedForeground) {
      initialFg = savedForeground;
    } else {
      // If no saved foreground and background is not transparent, generate complementary
      if (initialBg !== 'transparent') {
        initialFg = generateComplementaryColor(initialBg);
      }
      localStorage.setItem('iconColor', initialFg);
    }
    
    setBackgroundColor(initialBg);
    setForegroundColor(initialFg);

    // Load saved copy format
    const savedFormat = localStorage.getItem('copyFormat') as 'text' | 'png' | null;
    if (savedFormat === 'text' || savedFormat === 'png') {
      setCopyFormat(savedFormat);
    } else if (savedFormat === 'jpg') {
      // Migrate old JPG preference to PNG
      setCopyFormat('png');
      localStorage.setItem('copyFormat', 'png');
    }

    // Load saved icon size
    const savedSize = localStorage.getItem('iconSize');
    if (savedSize) {
      const size = parseInt(savedSize, 10);
      if (!isNaN(size) && size > 0) {
        setIconSize(size);
        if (!DEFAULT_SIZES.includes(size)) {
          setShowCustomSize(true);
          setCustomSize(size.toString());
        }
      }
    }

    // Load saved padding
    const savedPadding = localStorage.getItem('iconPadding');
    if (savedPadding) {
      const padding = parseFloat(savedPadding);
      if (!isNaN(padding) && padding >= 0 && padding <= 0.5) {
        setIconPadding(padding);
      }
    }

    // Initialize icons
    if (featherIcons && featherIcons.length > 0) {
      setFilteredIcons(featherIcons);
    } else {
      console.warn('No icons loaded');
    }

    // Listen for color changes (for potential future external components)
    const handleColorChange = ((e: CustomEvent) => {
      setForegroundColor(e.detail.color);
    }) as EventListener;

    document.addEventListener('iconColorChange', handleColorChange);

    // Listen for dark mode changes
    const updateDarkMode = () => {
      setDarkMode(isDarkMode());
    };

    updateDarkMode(); // Initial check

    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.addEventListener('change', updateDarkMode);

    // Also listen for class changes on document element (Tailwind dark mode)
    const observer = new MutationObserver(updateDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      document.removeEventListener('iconColorChange', handleColorChange);
      darkModeQuery.removeEventListener('change', updateDarkMode);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // Filter icons based on search
    if (!searchValue) {
      setFilteredIcons(featherIcons);
      return;
    }

    const searchLower = searchValue.toLowerCase();
    const filtered = featherIcons.filter(
      (icon) =>
        icon.displayName.toLowerCase().includes(searchLower) ||
        icon.name.toLowerCase().includes(searchLower)
    );
    setFilteredIcons(filtered);
  }, [searchValue]);

  // Keyboard shortcut: Cmd+K (Mac) or Ctrl+K (Windows/Linux) to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      // Handle both lowercase 'k' and uppercase 'K'
      const isKKey = e.key === 'k' || e.key === 'K';
      const isModifierPressed = e.metaKey || e.ctrlKey;
      
      if (isModifierPressed && isKKey) {
        e.preventDefault();
        e.stopPropagation();
        // Focus the search input
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          // Select all text if there's any, so user can immediately start typing
          if (searchValue) {
            searchInputRef.current.select();
          }
        }
      }
    };

    // Use capture phase to catch the event early
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [searchValue]);

  const clearSearch = () => {
    setSearchValue('');
  };

  const handleFormatChange = (format: 'text' | 'png') => {
    setCopyFormat(format);
    localStorage.setItem('copyFormat', format);
    // Dispatch event so IconItems can update
    document.dispatchEvent(
      new CustomEvent('copyFormatChange', {
        detail: { format },
        bubbles: true,
      })
    );
  };

  const handleSizeChange = (size: number | 'custom') => {
    if (size === 'custom') {
      setShowCustomSize(true);
    } else {
      setShowCustomSize(false);
      setIconSize(size);
      setCustomSize('');
      localStorage.setItem('iconSize', size.toString());
      document.dispatchEvent(
        new CustomEvent('iconSizeChange', {
          detail: { size },
          bubbles: true,
        })
      );
    }
  };

  const handleCustomSizeChange = (value: string) => {
    setCustomSize(value);
    const size = parseInt(value, 10);
    if (!isNaN(size) && size > 0 && size <= 512) {
      setIconSize(size);
      localStorage.setItem('iconSize', size.toString());
      document.dispatchEvent(
        new CustomEvent('iconSizeChange', {
          detail: { size },
          bubbles: true,
        })
      );
    }
  };

  const handlePaddingChange = (padding: number) => {
    setIconPadding(padding);
    localStorage.setItem('iconPadding', padding.toString());
    document.dispatchEvent(
      new CustomEvent('iconPaddingChange', {
        detail: { padding },
        bubbles: true,
      })
    );
  };

  const handleBackgroundChange = (color: string) => {
    setBackgroundColor(color);
    localStorage.setItem('iconBackgroundColor', color);
    // Note: Complementary color generation is handled by ColorPicker component
  };

  const handleForegroundChange = (color: string) => {
    setForegroundColor(color);
    localStorage.setItem('iconColor', color);
    document.dispatchEvent(
      new CustomEvent('iconColorChange', {
        detail: { color },
        bubbles: true,
      })
    );
  };

  const handleSwapColors = () => {
    if (backgroundColor === 'transparent') {
      // Can't swap if background is transparent
      return;
    }
    const newBg = foregroundColor;
    const newFg = backgroundColor;
    setBackgroundColor(newBg);
    setForegroundColor(newFg);
    localStorage.setItem('iconBackgroundColor', newBg);
    localStorage.setItem('iconColor', newFg);
    document.dispatchEvent(
      new CustomEvent('iconColorChange', {
        detail: { color: newFg },
        bubbles: true,
      })
    );
  };

  // Get colors adjusted for dark mode
  const getDisplayColors = () => {
    if (darkMode) {
      return adjustColorsForDarkMode(backgroundColor, foregroundColor);
    }
    return { bg: backgroundColor, fg: foregroundColor };
  };

  const displayColors = getDisplayColors();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card">
          <h3 className="text-lg font-semibold">Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Icon Size */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Icon Size (px)</label>
              <div className="flex gap-2">
                <div className="flex flex-wrap gap-1 flex-1">
                  {DEFAULT_SIZES.map((size) => (
                    <Button
                      key={size}
                      variant={iconSize === size ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => handleSizeChange(size)}
                    >
                      {size}
                    </Button>
                  ))}
                  <Button
                    variant={showCustomSize ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => handleSizeChange('custom')}
                  >
                    Custom
                  </Button>
                </div>
              </div>
              {showCustomSize && (
                <Input
                  type="number"
                  min="1"
                  max="2048"
                  placeholder="Size (px)"
                  value={customSize}
                  onChange={(e) => handleCustomSizeChange(e.target.value)}
                  className="h-8 text-sm"
                />
              )}
            </div>

            {/* Colors */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Colors</label>
              <ColorPicker
                backgroundValue={backgroundColor}
                foregroundValue={foregroundColor}
                onBackgroundChange={handleBackgroundChange}
                onForegroundChange={handleForegroundChange}
                onSwap={handleSwapColors}
              />
            </div>

            {/* Copy Format */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Copy as</label>
              <Dropdown
                trigger={
                  <Button variant="outline" size="sm" className="w-full justify-between">
                    {copyFormat === 'text' ? 'SVG' : 'PNG'}
                    <svg
                      className="ml-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </Button>
                }
                align="left"
              >
                <DropdownItem
                  onClick={() => handleFormatChange('text')}
                  className={copyFormat === 'text' ? 'bg-accent' : ''}
                >
                  SVG
                </DropdownItem>
                <DropdownItem
                  onClick={() => handleFormatChange('png')}
                  className={copyFormat === 'png' ? 'bg-accent' : ''}
                >
                  PNG
                </DropdownItem>
              </Dropdown>
            </div>

            {/* Padding Settings */}
            <PaddingSettings
              iconColor={displayColors.fg}
              backgroundColor={displayColors.bg}
              value={iconPadding}
              onChange={handlePaddingChange}
            />
          </div>
        </div>

        <div className="sticky top-0 z-10 bg-background pb-4 pt-2 -mx-4 px-4">
          <div className="relative w-full">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
            <Input
              ref={searchInputRef}
              type="text"
              placeholder={`Search icons... (${shortcutKey})`}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full pl-10 pr-10"
            />
            {searchValue && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {filteredIcons.map((icon) => (
          <IconItem
            key={icon.name}
            IconComponent={icon.component}
            iconName={icon.name}
            displayName={icon.displayName}
            iconColor={displayColors.fg}
            backgroundColor={displayColors.bg}
            copyFormat={copyFormat}
            displaySize={DISPLAY_SIZE}
            copySize={iconSize}
            padding={iconPadding}
          />
        ))}
      </div>

      {filteredIcons.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No icons found matching "{searchValue}"
        </div>
      )}
    </div>
  );
}

