import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * ============================================================
 * API CLIENT
 * ============================================================
 */

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

/**
 * ============================================================
 * USER TYPES
 * ============================================================
 */

export const USER_TYPES = [
  "admin",
  "hr",
  "employee",
  "manager",
  "team_lead",
];

/**
 * ============================================================
 * TOKEN KEYS
 * ============================================================
 */

export const TOKEN_KEYS = [
  ...USER_TYPES.map((type) => `${type}-token`),
  "auth-token",
];

/**
 * ============================================================
 * TOKEN HELPERS
 * ============================================================
 */

const isEmptyToken = (value) => {
  return (
    !value ||
    typeof value !== "string" ||
    value.trim() === "" ||
    value === "null" ||
    value === "undefined"
  );
};

const isValidUserType = (type) => {
  return type && USER_TYPES.includes(type);
};

/**
 * ============================================================
 * STORAGE URL
 * ============================================================
 */

export const getStorageUrl = (path) => {
  if (!path) return null;

  if (
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  if (path.startsWith("data:")) {
    return path;
  }

  const baseUrl =
    API_BASE_URL?.replace(/\/api\/?$/, "") || "";

  const cleanPath = path.startsWith("/")
    ? path.slice(1)
    : path;

  return `${baseUrl}/storage/${cleanPath}`;
};

/**
 * ============================================================
 * ACTIVE USER TYPE
 * ============================================================
 */

export const getActiveUserType = () => {
  const activeType = localStorage.getItem(
    "active-user-type"
  );

  if (!isValidUserType(activeType)) {
    return null;
  }

  return activeType;
};

/**
 * ============================================================
 * ACTIVE TOKEN KEY
 * ============================================================
 */

export const getActiveTokenKey = () => {
  const activeType = getActiveUserType();

  if (!activeType) {
    return null;
  }

  const tokenKey = `${activeType}-token`;
  const token = localStorage.getItem(tokenKey);

  if (isEmptyToken(token)) {
    return null;
  }

  return tokenKey;
};

/**
 * ============================================================
 * ACTIVE TOKEN
 * ============================================================
 */

export const getActiveToken = () => {
  const tokenKey = getActiveTokenKey();

  if (!tokenKey) {
    return null;
  }

  const token = localStorage.getItem(tokenKey);

  return isEmptyToken(token) ? null : token;
};

/**
 * Internal alias
 */
const getToken = () => {
  return getActiveToken();
};

/**
 * ============================================================
 * JWT DECODER
 * ============================================================
 */

const decodeJwt = (token) => {
  try {
    if (isEmptyToken(token)) {
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];

    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const paddedBase64 =
      base64 +
      "=".repeat(
        (4 - (base64.length % 4)) % 4
      );

    const binary = atob(paddedBase64);

    const bytes = Uint8Array.from(
      binary,
      (character) => character.charCodeAt(0)
    );

    const json = new TextDecoder().decode(bytes);

    return JSON.parse(json);
  } catch (error) {
    console.warn(
      "Failed to decode JWT:",
      error
    );

    return null;
  }
};

/**
 * ============================================================
 * TOKEN EXPIRATION
 * ============================================================
 */

export const isExpiringSoon = (
  token,
  bufferSeconds = 60
) => {
  const payload = decodeJwt(token);

  if (!payload?.exp) {
    return false;
  }

  return (
    Date.now() >=
    payload.exp * 1000 -
      bufferSeconds * 1000
  );
};

/**
 * ============================================================
 * TOKEN EXPIRED
 * ============================================================
 */

export const isTokenExpired = (token) => {
  const payload = decodeJwt(token);

  if (!payload?.exp) {
    return false;
  }

  return Date.now() >= payload.exp * 1000;
};

/**
 * ============================================================
 * SAVE AUTH USER
 * ============================================================
 *
 * The refresh API returns the complete user object.
 * Save it so initializeAuth can restore the session.
 */

const persistUser = (user) => {
  if (!user) {
    return;
  }

  try {
    localStorage.setItem(
      "user-data",
      JSON.stringify(user)
    );

    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    if (user.type) {
      localStorage.setItem(
        "user-type",
        user.type
      );

      localStorage.setItem(
        "active-user-type",
        user.type
      );
    }
  } catch (error) {
    console.warn(
      "Unable to persist user:",
      error
    );
  }
};

/**
 * ============================================================
 * PERSIST TOKEN
 * ============================================================
 */

const persistToken = (token, userType = null) => {
  if (isEmptyToken(token)) {
    return false;
  }

  const activeType =
    userType || getActiveUserType();

  if (!isValidUserType(activeType)) {
    console.warn(
      "persistToken: No valid user type"
    );

    return false;
  }

  const tokenKey = `${activeType}-token`;

  /**
   * Remove old tokens.
   *
   * This prevents multiple user sessions from
   * accidentally being considered active.
   */
  TOKEN_KEYS.forEach((key) => {
    if (key !== tokenKey) {
      localStorage.removeItem(key);
    }
  });

  localStorage.setItem(
    tokenKey,
    token
  );

  localStorage.setItem(
    "active-user-type",
    activeType
  );

  localStorage.setItem(
    "user-type",
    activeType
  );

  /**
   * Keep Axios defaults synchronized.
   */
  apiClient.defaults.headers.common.Authorization =
    `Bearer ${token}`;

  return true;
};

/**
 * ============================================================
 * SET AUTH TOKEN
 * ============================================================
 */

export const setAuthToken = (
  token,
  userType,
  user = null
) => {
  if (
    isEmptyToken(token) ||
    !isValidUserType(userType)
  ) {
    console.warn(
      "setAuthToken: Invalid token or user type"
    );

    return false;
  }

  const saved = persistToken(
    token,
    userType
  );

  if (!saved) {
    return false;
  }

  if (user) {
    persistUser(user);
  }

  console.log(
    `🔐 Authentication stored for ${userType}`
  );

  return true;
};

/**
 * ============================================================
 * PUBLIC AUTH TOKEN GETTER
 * ============================================================
 */

export const getAuthToken = (
  userType = null
) => {
  const activeType =
    userType || getActiveUserType();

  if (!isValidUserType(activeType)) {
    return null;
  }

  const tokenKey = `${activeType}-token`;

  const token =
    localStorage.getItem(tokenKey);

  return isEmptyToken(token)
    ? null
    : token;
};

/**
 * ============================================================
 * CLEAR ALL AUTH DATA
 * ============================================================
 */

export const clearAllTokens = () => {
  /**
   * Remove all token keys.
   */
  TOKEN_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });

  /**
   * Remove authentication-related data.
   */
  const authStorageKeys = [
    "active-user-type",
    "user-type",
    "userType",
    "user-data",
    "user",
    "token",

    "admin-user",
    "hr-user",
    "employee-user",
    "manager-user",
    "team-lead-user",

    "remember-me",
    "remembered-email",
  ];

  authStorageKeys.forEach((key) => {
    localStorage.removeItem(key);
  });

  /**
   * Remove Axios authorization.
   */
  delete apiClient.defaults.headers.common.Authorization;

  console.log(
    "🧹 All authentication data cleared"
  );
};

/**
 * ============================================================
 * AUTH EXPIRED HANDLER
 * ============================================================
 */

let authExpiredHandled = false;

export const clearAuthAndRedirect = () => {
  if (authExpiredHandled) {
    return;
  }

  authExpiredHandled = true;

  console.warn(
    "🚪 Authentication expired. Logging out."
  );

  clearAllTokens();

  window.dispatchEvent(
    new CustomEvent("auth-expired")
  );

  setTimeout(() => {
    const currentPath =
      window.location.pathname;

    if (
      currentPath !== "/login" &&
      currentPath !== "/"
    ) {
      window.location.href = "/login";
    }

    authExpiredHandled = false;
  }, 0);
};

/**
 * ============================================================
 * REFRESH STATE
 * ============================================================
 */

let refreshPromise = null;

/**
 * ============================================================
 * REFRESH ACCESS TOKEN
 * ============================================================
 *
 * IMPORTANT:
 *
 * Your backend refresh response is:
 *
 * {
 *   status: "success",
 *   message: "Login successful",
 *   data: {
 *      access_token: "...",
 *      token_type: "bearer",
 *      expires_in: 3600,
 *      user: {...}
 *   }
 * }
 *
 * Therefore we extract:
 *
 * response.data.data.access_token
 *
 * and also persist the returned user.
 */

const doRefresh = async () => {
  const activeType =
    getActiveUserType();

  const currentToken =
    getToken();

  /**
   * We need BOTH:
   *
   * 1. active user type
   * 2. current token
   */
  if (
    !isValidUserType(activeType) ||
    isEmptyToken(currentToken)
  ) {
    console.warn(
      "Refresh aborted: missing active user type or token",
      {
        activeType,
        hasToken: !isEmptyToken(
          currentToken
        ),
      }
    );

    throw new Error(
      "No valid authentication session"
    );
  }

  try {
    console.log(
      "🔄 Refreshing access token...",
      {
        userType: activeType,
      }
    );

    /**
     * IMPORTANT:
     *
     * Do NOT use apiClient here.
     *
     * Using axios directly prevents the refresh
     * request from passing through our own interceptors.
     */
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {
        token: currentToken,
      },
      {
        headers: {
          Authorization:
            `Bearer ${currentToken}`,

          Accept:
            "application/json",

          "Content-Type":
            "application/json",
        },

        /**
         * Do not allow Axios to transform this
         * into another authentication flow.
         */
        timeout: 15000,
      }
    );

    /**
     * Your backend response:
     *
     * response.data.data.access_token
     */
    const responseData =
      response.data?.data;

    const newToken =
      responseData?.access_token ||
      response.data?.access_token ||
      responseData?.token ||
      response.data?.token;

    const refreshedUser =
      responseData?.user ||
      response.data?.user ||
      null;

    if (isEmptyToken(newToken)) {
      throw new Error(
        "Refresh response did not contain access_token"
      );
    }

    /**
     * If backend returns user.type,
     * use it as the authoritative type.
     *
     * Otherwise retain current type.
     */
    const newUserType =
      refreshedUser?.type ||
      activeType;

    if (
      !isValidUserType(newUserType)
    ) {
      throw new Error(
        "Refresh response contains invalid user type"
      );
    }

    /**
     * Important:
     *
     * Store the NEW token under the correct
     * user type.
     */
    const saved = persistToken(
      newToken,
      newUserType
    );

    if (!saved) {
      throw new Error(
        "Unable to persist refreshed token"
      );
    }

    /**
     * Store refreshed user.
     */
    if (refreshedUser) {
      persistUser(refreshedUser);
    }

    console.log(
      "✅ Access token refreshed successfully",
      {
        userType: newUserType,
        expiresIn:
          responseData?.expires_in,
      }
    );

    return newToken;
  } catch (error) {
    console.error(
      "❌ Token refresh failed:",
      error.response?.data ||
        error.message
    );

    /**
     * DO NOT immediately call clearAllTokens here.
     *
     * The response interceptor will decide whether
     * this is a genuine authentication failure.
     */
    throw error;
  }
};

/**
 * ============================================================
 * SHARED REFRESH FUNCTION
 * ============================================================
 */

const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = doRefresh()
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

/**
 * ============================================================
 * REQUEST INTERCEPTOR
 * ============================================================
 */

apiClient.interceptors.request.use(
  async (config) => {
    config.headers =
      config.headers || {};

    /**
     * Multipart request.
     *
     * Let browser/Axios create boundary.
     */
    if (
      config.data instanceof FormData
    ) {
      delete config.headers[
        "Content-Type"
      ];
    } else {
      config.headers[
        "Content-Type"
      ] = "application/json";
    }

    /**
     * Never refresh the refresh endpoint.
     */
    if (
      config.url?.includes(
        "/auth/refresh"
      )
    ) {
      return config;
    }

    let token =
      getToken();

    /**
     * No token.
     *
     * Do not immediately redirect here.
     *
     * The API request can still be sent if it
     * doesn't require authentication.
     */
    if (!token) {
      delete config.headers.Authorization;

      return config;
    }

    /**
     * Refresh BEFORE expiration.
     *
     * 60 seconds gives us a safe buffer.
     */
    if (
      isExpiringSoon(
        token,
        60
      )
    ) {
      try {
        token =
          await refreshAccessToken();
      } catch (refreshError) {
        /**
         * Do NOT destroy the session here.
         *
         * Let the server response determine whether
         * authentication is actually invalid.
         */
        console.warn(
          "Pre-request token refresh failed. Using current token."
        );
      }
    }

    /**
     * Always attach the latest token.
     */
    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * ============================================================
 * RESPONSE INTERCEPTOR
 * ============================================================
 */

apiClient.interceptors.response.use(
  /**
   * Successful response.
   */
  (response) => {
    return response;
  },

  /**
   * Failed response.
   */
  async (error) => {
    const originalRequest =
      error.config;

    /**
     * Network error / malformed request.
     */
    if (
      !error.response ||
      !originalRequest
    ) {
      return Promise.reject(error);
    }

    /**
     * Only handle 401.
     */
    if (
      error.response.status !== 401
    ) {
      return Promise.reject(error);
    }

    /**
     * Never refresh the refresh endpoint itself.
     *
     * A 401 here means the backend rejected the
     * authentication session.
     */
    if (
      originalRequest.url?.includes(
        "/auth/refresh"
      )
    ) {
      clearAuthAndRedirect();

      return Promise.reject(error);
    }

    /**
     * Prevent infinite retry.
     */
    if (
      originalRequest._retry
    ) {
      clearAuthAndRedirect();

      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      console.log(
        "🔄 API returned 401. Attempting token refresh..."
      );

      /**
       * Shared refresh promise.
       *
       * If multiple requests receive 401 simultaneously,
       * only ONE refresh request is made.
       */
      const newToken =
        await refreshAccessToken();

      if (
        isEmptyToken(newToken)
      ) {
        throw new Error(
          "Refresh returned empty token"
        );
      }

      /**
       * Ensure headers exist.
       */
      originalRequest.headers =
        originalRequest.headers ||
        {};

      /**
       * Replace old token.
       */
      originalRequest.headers.Authorization =
        `Bearer ${newToken}`;

      /**
       * Retry original request.
       */
      return apiClient(
        originalRequest
      );
    } catch (refreshError) {
      console.error(
        "❌ Unable to recover from 401:",
        refreshError.response?.data ||
          refreshError.message
      );

      /**
       * Now we KNOW the API rejected the
       * authentication and refresh failed.
       *
       * This is the correct place to logout.
       */
      clearAuthAndRedirect();

      return Promise.reject(
        refreshError
      );
    }
  }
);

/**
 * ============================================================
 * EXPORT
 * ============================================================
 */

export default apiClient;