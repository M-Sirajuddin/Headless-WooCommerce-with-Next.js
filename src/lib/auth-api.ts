import type { UserDetails, UserAddress } from "@/store/authSlice";

export async function loginUser(username: string, _password: string) {
  return {
    token: "mock-jwt-token-12345",
    user: {
      id: 99,
      username: username,
      email: `${username}@example.com`,
      firstName: "Test",
      lastName: "User",
      nickname: "Tester",
      displayName: "Brainbean Dev Tester",
    } as UserDetails,
  };
}

export async function registerUser(username: string, email: string, _password: string) {
  return {
    id: 99,
    username,
    email,
  };
}

export async function fetchUserProfile(_token: string): Promise<UserDetails> {
  return {
    id: 99,
    username: "brainbean",
    email: "tester@example.com",
    firstName: "Test",
    lastName: "User",
    nickname: "Tester",
    displayName: "Brainbean Dev Tester",
    billing: {
      firstName: "Test",
      lastName: "User",
      company: "Hedy Store",
      address1: "123 Main St",
      address2: "",
      city: "Los Angeles",
      state: "CA",
      postcode: "90001",
      country: "US",
      phone: "555-555-5555",
      email: "tester@example.com",
    },
    shipping: {
      firstName: "Test",
      lastName: "User",
      company: "Hedy Store",
      address1: "123 Main St",
      address2: "",
      city: "Los Angeles",
      state: "CA",
      postcode: "90001",
      country: "US",
      phone: "555-555-5555",
    },
  };
}

export async function updateUserProfile(
  _token: string,
  _userId: number,
  profileData: { firstName: string; lastName: string; email: string; displayName?: string; nickname?: string }
) {
  return { success: true, nickname: profileData.nickname, ...profileData };
}

export async function updateUserAddresses(
  _token: string,
  billing: UserAddress,
  shipping: UserAddress
) {
  return { success: true, billing, shipping };
}

export async function fetchUserOrders(_token: string): Promise<any[]> {
  return [
    {
      orderId: 1001,
      orderNumber: "1001",
      date: new Date().toISOString(),
      status: "COMPLETED",
      total: "$120.00",
      needsPayment: false,
    }
  ];
}

export interface CheckoutAddress {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface CheckoutPayload {
  billing: CheckoutAddress;
  shipping?: CheckoutAddress;
  shipToDifferentAddress: boolean;
  paymentMethod: string;
  paymentMethodTitle: string;
  customerNote?: string;
  lineItems: Array<{ id: string; quantity: number }>;
  coupons?: string[];
  shippingMethodId?: string | null;
}

export interface PlacedOrder {
  orderId?: number;
  orderNumber: string;
  orderKey?: string;
  total: string;
  status: string;
  date: string;
  needsPayment?: boolean;
  paymentUrl?: string;
}

export async function placeOrder(
  _token: string | null,
  payload: CheckoutPayload
): Promise<PlacedOrder> {
  return {
    orderId: 1002,
    orderNumber: "1002",
    orderKey: "wc_order_mockkey123",
    total: "$120.00",
    status: "PROCESSING",
    date: new Date().toISOString(),
    needsPayment: false,
  };
}

export async function fetchQuoteRequests(_token: string): Promise<any[]> {
  return [];
}

export async function submitQuoteRequest(
  _token: string,
  _payload: { product_name: string; quantity: number; notes: string }
): Promise<{ id: number }> {
  return { id: 5001 };
}

export async function submitMultiQuoteRequest(
  _token: string,
  _payload: {
    items: Array<{ name: string; quantity: number; price?: string }>;
    notes?: string;
  }
): Promise<{ id: number }> {
  return { id: 5002 };
}

export interface CustomerPrice {
  price: number | null;
  regularPrice: number | null;
  salePrice: number | null;
  currency: string;
}

export async function fetchCustomerPrices(
  _token: string,
  ids: number[]
): Promise<Record<string, CustomerPrice>> {
  const map: Record<string, CustomerPrice> = {};
  ids.forEach((id) => {
    map[String(id)] = {
      price: 120.0,
      regularPrice: 190.0,
      salePrice: 120.0,
      currency: "USD",
    };
  });
  return map;
}

export interface OrderStatus {
  orderNumber: string;
  status: string;
  isPaid: boolean;
  total: string;
  date: string;
  paymentMethodTitle: string;
  email: string;
  items: Array<{ name: string; quantity: number; total: string }>;
}

export async function getOrderStatus(order: string, _key: string): Promise<OrderStatus> {
  return {
    orderNumber: order,
    status: "COMPLETED",
    isPaid: true,
    total: "$120.00",
    date: new Date().toISOString(),
    paymentMethodTitle: "Credit Card",
    email: "tester@example.com",
    items: [
      { name: "MyZen Poppy & Lotus 6pk Tablet - Wild Cherry", quantity: 1, total: "$120.00" }
    ],
  };
}

export async function forgotPasswordRequest(_email: string) {
  return true;
}

export async function resetPasswordSubmit(_password: string) {
  return true;
}
