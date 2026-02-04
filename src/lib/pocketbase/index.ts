/**
 * PocketBase Library
 * Main exports for the PocketBase integration
 */

// Client
export { getPb, collections } from "./client";

// Types
export type * from "./types";

// Hooks
export {
  usePocketbaseList,
  usePocketbaseOne,
  usePocketbaseCreate,
  usePocketbaseUpdate,
  usePocketbaseDelete,
  usePocketbaseAuth,
  handlePocketbaseError,
  pbKeys,
} from "./hooks";

// Auth utilities
export {
  login,
  signup,
  logout,
  requestPasswordReset,
  confirmPasswordReset,
  updateEmail,
  confirmEmailChange,
  refreshAuth,
  getCurrentUser,
  isAuthenticated,
  getAuthToken,
  onAuthChange,
} from "./auth";
