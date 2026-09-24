import { getSessionUserId } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const allowedEmails = [
    process.env.ADMIN_EMAIL,
    ...(process.env.ADMIN_EMAILS ?? "").split(","),
  ].map((value) => value?.trim().toLowerCase()).filter(Boolean);
  return allowedEmails.includes(email.trim().toLowerCase());
}

export async function isAdminSession() {
  const userId = await getSessionUserId();
  if (!userId) return false;
  try {
    await connectToDatabase();
    const user = await User.findById(userId).select("email status").lean();
    return Boolean(user && isAdminEmail(user.email) && user.status !== "suspended");
  } catch { return false; }
}
