"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ADMIN_COOKIE,
  adminToken,
  isAdmin,
  passwordMatches,
  setAdminPassword,
} from "@/lib/admin";
import { ACTIVE_PAYMENT_METHODS, getSettings, saveSettings } from "@/lib/settings";
import { updateOrderStatus, type OrderStatus } from "@/lib/orders";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!(await passwordMatches(password))) {
    redirect("/admin/login?error=1");
  }
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, await adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/admin");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

export async function saveSettingsAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");
  const current = await getSettings();
  const str = (k: string) => String(formData.get(k) ?? "").trim();

  await saveSettings({
    whatsapp: str("whatsapp"),
    livechatEmbed: str("livechatEmbed"),
    socials: {
      facebook: str("facebook"),
      instagram: str("instagram"),
      tiktok: str("tiktok"),
      x: str("x"),
      youtube: str("youtube"),
    },
    payments: {
      mode: str("paymentMode") === "direct" ? "direct" : "manual",
      // Only the methods the form renders — anything stored for an inactive
      // method is left untouched rather than blanked by a missing field.
      methods: ACTIVE_PAYMENT_METHODS.reduce(
        (acc, key) => ({ ...acc, [key]: str(`method_${key}`) }),
        { ...current.payments.methods }
      ),
      otherLabel: str("otherLabel"),
    },
  });
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}

export async function changePasswordAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (!(await passwordMatches(current))) redirect("/admin/settings?pwerr=wrong");
  if (next.length < 8) redirect("/admin/settings?pwerr=short");
  if (next !== confirm) redirect("/admin/settings?pwerr=match");

  await setAdminPassword(next);
  // Token rotated — refresh this session's cookie so the admin stays in
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, await adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/admin/settings?pwsaved=1");
}

export async function setOrderStatusAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "new") as OrderStatus;
  await updateOrderStatus(id, status);
  revalidatePath("/admin/orders");
  redirect("/admin/orders");
}
