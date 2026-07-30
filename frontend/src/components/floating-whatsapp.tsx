import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MessageCircle, X, Send } from "lucide-react";
import { brand } from "@/data/brand";

const chips = ["Get a Custom Quote", "Web Development Price", "School/Hospital ERP Inquiry"];

export function FloatingWhatsApp() {
  const [open, setOpen] = useState(false);
  const waLink = (msg: string) => `https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(msg)}`;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-40 w-[92vw] max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#25D366] grid place-items-center">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">Netweavesolutions</div>
                <div className="text-[11px] text-white/80 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Typically replies in minutes
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-full p-1 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22><circle cx=%2230%22 cy=%2230%22 r=%221%22 fill=%22%23e5e7eb%22/></svg>')] bg-muted/30 space-y-3">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-card border border-border px-3 py-2 text-sm text-foreground shadow-sm">
                Hi there 👋 How can we help you today?
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-card border border-border px-3 py-2 text-xs text-muted-foreground shadow-sm">
                Pick a quick option or type your query.
              </div>
            </div>

            <div className="p-3 border-t border-border space-y-2 bg-card">
              <div className="flex flex-wrap gap-2">
                {chips.map((c) => (
                  <a
                    key={c}
                    href={waLink(c)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors"
                  >
                    {c}
                  </a>
                ))}
              </div>
              <a
                href={waLink("Hi Netweavesolutions, I'd like to discuss a project.")}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-sm py-2.5 transition-colors"
              >
                <Send className="h-4 w-4" /> Start Chat on WhatsApp
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-glow hover:scale-110 transition-transform"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <>
            <span className="absolute inset-0 rounded-full animate-ping bg-[#25D366] opacity-30" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
          </>
        )}
      </button>
    </>
  );
}

