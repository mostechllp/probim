/**
 * Shared utility for resolving and formatting photo/avatar URLs.
 * Handles temporary paths, data URIs, absolute URLs, and relative storage paths.
 */

export const getPhotoUrl = (photoValue) => {
  if (!photoValue) return null;

  // Handle temporary avatar uploads
  if (photoValue.startsWith("/tmp/")) {
    const baseUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "";
    return `${baseUrl}/storage/temp/${photoValue.replace("/tmp/", "")}`;
  }

  // Handle inline base64 data URIs
  if (photoValue.startsWith("data:")) return photoValue;

  // Handle absolute HTTP/HTTPS URLs
  if (photoValue.startsWith("http://") || photoValue.startsWith("https://")) {
    return photoValue;
  }

  // Resolve backend server URL
  const baseUrl = import.meta.env.VITE_API_URL?.replace("/api", "") || "";

  // Handle paths already containing the storage prefix
  if (photoValue.startsWith("/storage/")) return `${baseUrl}${photoValue}`;

  // Handle simple filenames or standard avatar subpaths
  if (!photoValue.includes("/")) {
    return `${baseUrl}/storage/avatars/${photoValue}`;
  }

  return `${baseUrl}/storage/${photoValue}`;
};

/**
 * Generates a clean, modern initials-based avatar using the UI-Avatars service.
 * Used as a runtime fallback if an image fails to load.
 */
export const getFallbackAvatar = (name) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Employee")}&background=2ecc71&color=fff&rounded=true&size=128`;
};
