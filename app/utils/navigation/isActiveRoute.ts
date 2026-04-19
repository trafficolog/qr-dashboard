export function isActiveRoute(currentPath: string, targetPath: string): boolean {
  if (currentPath === targetPath) return true
  return currentPath.startsWith(`${targetPath}/`)
}
