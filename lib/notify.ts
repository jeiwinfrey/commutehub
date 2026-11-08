"use client";

import { sileo } from "sileo";

export async function ensurePermission() {
  if (typeof Notification === "undefined") return "denied" as const;
  if (Notification.permission === "default") return Notification.requestPermission();
  return Notification.permission;
}

/** Fires once per `key` per day through the service worker (falls back to Notification). */
export async function notifyOnce(key: string, title: string, body: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const stamp = `${key}:${new Date().toDateString()}`;
  try {
    if (localStorage.getItem(stamp)) return;
    localStorage.setItem(stamp, "1");
  } catch {}
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(title, { body, icon: "/icon-192" });
    else new Notification(title, { body });
  } catch {
    // some mobile browsers only allow notifications through a service worker; the in-app toast still shows
  }
}

/** In-app toast, once per `key` per day (arrival alerts use a unique key, so they always show). */
export function toastOnce(key: string, kind: "success" | "warning" | "info", title: string, description: string) {
  const stamp = `toast:${key}:${new Date().toDateString()}`;
  try {
    if (localStorage.getItem(stamp)) return;
    localStorage.setItem(stamp, "1");
  } catch {}
  sileo[kind]({ title, description, duration: 7000 });
}
