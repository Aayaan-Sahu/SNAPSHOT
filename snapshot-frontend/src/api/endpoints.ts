export const ENDPOINTS = {
  AUTH: {
    GOOGLE_MOBILE: "/auth/google",
    LOGIN_WEB: "/auth/login",
    CALLBACK_WEB: "/auth/callabck",
  },

  USER: {
    ME: "/api/me",
  },

  GROUPS: {
    BASE: "/api/groups",
    JOIN: "/api/groups/join",
    LEAVE: "/api/groups/leave",
    MEMBERS: "/api/groups/members",
    DETAILS: (groupId: string) => `/api/groups/${groupId}`,
  },

  FRIENDS: {
    LIST: "/api/friends",
    REQUEST: "/api/friends/request",
    ACEPT: "/api/friends/accept",
  },

  SYSTEM: {
    PING: "/api/ping",
  },
} as const;