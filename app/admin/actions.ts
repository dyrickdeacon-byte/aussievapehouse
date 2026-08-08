"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE, adminToken, isAdmin, passwordMatches } from "@/lib/admin";
import { getSettings, saveSettings, type PaymentMethodKey } from "@/lib/settings";
import { updateOrderStatus, type OrderStatus } from "@/lib/orders";

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    redirect("/admin/login?error=1");
  }
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, adminToken(), {
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
  const current = getSettings();
  const str = (k: string) => String(formData.get(k) ?? "").trim();

  saveSettings({
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
      methods: (
        ["bank", "payid", "paypal", "applepay", "googlepay", "card", "other"] as PaymentMethodKey[]
      ).reduce(
        (acc, key) => ({ ...acc, [key]: str(`method_${key}`) }),
        { ...current.payments.methods }
      ),
      otherLabel: str("otherLabel"),
    },
  });
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}

export async function setOrderStatusAction(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin/login");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "new") as OrderStatus;
  updateOrderStatus(id, status);
  revalidatePath("/admin/orders");
  redirect("/admin/orders");
}
