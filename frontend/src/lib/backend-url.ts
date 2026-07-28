export function getBackendUrl(): string {
  let url = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://hospitalityhub-backend.onrender.com";
  if (process.env.NODE_ENV === "production" && (url.includes("localhost") || url.includes("127.0.0.1"))) {
    url = "https://hospitalityhub-backend.onrender.com";
  }
  return url.replace(/\/$/, "");
}
