import React from "react";
import "./global.css";

// Handle third-party service errors gracefully
window.addEventListener('error', (event) => {
  // Suppress FullStory and other third-party fetch errors
  if (event.message?.includes('Failed to fetch') &&
      (event.filename?.includes('fs.js') ||
       event.filename?.includes('fullstory') ||
       event.filename?.includes('authDisabler') ||
       event.filename?.includes('@vite/client'))) {
    console.warn('Third-party service error suppressed:', event.message);
    event.preventDefault();
    return false;
  }
});

// Handle unhandled promise rejections from third-party services
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('Failed to fetch') ||
      event.reason?.toString().includes('fullstory') ||
      event.reason?.toString().includes('authDisabler') ||
      event.reason?.toString().includes('__vite_ping') ||
      event.reason?.toString().includes('@vite/client')) {
    console.warn('Third-party service promise rejection suppressed:', event.reason);
    event.preventDefault();
  }
});

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { offlineService } from "./services/OfflineService";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { setupAbortErrorHandler } from "./utils/abortHandler";
import { disableConflictingAuth } from "./utils/authDisabler";
import Login from "./pages/Login";
import Dashboard from "./pages/DashboardNew";
import MemberManagement from "./pages/MemberManagement";
import NewMembers from "./pages/NewMembers";
import ZionSurfLoading from "./components/ZionSurfLoading";

import HR from "./pages/HR";
import FinanceAdvanced from "./pages/FinanceAdvanced";
import Messaging from "./pages/Messaging";
import Appointments from "./pages/Appointments";
import EventsEnhanced from "./pages/EventsEnhanced";
import Settings from "./pages/Settings";
import SystemLogs from "./pages/SystemLogs";
import Users from "./pages/Users";
import Setup from "./pages/Setup";
import WelfareEnhanced from "./pages/WelfareEnhanced";
import Inventory from "./pages/Inventory";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import DatabaseIntegrationDemo from "./components/DatabaseIntegrationDemo";
import { Layout } from "./components/layout/Layout";

const queryClient = new QueryClient();

// Initialize offline service safely
try {
  offlineService.loadOfflineQueue();
} catch (error) {
  console.warn("Offline service initialization failed:", error);
}

// Initialize abort error handler
setupAbortErrorHandler();

// Disable conflicting authentication methods to prevent response consumption conflicts
disableConflictingAuth();

// Additional immediate AbortError suppression setup
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0]?.toString() || '';
  if (message.includes('AbortError') ||
      message.includes('signal is aborted') ||
      message.includes('The operation was aborted')) {
    // Skip logging AbortErrors
    return;
  }
  originalConsoleError.apply(console, args);
};

// Catch any remaining unhandled rejections immediately
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  if (reason && (
    reason.name === 'AbortError' ||
    reason.message?.includes('signal is aborted') ||
    reason.message?.includes('The operation was aborted') ||
    (reason instanceof DOMException && reason.name === 'AbortError') ||
    reason.toString?.()?.includes('AbortError')
  )) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
});

// Global error handler for production environment
if (window.location.hostname !== 'localhost') {
  // Suppress API fetch errors in production since app has demo data fallbacks
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('Failed to fetch') ||
        (event.reason?.name === 'TypeError' && event.reason?.message?.includes('fetch')) ||
        event.reason?.message?.includes('API request failed') ||
        event.reason?.name === 'AbortError' ||
        event.reason?.message?.includes('signal is aborted') ||
        event.reason?.message?.includes('AbortError')) {
      // Prevent console errors for expected API failures and abort errors in production
      event.preventDefault();
      if (!event.reason?.name?.includes('Abort')) {
        console.log('API unavailable, using demo data fallback');
      }
    }
  });

  // Also suppress error boundary logs for API failures
  const originalError = console.error;
  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    if (message.includes('Failed to fetch') ||
        message.includes('TypeError') && message.includes('fetch') ||
        message.includes('API request failed') ||
        message.includes('LeaveManagementService')) {
      // Skip logging API fetch errors in production
      return;
    }
    originalError.apply(console, args);
  };
}

// Also suppress these errors globally regardless of environment for leave management
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('/leave/types') ||
      event.reason?.message?.includes('/leave/requests') ||
      event.reason?.message?.includes('/leave/analytics')) {
    // Prevent console errors for leave management API failures
    event.preventDefault();
    console.log('Leave management API not available, using demo data');
  }
});

// Additional global AbortError suppression for production
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.name === 'AbortError' ||
      event.reason?.message?.includes('signal is aborted') ||
      event.reason?.message?.includes('The operation was aborted') ||
      (event.reason instanceof DOMException && event.reason.name === 'AbortError')) {
    // Suppress all AbortErrors globally
    event.preventDefault();
    // Silent suppression - no logging needed for abort errors
  }
});

// Also handle error events for AbortErrors
window.addEventListener('error', (event) => {
  if (event.error?.name === 'AbortError' ||
      event.error?.message?.includes('signal is aborted') ||
      event.error?.message?.includes('The operation was aborted') ||
      (event.error instanceof DOMException && event.error.name === 'AbortError')) {
    event.preventDefault();
    event.stopPropagation();
  }
});

// Note: AbortError handling is now managed by setupAbortErrorHandler() from utils/abortHandler.ts

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

const AppContent = () => {
  const { isSystemLoading, completeSystemLoading } = useAuth();

  // Show ZionSurf loading screen if system is loading
  if (isSystemLoading) {
    return <ZionSurfLoading onComplete={completeSystemLoading} />;
  }

  return (
    <BrowserRouter>
      <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/setup" element={<Setup />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/members"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "hr", "user"]}
                  >
                    <MemberManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/new-members"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "hr", "user"]}
                  >
                    <NewMembers />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/hr"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hr"]}>
                    <HR />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance"
                element={
                  <ProtectedRoute allowedRoles={["admin", "finance"]}>
                    <FinanceAdvanced />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messaging"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "admin",
                      "hr",
                      "finance",
                      "user",
                    ]}
                  >
                    <Messaging />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/welfare"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "admin",
                      "hr",
                      "finance",
                      "user",
                    ]}
                  >
                    <WelfareEnhanced />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hr", "finance", "user"]}>
                    <Inventory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/appointments"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "hr", "finance"]}
                  >
                    <Appointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "admin",
                      "hr",
                      "finance",
                      "user",
                    ]}
                  >
                    <EventsEnhanced />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "admin",
                      "hr",
                      "finance",
                    ]}
                  >
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system-logs"
                element={
                  <ProtectedRoute allowedRoles={["admin", "hr"]}>
                    <SystemLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "admin",
                      "hr",
                      "finance",
                      "user",
                    ]}
                  >
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/database-demo"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Layout>
                      <DatabaseIntegrationDemo />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
      );
};

createRoot(document.getElementById("root")!).render(<App />);
