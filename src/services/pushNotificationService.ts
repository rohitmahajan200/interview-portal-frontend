// src/services/pushNotificationService.ts

export type RecipientType = "candidate" | "org";

class PushNotificationService {
  private vapidPublicKey: string;
  private apiBaseUrl: string;
  private swRegistration: ServiceWorkerRegistration | null;
  public isSupported: boolean;
  private recipientType: RecipientType;

  constructor() {
    this.vapidPublicKey =
      "BJvKh_bDN7XFg3NlDo8kpFJXUyi8QXwBSqwfG4tD82FNMECKjX1he_xAi1_RyvCkfxR3ar1cQo1PQ98KHWVu040";
    this.apiBaseUrl = import.meta.env.VITE_API_URL;
    this.swRegistration = null;
    this.isSupported = this.checkSupport();

    // Infer user type from URL once (you can override with setRecipientType)
    this.recipientType = location.pathname.startsWith("/org") ? "org" : "candidate";
  }

  /** Change which API namespace to use at runtime */
  public setRecipientType(type: RecipientType): void {
    this.recipientType = type;
  }
  public getRecipientType(): RecipientType {
    return this.recipientType;
  }

  private checkSupport(): boolean {
    return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  }

  /** Make the correct API path for the current recipient type */
  private path(action: "subscribe" | "unsubscribe" | "test"): string {
    const base = this.recipientType === "candidate" ? "candidates" : "org";
    return `${this.apiBaseUrl}/${base}/push/${action}`;
  }

  async initializeServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!this.isSupported) {
      throw new Error("Push notifications are not supported in this browser");
    }
    this.swRegistration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return this.swRegistration!;
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) throw new Error("Notifications not supported");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Notification permission not granted");
    return true;
  }

  // Return ArrayBuffer (clean BufferSource type for TS)
  private base64ToArrayBuffer(base64String: string): ArrayBuffer {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out.buffer;
  }

  private base64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}


  /** Subscribe and POST the subscription to the correct API (candidate/org) */
  async subscribe(): Promise<PushSubscription> {
    if (!this.swRegistration) await this.initializeServiceWorker();
    await this.requestPermission();

    const subscription = await this.swRegistration!.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.base64ToArrayBuffer(this.vapidPublicKey),
    });

    const resp = await fetch(this.path("subscribe"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Client-Type": "web" },
      credentials: "include",
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        deviceId: this.getDeviceId(),
      }),
    });
    if (!resp.ok) throw new Error(`Failed to register subscription: ${resp.statusText}`);
    return subscription;
  }

  /** Unsubscribe and POST removal to the correct API (candidate/org) */
  async unsubscribe(): Promise<boolean> {
    if (!this.swRegistration) await this.initializeServiceWorker();
    const sub = await this.swRegistration!.pushManager.getSubscription();
    if (!sub) return false;

    await sub.unsubscribe();
    await fetch(this.path("unsubscribe"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Client-Type": "web" },
      credentials: "include",
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
    return true;
  }

  async isSubscribed(): Promise<boolean> {
    if (!this.swRegistration) await this.initializeServiceWorker();
    return !!(await this.swRegistration!.pushManager.getSubscription());
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.swRegistration) await this.initializeServiceWorker();
    return await this.swRegistration!.pushManager.getSubscription();
  }

  async getSubscriptionStatus(): Promise<boolean> {
    if (!this.isSupported) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  }

  async sendTestNotification(): Promise<{ success: boolean; message: string }> {
    const resp = await fetch(this.path("test"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Client-Type": "web" },
      credentials: "include",
    });
    if (!resp.ok) throw new Error(`Test notification failed: ${resp.statusText}`);
    return (await resp.json()) as { success: boolean; message: string };
  }

  private getDeviceId(): string {
    let id = localStorage.getItem("deviceId");
    if (!id) {
      id = `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem("deviceId", id);
    }
    return id;
  }

  getPermissionStatus(): NotificationPermission | "unsupported" {
    if (!this.isSupported) return "unsupported";
    return Notification.permission;
  }
}

export const pushNotificationService = new PushNotificationService();

/** Named helper that mirrors your earlier snippet */
export const getSubscriptionStatus = async (): Promise<boolean> => {
  if (!pushNotificationService.isSupported) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (err) {
        return false;
  }
};

export default pushNotificationService;
