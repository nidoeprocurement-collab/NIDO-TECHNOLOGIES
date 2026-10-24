import { clerkClient, getAuth } from "@clerk/express";

const VALID_USER_TYPES = new Set(["nido_admin", "client_admin", "client_user"]);

function primaryEmailFor(clerkUser) {
  return (
    clerkUser.primaryEmailAddress ||
    clerkUser.emailAddresses?.find(
      (email) => email.id === clerkUser.primaryEmailAddressId,
    ) ||
    clerkUser.emailAddresses?.[0] ||
    null
  );
}

function userDisplayName(clerkUser, email) {
  const fullName = [clerkUser.firstName, clerkUser.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || email || "User";
}

export async function resolveClerkPrincipal(userId) {
  let clerkUser = await clerkClient.users.getUser(userId);
  const primaryEmail = primaryEmailFor(clerkUser);
  const email = primaryEmail?.emailAddress?.trim().toLowerCase() || "";
  const verified = primaryEmail?.verification?.status === "verified";
  let metadata = clerkUser.publicMetadata || {};

  const firstOwnerEmail = process.env.NIDO_INITIAL_OWNER_EMAIL
    ?.trim()
    .toLowerCase();
  if (firstOwnerEmail && email === firstOwnerEmail && verified) {
    if (
      metadata.nidoRole !== "System Owner" ||
      metadata.userType !== "nido_admin" ||
      metadata.nidoProvisioned !== true
    ) {
      clerkUser = await clerkClient.users.updateUserMetadata(userId, {
        publicMetadata: {
          ...metadata,
          nidoRole: "System Owner",
          userType: "nido_admin",
          nidoProvisioned: true,
        },
      });
      metadata = clerkUser.publicMetadata || {};
    }
  }

  const role = typeof metadata.nidoRole === "string" ? metadata.nidoRole : "";
  const userType =
    typeof metadata.userType === "string" ? metadata.userType : "";
  const clientId =
    typeof metadata.clientId === "string" ? metadata.clientId : "";

  if (
    !email ||
    !role ||
    !VALID_USER_TYPES.has(userType) ||
    (userType !== "nido_admin" && !clientId)
  ) {
    return null;
  }

  return {
    id: clerkUser.id,
    email,
    name: userDisplayName(clerkUser, email),
    role,
    userType,
    clientId: clientId || undefined,
    clientName:
      typeof metadata.clientName === "string" ? metadata.clientName : undefined,
    department:
      typeof metadata.department === "string" ? metadata.department : undefined,
  };
}

export async function clerkPrincipalMiddleware(req, res, next) {
  if (!req.path.startsWith("/api/") || req.path.startsWith("/api/__clerk/")) {
    return next();
  }

  const { userId } = getAuth(req);
  if (!userId) return next();

  req.clerkUserId = userId;
  try {
    const profile = await resolveClerkPrincipal(userId);
    req.clerkAppProfile = profile;
    if (profile) req.authenticatedUser = profile;
    return next();
  } catch (error) {
    return next(error);
  }
}
