import { useState, useEffect, useRef } from 'react';
import { FiSettings } from 'react-icons/fi';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Dropdown, DropdownItem } from './ui/dropdown';
import { Slider } from './ui/slider';

interface IconSizeSettingsProps {
  value: number;
  onChange: (size: number) => void;
}

interface SizeConfig {
  min: number;
  max: number;
  step: number;
  defaultOptions: number[];
}

const DEFAULT_CONFIG: SizeConfig = {
  min: 20,
  max: 100,
  step: 10,
  defaultOptions: [128, 512, 1024],
};

export default function IconSizeSettings({ value, onChange }: IconSizeSettingsProps) {
  const [config, setConfig] = useState<SizeConfig>(DEFAULT_CONFIG);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SizeConfig>(DEFAULT_CONFIG);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Load config from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('iconSizeConfig');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
        setEditingConfig(parsed);
      } catch (e) {
        console.warn('Failed to parse saved icon size config:', e);
      }
    }
  }, []);

  // Clamp value to config range when config changes
  useEffect(() => {
    if (value < config.min || value > config.max) {
      const clampedValue = Math.max(config.min, Math.min(config.max, value));
      onChange(clampedValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.min, config.max]); // Only re-run when config changes, not value

  // Handle slider change
  const handleSliderChange = (values: number[]) => {
    onChange(values[0]);
  };

  // Handle number input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      return;
    }
    const numValue = parseInt(inputValue, 10);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(config.min, Math.min(config.max, numValue));
      onChange(clampedValue);
    }
  };

  // Handle context menu (right-click)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowContextMenu(true);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowContextMenu(false);
        setShowConfigDialog(false);
      }
    };

    if (showContextMenu || showConfigDialog) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showContextMenu, showConfigDialog]);

  // Handle default option click
  const handleDefaultOptionClick = (size: number) => {
    onChange(size);
  };

  // Handle config save
  const handleConfigSave = () => {
    setConfig(editingConfig);
    localStorage.setItem('iconSizeConfig', JSON.stringify(editingConfig));
    setShowConfigDialog(false);
    setShowContextMenu(false);
    
    // Clamp current value to new range
    const clampedValue = Math.max(editingConfig.min, Math.min(editingConfig.max, value));
    onChange(clampedValue);
  };

  // Handle config reset
  const handleConfigReset = () => {
    setEditingConfig(DEFAULT_CONFIG);
    setConfig(DEFAULT_CONFIG);
    localStorage.removeItem('iconSizeConfig');
    setShowConfigDialog(false);
    setShowContextMenu(false);
    
    // Clamp current value to default range
    const clampedValue = Math.max(DEFAULT_CONFIG.min, Math.min(DEFAULT_CONFIG.max, value));
    onChange(clampedValue);
  };

  return (
    <div className="flex flex-col gap-2 relative" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs text-muted-foreground">Icon Size (px)</label>
        <button
          type="button"
          onClick={() => setShowContextMenu(!showContextMenu)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          title="Click for options"
        >
          <FiSettings className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Slider */}
      <div onContextMenu={handleContextMenu}>
        <Slider
          min={config.min}
          max={config.max}
          step={config.step}
          value={[value]}
          onValueChange={handleSliderChange}
          className="w-full"
        />
      </div>

      {/* Number Input */}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={config.min}
          max={config.max}
          step={config.step}
          value={value}
          onChange={handleInputChange}
          className="h-8 text-sm flex-1"
        />
        <span className="text-xs text-muted-foreground">px</span>
      </div>

      {/* Default Options */}
      {config.defaultOptions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {config.defaultOptions.map((size) => (
            <Button
              key={size}
              variant={value === size ? 'default' : 'outline'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleDefaultOptionClick(size)}
            >
              {size}
            </Button>
          ))}
        </div>
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg min-w-[240px] py-1"
          style={{
            top: containerRef.current
              ? containerRef.current.getBoundingClientRect().bottom + 4
              : 0,
            left: containerRef.current
              ? containerRef.current.getBoundingClientRect().left
              : 0,
          }}
        >
          <DropdownItem onClick={() => {
            setShowConfigDialog(true);
            setShowContextMenu(false);
          }}>
            Configure Settings...
          </DropdownItem>
          <DropdownItem onClick={handleConfigReset}>
            Reset to Defaults
          </DropdownItem>
        </div>
      )}

      {/* Config Dialog */}
      {showConfigDialog && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg p-4 min-w-[280px]"
          style={{
            top: containerRef.current
              ? containerRef.current.getBoundingClientRect().bottom + 4
              : 0,
            left: containerRef.current
              ? containerRef.current.getBoundingClientRect().left
              : 0,
          }}
        >
          <h3 className="text-sm font-semibold mb-3">Icon Size Settings</h3>
          
          <div className="flex flex-col gap-3">
            {/* Min Value */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Min Value (px)</label>
              <Input
                type="number"
                min="1"
                max="1000"
                value={editingConfig.min}
                onChange={(e) => {
                  const min = parseInt(e.target.value, 10);
                  if (!isNaN(min) && min > 0 && min < editingConfig.max) {
                    setEditingConfig({ ...editingConfig, min });
                  }
                }}
                className="h-8 text-sm"
              />
            </div>

            {/* Max Value */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Max Value (px)</label>
              <Input
                type="number"
                min="1"
                max="10000"
                value={editingConfig.max}
                onChange={(e) => {
                  const max = parseInt(e.target.value, 10);
                  if (!isNaN(max) && max > editingConfig.min) {
                    setEditingConfig({ ...editingConfig, max });
                  }
                }}
                className="h-8 text-sm"
              />
            </div>

            {/* Step/Increment */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Step/Increment (px)</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={editingConfig.step}
                onChange={(e) => {
                  const step = parseInt(e.target.value, 10);
                  if (!isNaN(step) && step > 0) {
                    setEditingConfig({ ...editingConfig, step });
                  }
                }}
                className="h-8 text-sm"
              />
            </div>

            {/* Default Options */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">
                Default Options (comma-separated, px)
              </label>
              <Input
                type="text"
                value={editingConfig.defaultOptions.join(', ')}
                onChange={(e) => {
                  const options = e.target.value
                    .split(',')
                    .map((s) => parseInt(s.trim(), 10))
                    .filter((n) => !isNaN(n) && n > 0);
                  setEditingConfig({ ...editingConfig, defaultOptions: options });
                }}
                placeholder="128, 512, 1024"
                className="h-8 text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setShowConfigDialog(false);
                  setEditingConfig(config);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={handleConfigSave}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

