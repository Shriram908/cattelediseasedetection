import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Keep metadata correct during navigation, including unknown URLs.
// Vercel also sends noindex headers for sign-in and protected routes.
export default function PageMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const isHome = pathname === "/";
    document.querySelector('meta[name="robots"]')?.setAttribute(
      "content", isHome ? "index, follow" : "noindex, follow",
    );
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (isHome) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = "https://cattlecareai.vercel.app/";
    } else {
      canonical?.remove();
    }
  }, [pathname]);

  return null;
}
