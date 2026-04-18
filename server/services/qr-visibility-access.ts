type QrScope = 'mine' | 'department' | 'public' | 'all' | undefined
type UserRole = 'admin' | 'editor' | 'viewer'

interface ResolveVisibilityAccessInput {
  scope: QrScope
  userRole: UserRole
  userDepartmentIds: string[]
  requestedDepartmentId?: string
}

export interface ResolvedVisibilityAccess {
  includeMine: boolean
  includePublic: boolean
  allowedDepartmentIds: string[] | null
  denyAll: boolean
}

export function resolveVisibilityAccess(input: ResolveVisibilityAccessInput): ResolvedVisibilityAccess {
  const { scope, userRole, userDepartmentIds, requestedDepartmentId } = input
  const isAdmin = userRole === 'admin'

  if (scope === 'mine') {
    return {
      includeMine: true,
      includePublic: false,
      allowedDepartmentIds: [],
      denyAll: false,
    }
  }

  if (scope === 'public') {
    return {
      includeMine: false,
      includePublic: true,
      allowedDepartmentIds: [],
      denyAll: false,
    }
  }

  if (scope === 'department') {
    if (requestedDepartmentId) {
      if (!isAdmin && !userDepartmentIds.includes(requestedDepartmentId)) {
        return {
          includeMine: false,
          includePublic: false,
          allowedDepartmentIds: [],
          denyAll: true,
        }
      }

      return {
        includeMine: false,
        includePublic: false,
        allowedDepartmentIds: [requestedDepartmentId],
        denyAll: false,
      }
    }

    return {
      includeMine: false,
      includePublic: false,
      allowedDepartmentIds: isAdmin ? null : userDepartmentIds,
      denyAll: !isAdmin && userDepartmentIds.length === 0,
    }
  }

  if (isAdmin) {
    return {
      includeMine: true,
      includePublic: true,
      allowedDepartmentIds: null,
      denyAll: false,
    }
  }

  return {
    includeMine: true,
    includePublic: true,
    allowedDepartmentIds: userDepartmentIds,
    denyAll: false,
  }
}
