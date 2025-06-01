/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',  // blue-500
        success: '#10b981',  // emerald-500
        error: '#ef4444',    // red-500
      },
    },
  },
}