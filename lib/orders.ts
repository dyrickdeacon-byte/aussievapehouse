import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type OrderItem = {
  id: number;
  slug: string;
  name: string;
  price: number;
  qty: number;
};

export type OrderStatus =
  | "new"
  | "awaiting-payment"
  | "paid"
  | "shipped"
  | "cancelled";

export type Order = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  paymentMode: "manual" | "direct";
  paymentMethod: string;
  paymentOther?: string;
  paymentReference?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    suburb: string;
    state: string;
    postcode: string;
    notes?: string;
  };
  items: OrderItem[];
  subtotal: number;
  discountCode?: string;
  discount?: number;
  /** subtotal minus discount; older orders may lack it — fall back to subtotal */
  total?: number;
};

const FILE = () => path.join(process.cwd(), "data", "orders.json");

export function readOrders(): Order[] {
  try {
    return JSON.parse(readFileSync(FILE(), "utf8"));
  } catch {
    return [];
  }
}

function persist(orders: Order[]) {
  mkdirSync(path.dirname(FILE()), { recursive: true });
  writeFileSync(FILE(), JSON.stringify(orders, null, 1));
}

export function addOrder(order: Order): void {
  const orders = readOrders();
  orders.unshift(order);
  persist(orders);
}

export function updateOrderStatus(id: string, status: OrderStatus): boolean {
  const orders = readOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) return false;
  order.status = status;
  persist(orders);
  return true;
}

export function newOrderId(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `AVH-${stamp}${rand}`;
}
