/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // permukaan
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          muted: 'var(--surface-muted)',
        },
        line: 'var(--border)',

        // teks
        ink: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
          subtle: 'var(--text-subtle)',
        },

        // navigasi gelap
        nav: {
          DEFAULT: 'var(--nav)',
          active: 'var(--nav-active)',
          text: 'var(--nav-text)',
          subtle: 'var(--nav-subtle)',
          on: 'var(--nav-text-on)',
        },

        accent: 'var(--accent)',

        // status
        st: {
          'abu-bg': 'var(--st-abu-bg)',
          'abu-br': 'var(--st-abu-br)',
          'abu-fg': 'var(--st-abu-fg)',
          'amber-bg': 'var(--st-amber-bg)',
          'amber-br': 'var(--st-amber-br)',
          'amber-fg': 'var(--st-amber-fg)',
          'hijau-bg': 'var(--st-hijau-bg)',
          'hijau-br': 'var(--st-hijau-br)',
          'hijau-fg': 'var(--st-hijau-fg)',
          'merah-bg': 'var(--st-merah-bg)',
          'merah-br': 'var(--st-merah-br)',
          'merah-fg': 'var(--st-merah-fg)',
        },
      },

      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
      },

      // skala dari Figma — dipakai apa adanya, jangan dibulatkan
      fontSize: {
        badge: ['9px', '1.2'],
        note: ['10px', '1.4'],
        label: ['11px', '1.3'],
        sm: ['12px', '1.4'],
        base: ['13px', '1.5'],
        card: ['14px', '1.4'],
        page: ['18px', '1.3'],
      },

      borderRadius: {
        card: '10px',
        control: '6px',
        pill: '11px',
      },

      boxShadow: {
        card: '0 1px 3px 0 rgba(36, 26, 18, 0.05)',
        pop: '0 8px 24px -4px rgba(36, 26, 18, 0.12), 0 2px 6px -2px rgba(36, 26, 18, 0.08)',
      },

      spacing: {
        sidebar: '240px',
        'sidebar-mini': '72px',
        topbar: '64px',
      },

      maxWidth: {
        konten: '1600px',
      },

      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pop-in': {
          from: { opacity: '0', transform: 'scale(.97) translateY(-4px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'pop-in': 'pop-in 150ms ease-out',
      },
    },
  },
  plugins: [],
};
