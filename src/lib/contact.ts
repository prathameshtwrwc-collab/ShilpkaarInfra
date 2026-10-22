// Client-safe helpers for contact actions. Values come from site settings,
// with these as fallbacks so links never break.

export const DEFAULT_CONTACT = {
  phoneDisplay: "+91 98765 43210",
  phoneTel: "+919876543210",
  whatsapp: "919876543210",
  email: "pintus781@gmail.com",
  serviceArea: "Mumbai Metropolitan Region and surrounding areas, subject to project requirements.",
};

export type ContactInfo = typeof DEFAULT_CONTACT;

export function whatsappHref(number: string, message?: string) {
  const digits = number.replace(/\D/g, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

export function whatsappMessage(material?: string) {
  return material
    ? `Hello SHILPKAR, I'd like a quote for ${material}. Project location: `
    : "Hello SHILPKAR, I'd like to discuss material supply / transportation for my project.";
}

export function telHref(tel: string) {
  return `tel:${tel.replace(/[^\d+]/g, "")}`;
}
