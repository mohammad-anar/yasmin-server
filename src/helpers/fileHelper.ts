import { Request } from "express";
import config from "../config/index.js";

/**
 * Dynamically rewrites avatar/file URLs to use the current host instead of hardcoded 'localhost'
 */
export const formatAvatarUrl = (avatarUrl: string | null | undefined, req?: Request): string | null | undefined => {
  if (!avatarUrl) return avatarUrl;

  if (avatarUrl.includes("/uploads/")) {
    const reqHost = req?.get("host");
    const backendUrl = (req && reqHost) ? `${req.protocol}://${reqHost}` : (config.backend_url || "http://localhost:5000");
    
    const parts = avatarUrl.split("/uploads/");
    const fileName = parts[parts.length - 1];
    return `${backendUrl}/uploads/${fileName}`;
  }

  return avatarUrl;
};
