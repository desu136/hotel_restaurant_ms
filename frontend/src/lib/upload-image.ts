import { withBasePath } from "@/lib/base-path";

const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadImage(file: File): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5MB or smaller");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(withBasePath("/api/upload/image"), {
    method: "POST",
    body: formData,
  });

  let data: { success?: boolean; error?: string; data?: { url?: string } } = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  const url = data?.data?.url;
  if (!res.ok || !data.success || !url) {
    throw new Error(data.error || "Failed to upload image");
  }
  return url;
}
