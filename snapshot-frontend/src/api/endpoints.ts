export const ENDPOINTS = {
  AUTH: {
    GOOGLE_MOBILE: "/auth/google",
    LOGIN_WEB: "/auth/login",
    CALLBACK_WEB: "/auth/callabck",
  },

  USER: {
    ME: "/api/me",
    STATUS: "/api/user/status",
  },

  GROUPS: {
    BASE: "/api/groups",
    JOIN: "/api/groups/join",
    LEAVE: "/api/groups/leave",
    MEMBERS: "/api/groups/members",
    OWNER: "/api/groups/owner",
    DETAILS: (groupId: string) => `/api/groups/${groupId}`,
  },

  FRIENDS: {
    LIST: "/api/friends",
    REQUEST: "/api/friends/request",
    ACCEPT: "/api/friends/accept",
    REJECT: "/api/friends/reject",
    CANCEL: "/api/friends/cancel",
    INCOMING: "/api/friends/requests/incoming",
    OUTGOING: "/api/friends/requests/outgoing",
    REMOVE: "/api/friends/remove",
  },

  PHOTOS: {
    BASE: "/api/photos",
    SLIDESHOW: "/api/photos/slideshow",
    UPLOAD_URL: "/api/photos/upload-url",
  },

  SYSTEM: {
    PING: "/api/ping",
  },
} as const;