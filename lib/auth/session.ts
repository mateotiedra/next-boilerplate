import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

/**
 * Get the current authenticated user from Kinde.
 * Returns null if the user is not authenticated.
 */
export async function getKindeUser() {
  const { getUser, isAuthenticated } = getKindeServerSession();

  const authenticated = await isAuthenticated();
  if (!authenticated) return null;

  const user = await getUser();
  return user;
}

/**
 * Check if the current user is authenticated.
 */
export async function isUserAuthenticated(): Promise<boolean> {
  const { isAuthenticated } = getKindeServerSession();
  return await isAuthenticated();
}

/**
 * Get Kinde access token claims (roles, permissions, etc.)
 */
export async function getAccessToken() {
  const { getAccessTokenRaw } = getKindeServerSession();
  return await getAccessTokenRaw();
}

/**
 * Get user permissions from Kinde.
 */
export async function getUserPermissions() {
  const { getPermissions } = getKindeServerSession();
  return await getPermissions();
}

/**
 * Check if user has a specific permission.
 */
export async function hasPermission(permission: string): Promise<boolean> {
  const { getPermission } = getKindeServerSession();
  const result = await getPermission(permission);
  return result?.isGranted ?? false;
}
