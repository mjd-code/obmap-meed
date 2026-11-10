import React from 'react';
import { SettingsHub } from '@/domains/settings/components/SettingsHub';
export { SettingsCommandPalette as CommandPalette } from '@/domains/settings/components/SettingsCommandPalette';
export { useThemeStore } from '@/domains/settings/shared/stores/useThemeStore';
export { useSchemaStore } from '@/domains/settings/shared/stores/useSchemaStore';

/**
 * SettingsOrchestrator: Entry point tunggal pengaturan preferensi, vault, dan skema
 */
export const SettingsOrchestrator: React.FC = () => {
  return <SettingsHub />;
};

export default SettingsOrchestrator;
