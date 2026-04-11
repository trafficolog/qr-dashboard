export interface User {
  id: string
  email: string
  name: string | null
  role: 'admin' | 'editor' | 'viewer'
  avatarUrl: string | null
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

declare module 'h3' {
  interface H3EventContext {
    user?: User
  }
}
