import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20260712_045413_add_help_center_cms from './20260712_045413_add_help_center_cms';

export const migrations = [
  {
    up: migration_20250929_111647.up,
    down: migration_20250929_111647.down,
    name: '20250929_111647',
  },
  {
    up: migration_20260712_045413_add_help_center_cms.up,
    down: migration_20260712_045413_add_help_center_cms.down,
    name: '20260712_045413_add_help_center_cms'
  },
];
