/** Digits only, keeping no "+" (wa.me wants the full number without it). */
function digits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** A `tel:` link for the Call buttons, e.g. "tel:+250788123456". */
export function telLink(phone: string): string {
  return `tel:+${digits(phone)}`;
}

/**
 * Free WhatsApp click-to-chat link with a prefilled message (D-020, D-044).
 * The number must include the country code, e.g. "+250 788 123 456".
 */
export function whatsAppLink(phone: string, message?: string): string {
  const base = `https://wa.me/${digits(phone)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
