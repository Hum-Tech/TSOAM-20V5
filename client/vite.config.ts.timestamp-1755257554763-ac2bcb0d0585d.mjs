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
    minify: mode === "production" ? "terser" : false,
    ...mode === "production" && {
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
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
    // Force production environment
    "import.meta.env.DEV": JSON.stringify(mode !== "production"),
    "import.meta.env.PROD": JSON.stringify(mode === "production"),
    // Disable HMR in production (fix duplicate key)
    "import.meta.hot": mode === "production" ? "undefined" : JSON.stringify(false)
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvYXBwL2NvZGUvY2xpZW50XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvYXBwL2NvZGUvY2xpZW50L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9hcHAvY29kZS9jbGllbnQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL1wiKSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTczLFxuICAgIGhvc3Q6IHRydWUsXG4gICAgaG1yOiB7XG4gICAgICBjbGllbnRQb3J0OiA1MTczLFxuICAgIH0sXG4gICAgcHJveHk6IHtcbiAgICAgIFwiL2FwaVwiOiB7XG4gICAgICAgIHRhcmdldDogXCJodHRwOi8vbG9jYWxob3N0OjMwMDFcIixcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICB0aW1lb3V0OiA2MDAwMCxcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgd3M6IHRydWUsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiBcImRpc3RcIixcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICBtaW5pZnk6IG1vZGUgPT09ICdwcm9kdWN0aW9uJyA/IFwidGVyc2VyXCIgOiBmYWxzZSxcbiAgICAuLi4obW9kZSA9PT0gJ3Byb2R1Y3Rpb24nICYmIHtcbiAgICAgIHRlcnNlck9wdGlvbnM6IHtcbiAgICAgICAgY29tcHJlc3M6IHtcbiAgICAgICAgICBkcm9wX2NvbnNvbGU6IHRydWUsXG4gICAgICAgICAgZHJvcF9kZWJ1Z2dlcjogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSksXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgZXh0ZXJuYWw6IFtdLFxuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIHZlbmRvcjogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIl0sXG4gICAgICAgICAgcm91dGVyOiBbXCJyZWFjdC1yb3V0ZXItZG9tXCJdLFxuICAgICAgICAgIHF1ZXJ5OiBbXCJAdGFuc3RhY2svcmVhY3QtcXVlcnlcIl0sXG4gICAgICAgICAgdWk6IFtcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWRpYWxvZ1wiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtZHJvcGRvd24tbWVudVwiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3Qtc2VsZWN0XCIsXG4gICAgICAgICAgXSxcbiAgICAgICAgICBjaGFydHM6IFtcInJlY2hhcnRzXCJdLFxuICAgICAgICAgIHV0aWxzOiBbXCJ4bHN4XCIsIFwianNwZGZcIiwgXCJqc3BkZi1hdXRvdGFibGVcIiwgXCJodG1sMmNhbnZhc1wiLCBcImRvbXB1cmlmeVwiXSxcbiAgICAgICAgICBcInByaW50LXV0aWxzXCI6IFtcIi4vdXRpbHMvcHJpbnRVdGlsc1wiXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDE1MDAsXG4gIH0sXG4gIGRlZmluZToge1xuICAgIC8vIEVuc3VyZSBwcm9kdWN0aW9uIGVudmlyb25tZW50IHZhcmlhYmxlcyBhcmUgcHJvcGVybHkgc2V0XG4gICAgJ3Byb2Nlc3MuZW52Lk5PREVfRU5WJzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYuTk9ERV9FTlYgfHwgJ3Byb2R1Y3Rpb24nKSxcbiAgICAvLyBDb21wbGV0ZWx5IGRpc2FibGUgYXV0aERpc2FibGVyIGluIHByb2R1Y3Rpb24gYnVpbGRzXG4gICAgJ19fRElTQUJMRV9BVVRIX0RJU0FCTEVSX18nOiBKU09OLnN0cmluZ2lmeSh0cnVlKSxcbiAgICAvLyBEaXNhYmxlIGFsbCBkZXZlbG9wbWVudCBmZWF0dXJlc1xuICAgICdfX0RFVl9fJzogSlNPTi5zdHJpbmdpZnkoZmFsc2UpLFxuICAgIC8vIEZvcmNlIHByb2R1Y3Rpb24gZW52aXJvbm1lbnRcbiAgICAnaW1wb3J0Lm1ldGEuZW52LkRFVic6IEpTT04uc3RyaW5naWZ5KG1vZGUgIT09ICdwcm9kdWN0aW9uJyksXG4gICAgJ2ltcG9ydC5tZXRhLmVudi5QUk9EJzogSlNPTi5zdHJpbmdpZnkobW9kZSA9PT0gJ3Byb2R1Y3Rpb24nKSxcbiAgICAvLyBEaXNhYmxlIEhNUiBpbiBwcm9kdWN0aW9uIChmaXggZHVwbGljYXRlIGtleSlcbiAgICAnaW1wb3J0Lm1ldGEuaG90JzogbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nID8gJ3VuZGVmaW5lZCcgOiBKU09OLnN0cmluZ2lmeShmYWxzZSksXG4gIH0sXG4gIC8vIFByb2R1Y3Rpb24tc3BlY2lmaWMgY29uZmlndXJhdGlvblxuICAuLi4obW9kZSA9PT0gJ3Byb2R1Y3Rpb24nICYmIHtcbiAgICBlc2J1aWxkOiB7XG4gICAgICBkcm9wOiBbJ2NvbnNvbGUnLCAnZGVidWdnZXInXSxcbiAgICAgIGxlZ2FsQ29tbWVudHM6ICdub25lJyxcbiAgICB9LFxuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgIH0sXG4gIH0pLFxufSkpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFrTyxTQUFTLG9CQUFvQjtBQUMvUCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBRmpCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLElBQUk7QUFBQSxJQUNuQztBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxNQUNILFlBQVk7QUFBQSxJQUNkO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxTQUFTO0FBQUEsUUFDVCxRQUFRO0FBQUEsUUFDUixJQUFJO0FBQUEsTUFDTjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixhQUFhO0FBQUEsSUFDYixRQUFRLFNBQVMsZUFBZSxXQUFXO0FBQUEsSUFDM0MsR0FBSSxTQUFTLGdCQUFnQjtBQUFBLE1BQzNCLGVBQWU7QUFBQSxRQUNiLFVBQVU7QUFBQSxVQUNSLGNBQWM7QUFBQSxVQUNkLGVBQWU7QUFBQSxRQUNqQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFDYixVQUFVLENBQUM7QUFBQSxNQUNYLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxVQUNaLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFBQSxVQUM3QixRQUFRLENBQUMsa0JBQWtCO0FBQUEsVUFDM0IsT0FBTyxDQUFDLHVCQUF1QjtBQUFBLFVBQy9CLElBQUk7QUFBQSxZQUNGO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSxRQUFRLENBQUMsVUFBVTtBQUFBLFVBQ25CLE9BQU8sQ0FBQyxRQUFRLFNBQVMsbUJBQW1CLGVBQWUsV0FBVztBQUFBLFVBQ3RFLGVBQWUsQ0FBQyxvQkFBb0I7QUFBQSxRQUN0QztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSx1QkFBdUI7QUFBQSxFQUN6QjtBQUFBLEVBQ0EsUUFBUTtBQUFBO0FBQUEsSUFFTix3QkFBd0IsS0FBSyxVQUFVLFFBQVEsSUFBSSxZQUFZLFlBQVk7QUFBQTtBQUFBLElBRTNFLDZCQUE2QixLQUFLLFVBQVUsSUFBSTtBQUFBO0FBQUEsSUFFaEQsV0FBVyxLQUFLLFVBQVUsS0FBSztBQUFBO0FBQUEsSUFFL0IsdUJBQXVCLEtBQUssVUFBVSxTQUFTLFlBQVk7QUFBQSxJQUMzRCx3QkFBd0IsS0FBSyxVQUFVLFNBQVMsWUFBWTtBQUFBO0FBQUEsSUFFNUQsbUJBQW1CLFNBQVMsZUFBZSxjQUFjLEtBQUssVUFBVSxLQUFLO0FBQUEsRUFDL0U7QUFBQTtBQUFBLEVBRUEsR0FBSSxTQUFTLGdCQUFnQjtBQUFBLElBQzNCLFNBQVM7QUFBQSxNQUNQLE1BQU0sQ0FBQyxXQUFXLFVBQVU7QUFBQSxNQUM1QixlQUFlO0FBQUEsSUFDakI7QUFBQSxJQUNBLGNBQWM7QUFBQSxNQUNaLFVBQVU7QUFBQSxJQUNaO0FBQUEsRUFDRjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
