import type { Locale } from "@/i18n/config";

export type Role = "client" | "admin";

export interface User {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  locale: Locale;
  notes: string;
  created_at: string;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  duration_min: number;
  price: number;
  active: number;
}

export type AppointmentStatus = "booked" | "completed" | "cancelled" | "no_show";

export interface Appointment {
  id: number;
  client_id: number;
  service_id: number;
  start_at: string; // "YYYY-MM-DDTHH:mm" local time
  end_at: string;
  status: AppointmentStatus;
  notes: string;
  service_name: string;
  price: number;
  duration_min: number;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
}

export interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string;
  locale: Locale;
  created_at: string;
  has_account: number;
  visits?: number;
  last_visit?: string | null;
  appointments?: Appointment[];
}

export interface Availability {
  date: string;
  open: boolean;
  hours?: { open: string; close: string };
  slots: string[];
}

export type OpeningHours = Record<string, { open: string; close: string } | null>;
