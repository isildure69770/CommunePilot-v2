export function clientPrincipal(request) {
  const encoded = request.headers.get("x-ms-client-principal");
  if (!encoded) return null;
  try {
    const value = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
    return value && Array.isArray(value.userRoles) ? value : null;
  } catch {
    return null;
  }
}

export function normalizedRole(role) {
  return String(role ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
}

export function hasRole(user, allowedRoles) {
  return user?.userRoles?.some((role) => allowedRoles.has(normalizedRole(role))) ?? false;
}

export function isAuthenticated(user) {
  return hasRole(user, new Set(["authenticated"]));
}
