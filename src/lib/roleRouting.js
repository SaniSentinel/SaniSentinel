/**
 * Canonical role for routing / AuthGuard (JWT app_metadata / user_metadata.role).
 * `admin` is treated as equivalent to `system_admin` for home routes and guards.
 */
export function normalizeAuthRole(role) {
  if (!role || typeof role !== 'string') return null
  return role === 'admin' ? 'system_admin' : role
}

/** Default post-login landing path */
export function getRoleHomePath(metadataRole) {
  const canon = normalizeAuthRole(metadataRole)
  if (canon === 'system_admin') return '/admin-dashboard'
  if (metadataRole === 'district_officer') return '/officer-dashboard'
  return '/dashboard'
}

/** Supabase User from signIn/getUser */
export function getRoleHomePathFromUser(supabaseUser) {
  if (!supabaseUser?.user_metadata) return '/dashboard'
  return getRoleHomePath(supabaseUser.user_metadata.role)
}
