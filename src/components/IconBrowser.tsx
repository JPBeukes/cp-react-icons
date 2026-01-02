import { useState, useEffect, useRef } from 'react';
import IconItem from './IconItem';
import { getIconsFromPacks, availablePackIds, type IconMetadata } from '@/lib/iconData';
import { Input } from './ui/input';
import ColorPicker from './ColorPicker';
import { Dropdown, DropdownItem } from './ui/dropdown';
import { Button } from './ui/button';
import PaddingSettings from './PaddingSettings';
import CornerRadiusSettings from './CornerRadiusSettings';
import IconPackSelectorSidebar from './IconPackSelectorSidebar';
import { Pagination } from './ui/pagination';
import IconPreview from './IconPreview';
import CollapsibleSection from './CollapsibleSection';
import { generateComplementaryColor, isDarkMode, adjustColorsForDarkMode } from '@/lib/iconUtils';

interface IconBrowserProps {
  initialColor?: string;
}

const DEFAULT_SIZES = [64, 128, 512, 1024];
const DISPLAY_SIZE = 32; // Fixed size for gallery display

const DEFAULT_COLOR = '#64748b'; // rgb(100, 116, 139)
const DEFAULT_PADDING = 0.10; // 10% padding (Medium preset)
const DEFAULT_CORNER_RADIUS = 0; // 0% corner radius (None preset)
const ITEMS_PER_PAGE = 80; // Number of icons per page

export default function IconBrowser({ initialColor = DEFAULT_COLOR }: IconBrowserProps) {
  const [searchValue, setSearchValue] = useState('');
  const [backgroundColor, setBackgroundColor] = useState<string>('transparent');
  const [foregroundColor, setForegroundColor] = useState(initialColor);
  const [copyFormat, setCopyFormat] = useState<'text' | 'png'>('text');
  const [iconSize, setIconSize] = useState<number>(64);
  const [customSize, setCustomSize] = useState<string>('');
  const [showCustomSize, setShowCustomSize] = useState(false);
  const [iconPadding, setIconPadding] = useState<number>(DEFAULT_PADDING);
  const [cornerRadius, setCornerRadius] = useState<number>(DEFAULT_CORNER_RADIUS);
  const [filteredIcons, setFilteredIcons] = useState<IconMetadata[]>([]);
  const [selectedPacks, setSelectedPacks] = useState<string[]>(availablePackIds);
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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

    // Load saved corner radius
    const savedCornerRadius = localStorage.getItem('iconCornerRadius');
    if (savedCornerRadius) {
      const radius = parseFloat(savedCornerRadius);
      if (!isNaN(radius) && radius >= 0 && radius <= 50) {
        setCornerRadius(radius);
      }
    }

    // Load saved icon pack selection
    const savedPacks = localStorage.getItem('selectedIconPacks');
    let initialSelectedPacks = availablePackIds;
    if (savedPacks) {
      try {
        const parsedPacks = JSON.parse(savedPacks);
        // Validate that all saved packs are still available
        const validPacks = parsedPacks.filter((packId: string) =>
          availablePackIds.includes(packId)
        );
        if (validPacks.length > 0) {
          initialSelectedPacks = validPacks;
          setSelectedPacks(validPacks);
        }
      } catch (e) {
        console.warn('Failed to parse saved icon packs:', e);
      }
    }

    // Initialize icons based on selected packs
    const initialIcons = getIconsFromPacks(initialSelectedPacks);
    if (initialIcons && initialIcons.length > 0) {
      setFilteredIcons(initialIcons);
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

  // Update icons when selected packs change
  useEffect(() => {
    const icons = getIconsFromPacks(selectedPacks);
    
    // Apply search filter if there's a search value
    if (searchValue) {
      const searchLower = searchValue.toLowerCase();
      const filtered = icons.filter(
        (icon) =>
          icon.displayName.toLowerCase().includes(searchLower) ||
          icon.name.toLowerCase().includes(searchLower)
      );
      setFilteredIcons(filtered);
    } else {
      setFilteredIcons(icons);
    }
    
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [selectedPacks, searchValue]);

  // Ensure current page is valid when filtered icons change
  useEffect(() => {
    const totalPages = Math.ceil(filteredIcons.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredIcons.length, currentPage]);

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

  const handleCornerRadiusChange = (radius: number) => {
    setCornerRadius(radius);
    localStorage.setItem('iconCornerRadius', radius.toString());
    document.dispatchEvent(
      new CustomEvent('iconCornerRadiusChange', {
        detail: { radius },
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

  const handlePackSelectionChange = (packs: string[]) => {
    setSelectedPacks(packs);
    localStorage.setItem('selectedIconPacks', JSON.stringify(packs));
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

  // Calculate pagination
  const totalPages = Math.ceil(filteredIcons.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedIcons = filteredIcons.slice(startIndex, endIndex);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 border-r border-border bg-background flex flex-col overflow-hidden">
        {/* Title and Search - Always visible */}
        <div className="p-4 border-b border-border">
          <h1 className="text-2xl font-bold mb-4">Icon Clipboard</h1>
          <div className="relative">
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

        {/* Scrollable sidebar content */}
        <div className="flex-1 overflow-y-auto">
          {/* Icon Packs Section */}
          <CollapsibleSection title="Icon Packs" defaultOpen={true}>
            <IconPackSelectorSidebar
              selectedPacks={selectedPacks}
              onSelectionChange={handlePackSelectionChange}
            />
          </CollapsibleSection>

          {/* Settings Section */}
          <CollapsibleSection title="Settings" defaultOpen={true}>
            <div className="flex flex-col gap-4">
              {/* Colors */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-center">
                  <ColorPicker
                    backgroundValue={backgroundColor}
                    foregroundValue={foregroundColor}
                    onBackgroundChange={handleBackgroundChange}
                    onForegroundChange={handleForegroundChange}
                    onSwap={handleSwapColors}
                  />
                </div>
              </div>

              {/* Icon Size */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground">Icon Size (px)</label>
                <div className="flex flex-wrap gap-1">
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

              {/* Copy Format */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground">Copy as</label>
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
                value={iconPadding}
                onChange={handlePaddingChange}
              />

              {/* Corner Radius Settings */}
              <CornerRadiusSettings
                value={cornerRadius}
                onChange={handleCornerRadiusChange}
              />
            </div>
          </CollapsibleSection>

          {/* Preview Section */}
          <CollapsibleSection title="Preview" defaultOpen={true}>
            <IconPreview
              iconColor={displayColors.fg}
              backgroundColor={displayColors.bg}
              padding={iconPadding}
              cornerRadius={cornerRadius}
            />
          </CollapsibleSection>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-muted/30">
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {paginatedIcons.map((icon) => (
              <IconItem
                key={`${icon.packId}-${icon.name}`}
                IconComponent={icon.component}
                iconName={icon.name}
                displayName={icon.displayName}
                iconColor={displayColors.fg}
                backgroundColor={displayColors.bg}
                copyFormat={copyFormat}
                displaySize={DISPLAY_SIZE}
                copySize={iconSize}
                padding={iconPadding}
                cornerRadius={cornerRadius}
              />
            ))}
          </div>

          {filteredIcons.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No icons found matching "{searchValue}"
            </div>
          )}

          {filteredIcons.length > 0 && totalPages > 1 && (
            <div className="mt-8 flex flex-col items-center gap-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredIcons.length)} of {filteredIcons.length} icons
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

