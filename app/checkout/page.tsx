import { getSettings } from "@/lib/settings";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const settings = await getSettings();
  return (
    <CheckoutForm
      mode={settings.payments.mode}
      methodDetails={settings.payments.methods}
      otherLabel={settings.payments.otherLabel}
    />
  );
}
