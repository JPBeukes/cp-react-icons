import { useState, useEffect } from 'react';
import IconItem from './IconItem';
import { featherIcons } from '@/lib/iconData';
import { Input } from './ui/input';
import ColorPicker from './ColorPicker';
import { Dropdown, DropdownItem } from './ui/dropdown';
import { Button } from './ui/button';

interface IconBrowserProps {
  initialColor?: string;
}

const DEFAULT_SIZES = [64, 128, 512, 1024];
const DISPLAY_SIZE = 64; // Fixed size for gallery display

const DEFAULT_COLOR = '#64748b'; // rgb(100, 116, 139)

export default function IconBrowser({ initialColor = DEFAULT_COLOR }: IconBrowserProps) {
  const [searchValue, setSearchValue] = useState('');
  const [iconColor, setIconColor] = useState(initialColor);
  const [copyFormat, setCopyFormat] = useState<'text' | 'png'>('text');
  const [iconSize, setIconSize] = useState<number>(64);
  const [customSize, setCustomSize] = useState<string>('');
  const [showCustomSize, setShowCustomSize] = useState(false);
  const [filteredIcons, setFilteredIcons] = useState<typeof featherIcons>([]);

  useEffect(() => {
    // Load saved color, or use default if none saved
    const savedColor = localStorage.getItem('iconColor');
    if (savedColor) {
      setIconColor(savedColor);
    } else {
      setIconColor(DEFAULT_COLOR);
      localStorage.setItem('iconColor', DEFAULT_COLOR);
    }

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

    // Initialize icons
    if (featherIcons && featherIcons.length > 0) {
      setFilteredIcons(featherIcons);
    } else {
      console.warn('No icons loaded');
    }

    // Listen for color changes (for potential future external components)
    const handleColorChange = ((e: CustomEvent) => {
      setIconColor(e.detail.color);
    }) as EventListener;

    document.addEventListener('iconColorChange', handleColorChange);

    return () => {
      document.removeEventListener('iconColorChange', handleColorChange);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card">
          <h3 className="text-lg font-semibold">Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Icon Color */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Icon Color</label>
              <ColorPicker
                value={iconColor}
                onChange={(newColor) => {
                  setIconColor(newColor);
                  localStorage.setItem('iconColor', newColor);
                  document.dispatchEvent(
                    new CustomEvent('iconColorChange', {
                      detail: { color: newColor },
                      bubbles: true,
                    })
                  );
                }}
              />
            </div>

            {/* Copy Format */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Copy as</label>
              <Dropdown
                trigger={
                  <Button variant="outline" size="sm" className="w-full justify-between">
                    {copyFormat === 'text' ? 'SVG Text' : 'PNG'}
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
                  SVG Text
                </DropdownItem>
                <DropdownItem
                  onClick={() => handleFormatChange('png')}
                  className={copyFormat === 'png' ? 'bg-accent' : ''}
                >
                  PNG
                </DropdownItem>
              </Dropdown>
            </div>
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
              type="text"
              placeholder="Search icons..."
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
            iconColor={iconColor}
            copyFormat={copyFormat}
            displaySize={DISPLAY_SIZE}
            copySize={iconSize}
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

