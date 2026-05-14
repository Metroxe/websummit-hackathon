import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        bg: colors.zinc[100],
        surface: '#FFFFFF',
        ink: colors.zinc[900],
        muted: colors.zinc[500],
        subtle: colors.zinc[400],
        line: colors.zinc[200],
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.03em',
        label: '0.12em',
      },
      borderRadius: {
        card: '24px',
      },
    },
  },
} satisfies Config;
