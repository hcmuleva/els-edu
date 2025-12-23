/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', "sans-serif"],
        heading: ['"Outfit"', "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        ".pt-safe": {
          paddingTop: "env(safe-area-inset-top)",
        },
        ".pb-safe": {
          paddingBottom: "env(safe-area-inset-bottom)",
        },
        ".pl-safe": {
          paddingLeft: "env(safe-area-inset-left)",
        },
        ".pr-safe": {
          paddingRight: "env(safe-area-inset-right)",
        },
        ".mt-safe": {
          marginTop: "env(safe-area-inset-top)",
        },
        ".mb-safe": {
          marginBottom: "env(safe-area-inset-bottom)",
        },
        ".ml-safe": {
          marginLeft: "env(safe-area-inset-left)",
        },
        ".mr-safe": {
          marginRight: "env(safe-area-inset-right)",
        },
        ".h-safe-screen": {
          height: "100vh" /* Fallback */,
          minHeight: "-webkit-fill-available",
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
