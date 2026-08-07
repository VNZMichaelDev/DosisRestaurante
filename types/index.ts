export type OrderStatus =
  | "pendiente"
  | "en_preparacion"
  | "en_camino"
  | "entregado"
  | "cancelado";

export type CategoryId =
  | "cachapas"
  | "burgers"
  | "perros"
  | "parrilla"
  | "bebidas";

export type TagKind = "best" | "popular" | "save" | "new";

export interface MenuItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  rating: number;
  reviews: string;
  icon: "cachapa" | "burger" | "hotdog" | "papas" | "parrilla" | "bebida";
  category: CategoryId;
  tag?: TagKind;
  tagLabel?: string;
  image_url?: string;
}

export interface CartItem extends MenuItem {
  qty: number;
}

export interface Profile {
  id: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  items: { id: string; name: string; price: number; qty: number }[];
  total: number;
  payment_phone: string;
  payment_reference: string;
  delivery_type?: "delivery" | "retiro" | null;
  delivery_address?: string | null;
  delivery_reference?: string | null;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface SavedAddress {
  id: string;
  user_id: string;
  label: string;
  address: string;
  reference?: string | null;
  created_at: string;
}
