import { Dropdown, DropdownItem } from './ui/dropdown';
import { Button } from './ui/button';
import { iconPacks, availablePackIds } from '@/lib/iconData';

interface IconPackSelectorProps {
  selectedPacks: string[];
  onSelectionChange: (selectedPacks: string[]) => void;
}

export default function IconPackSelector({
  selectedPacks,
  onSelectionChange,
}: IconPackSelectorProps) {
  const handleTogglePack = (packId: string) => {
    const newSelection = selectedPacks.includes(packId)
      ? selectedPacks.filter((id) => id !== packId)
      : [...selectedPacks, packId];
    
    // Ensure at least one pack is selected
    if (newSelection.length === 0) {
      return;
    }
    
    onSelectionChange(newSelection);
  };

  const selectedCount = selectedPacks.length;
  const totalCount = availablePackIds.length;

  return (
    <Dropdown
      trigger={
        <Button variant="outline" size="sm" className="whitespace-nowrap">
          <span className="mr-2">Icon Packs</span>
          {selectedCount < totalCount && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded">
              {selectedCount}
            </span>
          )}
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
      align="right"
    >
      <div className="max-h-[300px] overflow-y-auto">
        {availablePackIds.map((packId) => {
          const pack = iconPacks[packId];
          const isSelected = selectedPacks.includes(packId);
          
          return (
            <DropdownItem
              key={packId}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleTogglePack(packId);
              }}
              className="flex items-center gap-2 px-3 py-2"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleTogglePack(packId)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm font-medium">{pack.name}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {pack.icons.length} icons
                </span>
              </div>
            </DropdownItem>
          );
        })}
      </div>
    </Dropdown>
  );
}

