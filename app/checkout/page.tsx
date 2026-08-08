import { getSettings } from "@/lib/settings";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  const settings = getSettings();
  return (
    <CheckoutForm
      mode={settings.payments.mode}
      methodDetails={settings.payments.methods}
    />
  );
}
