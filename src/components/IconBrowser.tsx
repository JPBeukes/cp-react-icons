import { useState, useEffect, useRef } from 'react';
import IconItem from './IconItem';
import { getIconsFromPacks, availablePackIds, type IconMetadata } from '@/lib/iconData';
import { Input } from './ui/input';
import ColorPicker from './ColorPicker';
import { Dropdown, DropdownItem } from './ui/dropdown';
import { Button } from './ui/button';
import PaddingSettings from './PaddingSettings';
import CornerRadiusSettings from './CornerRadiusSettings';
import IconSizeSettings from './IconSizeSettings';
import IconPackSelectorSidebar from './IconPackSelectorSidebar';
import { Pagination } from './ui/pagination';
import IconPreview from './IconPreview';
import CollapsibleSection from './CollapsibleSection';
import { generateComplementaryColor, isDarkMode, adjustColorsForDarkMode } from '@/lib/iconUtils';
import { trackEvent } from '@/lib/posthog';

interface IconBrowserProps {
  initialColor?: string;
}

const DISPLAY_SIZE = 32; // Fixed size for gallery display

const DEFAULT_COLOR = '#64748b'; // rgb(100, 116, 139)
const DEFAULT_PADDING = 0.10; // 10% padding (Medium preset)
const DEFAULT_CORNER_RADIUS = 0; // 0% corner radius (None preset)
const DEFAULT_ICON_SIZE = 20; // Default icon size (matches IconSizeSettings default)
const ITEMS_PER_PAGE = 80; // Number of icons per page

export default function IconBrowser({ initialColor = DEFAULT_COLOR }: IconBrowserProps) {
  const [searchValue, setSearchValue] = useState('');
  const [backgroundColor, setBackgroundColor] = useState<string>('transparent');
  const [foregroundColor, setForegroundColor] = useState(initialColor);
  const [copyFormat, setCopyFormat] = useState<'text' | 'png'>('text');
  const [iconSize, setIconSize] = useState<number>(DEFAULT_ICON_SIZE);
  const [iconPadding, setIconPadding] = useState<number>(DEFAULT_PADDING);
  const [cornerRadius, setCornerRadius] = useState<number>(DEFAULT_CORNER_RADIUS);
  const [filteredIcons, setFilteredIcons] = useState<IconMetadata[]>([]);
  const [selectedPacks, setSelectedPacks] = useState<string[]>(availablePackIds);
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Detect platform for keyboard shortcut display
  const [shortcutKey, setShortcutKey] = useState('⌘K');
  
  useEffect(() => {
    // Better platform detection
    const isMac = navigator.platform.toUpperCase().includes('MAC') || 
                  navigator.userAgent.toUpperCase().includes('MAC');
    setShortcutKey(isMac ? '⌘K' : 'Ctrl+K');
  }, []);

  // Detect mobile and handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      if (mobile) {
        // On mobile, sidebar is hidden by default
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
      }
    } else {
      // Set default if no saved size
      setIconSize(DEFAULT_ICON_SIZE);
      localStorage.setItem('iconSize', DEFAULT_ICON_SIZE.toString());
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

  // Track page load/initialization
  useEffect(() => {
    // Small delay to ensure PostHog is loaded
    const timer = setTimeout(() => {
      trackEvent('icon_browser_loaded', {
        selected_packs_count: selectedPacks.length,
        total_icons: filteredIcons.length,
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []); // Only run once on mount

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

  // Track search with debouncing
  useEffect(() => {
    if (!searchValue) return;

    const debounceTimer = setTimeout(() => {
      trackEvent('icon_searched', {
        search_term: searchValue,
        results_count: filteredIcons.length,
        selected_packs_count: selectedPacks.length,
      });
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchValue, filteredIcons.length, selectedPacks.length]);

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
        
        // Track keyboard shortcut usage
        const shortcut = e.metaKey ? 'cmd+k' : 'ctrl+k';
        trackEvent('keyboard_shortcut_used', {
          shortcut,
        });
        
        // If sidebar is collapsed on desktop, expand it first
        if (sidebarCollapsed && !isMobile) {
          setSidebarCollapsed(false);
          // Small delay to ensure sidebar is expanded before focusing
          setTimeout(() => {
            if (searchInputRef.current) {
              searchInputRef.current.focus();
              if (searchValue) {
                searchInputRef.current.select();
              }
            }
          }, 100);
        } else {
          // Focus the search input
          if (searchInputRef.current) {
            searchInputRef.current.focus();
            // Select all text if there's any, so user can immediately start typing
            if (searchValue) {
              searchInputRef.current.select();
            }
          }
        }
      }
    };

    // Use capture phase to catch the event early
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [searchValue, sidebarCollapsed, isMobile]);

  const clearSearch = () => {
    trackEvent('search_cleared');
    setSearchValue('');
  };

  const handleFormatChange = (format: 'text' | 'png') => {
    setCopyFormat(format);
    localStorage.setItem('copyFormat', format);
    
    // Track copy format change
    trackEvent('copy_format_changed', {
      format: format === 'png' ? 'png' : 'svg',
    });
    
    // Dispatch event so IconItems can update
    document.dispatchEvent(
      new CustomEvent('copyFormatChange', {
        detail: { format },
        bubbles: true,
      })
    );
  };

  const handleSizeChange = (size: number) => {
    setIconSize(size);
    localStorage.setItem('iconSize', size.toString());
    
    // Track icon size change
    trackEvent('icon_size_changed', {
      size,
    });
    
    document.dispatchEvent(
      new CustomEvent('iconSizeChange', {
        detail: { size },
        bubbles: true,
      })
    );
  };

  const handlePaddingChange = (padding: number) => {
    setIconPadding(padding);
    localStorage.setItem('iconPadding', padding.toString());
    
    // Track padding change
    trackEvent('padding_changed', {
      padding,
    });
    
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
    
    // Track corner radius change
    trackEvent('corner_radius_changed', {
      radius,
    });
    
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
    
    // Track background color change
    trackEvent('color_changed', {
      type: 'background',
      color,
    });
    
    // Note: Complementary color generation is handled by ColorPicker component
  };

  const handleForegroundChange = (color: string) => {
    setForegroundColor(color);
    localStorage.setItem('iconColor', color);
    
    // Track foreground color change
    trackEvent('color_changed', {
      type: 'foreground',
      color,
    });
    
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
    
    // Track icon pack selection change
    trackEvent('icon_pack_selected', {
      selected_packs: packs,
      pack_count: packs.length,
    });
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
    
    // Track color swap
    trackEvent('colors_swapped');
    
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

  const toggleSidebar = () => {
    if (isMobile) {
      const newState = !mobileMenuOpen;
      setMobileMenuOpen(newState);
      
      // Track mobile menu toggle
      trackEvent('mobile_menu_toggled', {
        state: newState ? 'opened' : 'closed',
      });
    } else {
      const newState = !sidebarCollapsed;
      setSidebarCollapsed(newState);
      
      // Track sidebar toggle
      trackEvent('sidebar_toggled', {
        state: newState ? 'closed' : 'opened',
      });
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    
    // Track page change
    trackEvent('page_changed', {
      page_number: page,
      total_pages: totalPages,
    });
  };

  const handleSearchIconClick = () => {
    // If sidebar is collapsed on desktop, expand it and focus search
    if (sidebarCollapsed && !isMobile) {
      setSidebarCollapsed(false);
      // Small delay to ensure sidebar is expanded before focusing
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  };

  // Determine sidebar visibility
  const sidebarVisible = isMobile ? mobileMenuOpen : !sidebarCollapsed;
  // On desktop, when collapsed, use a narrow width that fits just the toggle button
  // w-16 (64px) is perfect for icon-only buttons
  const sidebarWidth = sidebarCollapsed && !isMobile ? 'w-16' : 'w-80';

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${sidebarWidth}
          ${isMobile ? 'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out' : 'relative'}
          ${isMobile && !mobileMenuOpen ? '-translate-x-full' : ''}
          border-r border-border bg-background flex flex-col overflow-hidden
          ${isMobile ? 'w-80' : ''}
        `}
      >
        {/* Title and Search - Always visible when expanded, only toggle button when collapsed */}
        <div className={`border-b border-border ${sidebarCollapsed && !isMobile ? 'p-2' : 'p-4'}`}>
          {sidebarCollapsed && !isMobile ? (
            // Collapsed: Show only toggle button
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="h-8 w-8 p-0 flex-shrink-0"
              aria-label="Expand sidebar"
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
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </Button>
          ) : (
            // Expanded: Show toggle button, title, and search
            <>
              <div className="flex items-center gap-2 mb-4">
                {/* Toggle Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="h-8 w-8 p-0 flex-shrink-0"
                  aria-label={isMobile ? (mobileMenuOpen ? 'Close menu' : 'Open menu') : 'Collapse sidebar'}
                >
                  {isMobile ? (
                    // Mobile: show X when open, hamburger when closed
                    mobileMenuOpen ? (
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
                    ) : (
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
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                      </svg>
                    )
                  ) : (
                    // Desktop: show chevron left when expanded
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
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  )}
                </Button>
                {/* Title */}
                <h1 className="text-2xl font-bold">Icon Clipboard</h1>
              </div>
              
              {/* Search Input */}
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
            </>
          )}
        </div>

        {/* Scrollable sidebar content - Hidden when collapsed on desktop */}
        {(!sidebarCollapsed || isMobile) && (
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
                <IconSizeSettings
                  value={iconSize}
                  onChange={handleSizeChange}
                />

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

            {/* Preview Section - Hidden but kept for potential reuse */}
            {/* <CollapsibleSection title="Preview" defaultOpen={true}>
              <IconPreview
                iconColor={displayColors.fg}
                backgroundColor={displayColors.bg}
                padding={iconPadding}
                cornerRadius={cornerRadius}
              />
            </CollapsibleSection> */}
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-muted/30">
        {/* Mobile Menu Button - Only visible on mobile when menu is closed */}
        {isMobile && !mobileMenuOpen && (
          <div className="fixed top-4 left-4 z-30">
            <Button
              variant="default"
              size="sm"
              onClick={toggleSidebar}
              className="h-10 w-10 p-0 shadow-lg"
              aria-label="Open menu"
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
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </Button>
          </div>
        )}
        
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {paginatedIcons.map((icon) => (
              <IconItem
                key={`${icon.packId}-${icon.name}`}
                IconComponent={icon.component}
                iconName={icon.name}
                displayName={icon.displayName}
                packId={icon.packId}
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
                onPageChange={handlePageChange}
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

