// vite.config.ts
import { defineConfig } from "file:///app/code/client/node_modules/vite/dist/node/index.js";
import react from "file:///app/code/client/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "/app/code/client";
var vite_config_default = defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./")
    }
  },
  server: {
    port: 5173,
    host: true,
    hmr: {
      clientPort: 5173
    },
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        timeout: 6e4,
        secure: false,
        ws: true
      }
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        dead_code: true,
        pure_getters: true,
        unsafe: true,
        passes: 3
      },
      mangle: {
        safari10: true
      }
    },
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          query: ["@tanstack/react-query"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select"
          ],
          charts: ["recharts"],
          utils: ["xlsx", "jspdf", "jspdf-autotable", "html2canvas", "dompurify"],
          "print-utils": ["./utils/printUtils"]
        }
      }
    },
    chunkSizeWarningLimit: 1500
  },
  define: {
    // Ensure production environment variables are properly set
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
    // Completely disable authDisabler in production builds
    "__DISABLE_AUTH_DISABLER__": JSON.stringify(true),
    // Disable all development features
    "__DEV__": JSON.stringify(false),
    "import.meta.hot": JSON.stringify(false),
    // Force production environment
    "import.meta.env.DEV": JSON.stringify(mode !== "production"),
    "import.meta.env.PROD": JSON.stringify(mode === "production"),
    // Disable HMR in production
    "import.meta.hot": mode === "production" ? "undefined" : "import.meta.hot"
  },
  // Production-specific configuration
  ...mode === "production" && {
    esbuild: {
      drop: ["console", "debugger"],
      legalComments: "none"
    },
    optimizeDeps: {
      disabled: false
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvYXBwL2NvZGUvY2xpZW50XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvYXBwL2NvZGUvY2xpZW50L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9hcHAvY29kZS9jbGllbnQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL1wiKSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTczLFxuICAgIGhvc3Q6IHRydWUsXG4gICAgaG1yOiB7XG4gICAgICBjbGllbnRQb3J0OiA1MTczLFxuICAgIH0sXG4gICAgcHJveHk6IHtcbiAgICAgIFwiL2FwaVwiOiB7XG4gICAgICAgIHRhcmdldDogXCJodHRwOi8vbG9jYWxob3N0OjMwMDFcIixcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICB0aW1lb3V0OiA2MDAwMCxcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgd3M6IHRydWUsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiBcImRpc3RcIixcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICBtaW5pZnk6IFwidGVyc2VyXCIsXG4gICAgdGVyc2VyT3B0aW9uczoge1xuICAgICAgY29tcHJlc3M6IHtcbiAgICAgICAgZHJvcF9jb25zb2xlOiB0cnVlLFxuICAgICAgICBkcm9wX2RlYnVnZ2VyOiB0cnVlLFxuICAgICAgICBkZWFkX2NvZGU6IHRydWUsXG4gICAgICAgIHB1cmVfZ2V0dGVyczogdHJ1ZSxcbiAgICAgICAgdW5zYWZlOiB0cnVlLFxuICAgICAgICBwYXNzZXM6IDMsXG4gICAgICB9LFxuICAgICAgbWFuZ2xlOiB7XG4gICAgICAgIHNhZmFyaTEwOiB0cnVlLFxuICAgICAgfSxcbiAgICB9LFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGV4dGVybmFsOiBbXSxcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICB2ZW5kb3I6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCJdLFxuICAgICAgICAgIHJvdXRlcjogW1wicmVhY3Qtcm91dGVyLWRvbVwiXSxcbiAgICAgICAgICBxdWVyeTogW1wiQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5XCJdLFxuICAgICAgICAgIHVpOiBbXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1kaWFsb2dcIixcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWRyb3Bkb3duLW1lbnVcIixcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXNlbGVjdFwiLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgY2hhcnRzOiBbXCJyZWNoYXJ0c1wiXSxcbiAgICAgICAgICB1dGlsczogW1wieGxzeFwiLCBcImpzcGRmXCIsIFwianNwZGYtYXV0b3RhYmxlXCIsIFwiaHRtbDJjYW52YXNcIiwgXCJkb21wdXJpZnlcIl0sXG4gICAgICAgICAgXCJwcmludC11dGlsc1wiOiBbXCIuL3V0aWxzL3ByaW50VXRpbHNcIl0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxNTAwLFxuICB9LFxuICBkZWZpbmU6IHtcbiAgICAvLyBFbnN1cmUgcHJvZHVjdGlvbiBlbnZpcm9ubWVudCB2YXJpYWJsZXMgYXJlIHByb3Blcmx5IHNldFxuICAgICdwcm9jZXNzLmVudi5OT0RFX0VOVic6IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52Lk5PREVfRU5WIHx8ICdwcm9kdWN0aW9uJyksXG4gICAgLy8gQ29tcGxldGVseSBkaXNhYmxlIGF1dGhEaXNhYmxlciBpbiBwcm9kdWN0aW9uIGJ1aWxkc1xuICAgICdfX0RJU0FCTEVfQVVUSF9ESVNBQkxFUl9fJzogSlNPTi5zdHJpbmdpZnkodHJ1ZSksXG4gICAgLy8gRGlzYWJsZSBhbGwgZGV2ZWxvcG1lbnQgZmVhdHVyZXNcbiAgICAnX19ERVZfXyc6IEpTT04uc3RyaW5naWZ5KGZhbHNlKSxcbiAgICAnaW1wb3J0Lm1ldGEuaG90JzogSlNPTi5zdHJpbmdpZnkoZmFsc2UpLFxuICAgIC8vIEZvcmNlIHByb2R1Y3Rpb24gZW52aXJvbm1lbnRcbiAgICAnaW1wb3J0Lm1ldGEuZW52LkRFVic6IEpTT04uc3RyaW5naWZ5KG1vZGUgIT09ICdwcm9kdWN0aW9uJyksXG4gICAgJ2ltcG9ydC5tZXRhLmVudi5QUk9EJzogSlNPTi5zdHJpbmdpZnkobW9kZSA9PT0gJ3Byb2R1Y3Rpb24nKSxcbiAgICAvLyBEaXNhYmxlIEhNUiBpbiBwcm9kdWN0aW9uXG4gICAgJ2ltcG9ydC5tZXRhLmhvdCc6IG1vZGUgPT09ICdwcm9kdWN0aW9uJyA/ICd1bmRlZmluZWQnIDogJ2ltcG9ydC5tZXRhLmhvdCcsXG4gIH0sXG4gIC8vIFByb2R1Y3Rpb24tc3BlY2lmaWMgY29uZmlndXJhdGlvblxuICAuLi4obW9kZSA9PT0gJ3Byb2R1Y3Rpb24nICYmIHtcbiAgICBlc2J1aWxkOiB7XG4gICAgICBkcm9wOiBbJ2NvbnNvbGUnLCAnZGVidWdnZXInXSxcbiAgICAgIGxlZ2FsQ29tbWVudHM6ICdub25lJyxcbiAgICB9LFxuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgIH0sXG4gIH0pLFxufSkpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFrTyxTQUFTLG9CQUFvQjtBQUMvUCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBRmpCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLElBQUk7QUFBQSxJQUNuQztBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxNQUNILFlBQVk7QUFBQSxJQUNkO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxTQUFTO0FBQUEsUUFDVCxRQUFRO0FBQUEsUUFDUixJQUFJO0FBQUEsTUFDTjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixhQUFhO0FBQUEsSUFDYixRQUFRO0FBQUEsSUFDUixlQUFlO0FBQUEsTUFDYixVQUFVO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxlQUFlO0FBQUEsUUFDZixXQUFXO0FBQUEsUUFDWCxjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsUUFDUixRQUFRO0FBQUEsTUFDVjtBQUFBLE1BQ0EsUUFBUTtBQUFBLFFBQ04sVUFBVTtBQUFBLE1BQ1o7QUFBQSxJQUNGO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFDYixVQUFVLENBQUM7QUFBQSxNQUNYLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxVQUNaLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFBQSxVQUM3QixRQUFRLENBQUMsa0JBQWtCO0FBQUEsVUFDM0IsT0FBTyxDQUFDLHVCQUF1QjtBQUFBLFVBQy9CLElBQUk7QUFBQSxZQUNGO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSxRQUFRLENBQUMsVUFBVTtBQUFBLFVBQ25CLE9BQU8sQ0FBQyxRQUFRLFNBQVMsbUJBQW1CLGVBQWUsV0FBVztBQUFBLFVBQ3RFLGVBQWUsQ0FBQyxvQkFBb0I7QUFBQSxRQUN0QztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSx1QkFBdUI7QUFBQSxFQUN6QjtBQUFBLEVBQ0EsUUFBUTtBQUFBO0FBQUEsSUFFTix3QkFBd0IsS0FBSyxVQUFVLFFBQVEsSUFBSSxZQUFZLFlBQVk7QUFBQTtBQUFBLElBRTNFLDZCQUE2QixLQUFLLFVBQVUsSUFBSTtBQUFBO0FBQUEsSUFFaEQsV0FBVyxLQUFLLFVBQVUsS0FBSztBQUFBLElBQy9CLG1CQUFtQixLQUFLLFVBQVUsS0FBSztBQUFBO0FBQUEsSUFFdkMsdUJBQXVCLEtBQUssVUFBVSxTQUFTLFlBQVk7QUFBQSxJQUMzRCx3QkFBd0IsS0FBSyxVQUFVLFNBQVMsWUFBWTtBQUFBO0FBQUEsSUFFNUQsbUJBQW1CLFNBQVMsZUFBZSxjQUFjO0FBQUEsRUFDM0Q7QUFBQTtBQUFBLEVBRUEsR0FBSSxTQUFTLGdCQUFnQjtBQUFBLElBQzNCLFNBQVM7QUFBQSxNQUNQLE1BQU0sQ0FBQyxXQUFXLFVBQVU7QUFBQSxNQUM1QixlQUFlO0FBQUEsSUFDakI7QUFBQSxJQUNBLGNBQWM7QUFBQSxNQUNaLFVBQVU7QUFBQSxJQUNaO0FBQUEsRUFDRjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
