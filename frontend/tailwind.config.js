export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Manrope", "sans-serif"],
      },
      colors: {
        paper: "var(--paper)",
        sidebar: "var(--sidebar)",
        surface: "var(--surface)",
        "surface-alt": "var(--surface-alt)",
        line: "var(--line)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        body: "var(--body)",
        sage: { DEFAULT: "#788A72", deep: "#53664E", pale: "#E8EDE4" },
        clay: "#C98568",
      },
      boxShadow: { paper: "0 12px 36px rgba(42, 48, 39, .06)" },
    },
  },
  plugins: [],
};
