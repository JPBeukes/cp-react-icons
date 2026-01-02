// Import all Feather icons from react-icons/fi
import * as FiIcons from 'react-icons/fi';
// Import all Phosphor icons from react-icons/pi
import * as PiIcons from 'react-icons/pi';
import type { IconType } from 'react-icons';

// Create icon metadata array
export interface IconMetadata {
  name: string;
  component: IconType;
  displayName: string;
  packId: string; // Add pack ID to ensure unique keys
}

// Icon pack metadata interface
export interface IconPackMetadata {
  id: string;
  name: string;
  prefix: string; // e.g., "Fi" for Feather, "Pi" for Phosphor
  icons: IconMetadata[];
}

// Helper function to create icon metadata from a pack
function createIconPack(
  id: string,
  name: string,
  prefix: string,
  iconModule: any
): IconPackMetadata {
  // Get all icon names from the icon module
  const iconNames = Object.keys(iconModule).filter(
    (key) => key.startsWith(prefix) && typeof iconModule[key] === 'function'
  );

  // Create metadata array
  const icons: IconMetadata[] = iconNames.map((iconName) => {
    const Component = iconModule[iconName];
    // Convert "FiActivity" to "Activity" for display, "PiActivity" to "Activity"
    const displayName = iconName.replace(new RegExp(`^${prefix}`), '');
    
    return {
      name: iconName,
      component: Component,
      displayName,
      packId: id,
    };
  });

  // Sort icons alphabetically by display name
  icons.sort((a, b) => a.displayName.localeCompare(b.displayName));

  return {
    id,
    name,
    prefix,
    icons,
  };
}

// Create icon packs
const featherPack = createIconPack('feather', 'Feather Icons', 'Fi', FiIcons);
const phosphorPack = createIconPack('phosphor', 'Phosphor Icons', 'Pi', PiIcons);

// Export icon packs as a record
export const iconPacks: Record<string, IconPackMetadata> = {
  feather: featherPack,
  phosphor: phosphorPack,
};

// Get all available pack IDs
export const availablePackIds = Object.keys(iconPacks);

// Helper function to get icons from selected packs
export function getIconsFromPacks(selectedPackIds: string[]): IconMetadata[] {
  const allIcons: IconMetadata[] = [];
  
  selectedPackIds.forEach((packId) => {
    const pack = iconPacks[packId];
    if (pack) {
      allIcons.push(...pack.icons);
    }
  });

  // Sort all icons alphabetically by display name
  allIcons.sort((a, b) => a.displayName.localeCompare(b.displayName));

  return allIcons;
}

// Legacy export for backward compatibility (deprecated, use iconPacks instead)
export const featherIcons = featherPack.icons;

// Export total icon count for reference
export const iconCount = Object.values(iconPacks).reduce(
  (total, pack) => total + pack.icons.length,
  0
);

