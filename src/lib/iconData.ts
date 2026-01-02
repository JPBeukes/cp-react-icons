// Import all Feather icons from react-icons/fi
import * as FiIcons from 'react-icons/fi';
import type { IconType } from 'react-icons';

// Create icon metadata array
export interface IconMetadata {
  name: string;
  component: IconType;
  displayName: string;
}

// Get all icon names from the FiIcons object
const iconNames = Object.keys(FiIcons).filter(
  (key) => key.startsWith('Fi') && typeof (FiIcons as any)[key] === 'function'
);

// Create metadata array
export const featherIcons: IconMetadata[] = iconNames.map((iconName) => {
  const Component = (FiIcons as any)[iconName];
  // Convert "FiActivity" to "Activity" for display
  const displayName = iconName.replace(/^Fi/, '');
  
  return {
    name: iconName,
    component: Component,
    displayName,
  };
});

// Sort icons alphabetically by display name
featherIcons.sort((a, b) => a.displayName.localeCompare(b.displayName));

// Export icon count for reference
export const iconCount = featherIcons.length;

