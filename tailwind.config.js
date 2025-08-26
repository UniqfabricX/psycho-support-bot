/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: '#229ED9',
        mint: '#B8E7E1',
        'bg-base': '#F7FAFC',
        'bg-alt': '#FFFFFF',
        'bg-warm': '#F4EDE4',
        text: '#111827',
        muted: '#4B5563',
      },
      borderRadius: {
        '12': '12px',
        '16': '16px',
        '20': '20px',
      },
      boxShadow: {
        'sm': '0 6px 18px rgba(31, 41, 55, 0.06)',
        'md': '0 10px 30px rgba(31, 41, 55, 0.10)',
      },
    },
  },
  plugins: [],
}
