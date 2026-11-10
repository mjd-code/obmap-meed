import React from 'react';
import { SettingsHub } from './components/SettingsHub';
export { SettingsCommandPalette as CommandPalette } from './components/SettingsCommandPalette';
export { useThemeStore } from './shared/stores/useThemeStore';
export { useSchemaStore } from './shared/stores/useSchemaStore';

/**
 * SettingsOrchestrator: Entry point tunggal pengaturan preferensi, vault, dan skema
 */
export const SettingsOrchestrator: React.FC = () => {
  return <SettingsHub />;
};

export default SettingsOrchestrator;
