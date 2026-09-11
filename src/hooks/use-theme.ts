/**
 * O design "Clinical High-Contrast Dark" não tem variante clara — ver constants/theme.ts.
 * O app roda sempre no tema escuro, independente da preferência do sistema.
 */

import { Colors } from '@/constants/theme';

export function useTheme() {
  return Colors.dark;
}
