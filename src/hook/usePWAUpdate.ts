import { useState, useEffect } from "react";
import { toast } from "sonner";

export function usePWAUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);

        // Check for updates every 60 minutes
        const checkUpdate = () => reg.update();
        checkUpdate();
        const interval = setInterval(checkUpdate, 60 * 60 * 1000);

        // Listen for new service worker
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
              toast.info("Update tersedia!", {
                description: "Muat ulang halaman untuk mendapatkan versi terbaru.",
                action: {
                  label: "Muat Ulang",
                  onClick: () => window.location.reload(),
                },
                duration: 10000,
              });
            }
          });
        });

        return () => clearInterval(interval);
      });
    }
  }, []);

  const applyUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
  };

  return { updateAvailable, applyUpdate };
}
