"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { WhatsAppIcon } from "./icons";
import { whatsappHref, whatsappMessage } from "@/lib/contact";

/**
 * Single floating WhatsApp action. Steps aside while the quote form or
 * contact block is on screen so it never covers form controls; picks up the
 * current product (data-wa-product) to prefill the message.
 */
export function WhatsAppFloat({ number }: { number: string }) {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [product, setProduct] = useState<string | undefined>();

  useEffect(() => {
    setProduct(document.querySelector<HTMLElement>("[data-wa-product]")?.dataset.waProduct);
    const targets = document.querySelectorAll("[data-hide-float]");
    if (!targets.length) {
      setHidden(false);
      return;
    }
    const visible = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
        setHidden(visible.size > 0);
      },
      { threshold: 0.05 },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [pathname]);

  return (
    <a
      href={whatsappHref(number, whatsappMessage(product))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={product ? `Enquire about ${product} on WhatsApp` : "Chat with SHILPKAR on WhatsApp"}
      className={clsx(
        "group fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30 flex h-13 items-center overflow-hidden bg-ink text-paper shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] ring-1 ring-paper/10 transition-all duration-500 sm:right-6 sm:bottom-6",
        hidden ? "pointer-events-none translate-y-4 opacity-0" : "opacity-100",
      )}
      tabIndex={hidden ? -1 : 0}
    >
      <span className="grid h-13 w-13 place-items-center bg-[#25D366] text-ink">
        <WhatsAppIcon size={22} />
      </span>
      <span className="label hidden max-w-0 overflow-hidden whitespace-nowrap transition-[max-width,padding] duration-500 ease-out group-hover:max-w-56 group-hover:px-4 group-focus-visible:max-w-56 group-focus-visible:px-4 md:block">
        {product ? `Ask about ${product}` : "WhatsApp enquiry"}
      </span>
    </a>
  );
}
