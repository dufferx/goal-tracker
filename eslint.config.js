import { baseConfig } from './packages/config/eslint/base.js';
import { reactConfig } from './packages/config/eslint/react.js';

export default [
  {
    ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**', 'supabase/.temp/**'],
  },
  ...baseConfig,
  ...reactConfig,
];
