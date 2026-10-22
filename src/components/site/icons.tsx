type P = { className?: string; size?: number };

export function ArrowRight({ className, size = 16 }: P) {
  return (
    <svg className={`arrow ${className ?? ""}`} width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M1 8h13M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function ArrowUpRight({ className, size = 14 }: P) {
  return (
    <svg className={`arrow ${className ?? ""}`} width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 11L11 3M4.5 3H11v6.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function ArrowLeft({ className, size = 16 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M15 8H2M7 3L2 8l5 5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function WhatsAppIcon({ className, size = 18 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.45 9.45 0 01-4.82-1.32l-.35-.21-3.58.94.96-3.49-.23-.36A9.43 9.43 0 012.6 12c0-5.21 4.24-9.45 9.45-9.45 2.52 0 4.9.98 6.68 2.77A9.39 9.39 0 0121.5 12c0 5.21-4.24 9.5-9.46 9.5zm8.05-17.5A11.32 11.32 0 0012.04.67C5.77.67.66 5.77.66 12.05c0 2.01.52 3.97 1.52 5.7L.57 23.33l5.71-1.5a11.36 11.36 0 005.76 1.47h.01c6.27 0 11.38-5.1 11.38-11.38 0-3.04-1.18-5.9-3.34-8.05z" />
    </svg>
  );
}

export function PhoneIcon({ className, size = 16 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M5 3h3.5l1.8 4.6-2.3 1.5a11 11 0 006 6l1.5-2.3L20 14.5V18a2 2 0 01-2 2A15 15 0 013 5a2 2 0 012-2z" />
    </svg>
  );
}

export function MailIcon({ className, size = 16 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" />
      <path d="M3 6l9 7 9-7" />
    </svg>
  );
}

export function SearchIcon({ className, size = 16 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L21 21" />
    </svg>
  );
}

export function CloseIcon({ className, size = 16 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M2 2l12 12M14 2L2 14" />
    </svg>
  );
}

/** Location pin as a surveyor's crosshair, used for the MMR marker. */
export function Crosshair({ className, size = 14 }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <circle cx="7" cy="7" r="3.5" />
      <path d="M7 0v4M7 10v4M0 7h4M10 7h4" />
    </svg>
  );
}
