"use client";

import { useEffect } from "react";

export function ServicesHashScroll() {
  useEffect(() => {
    const scrollToBook = () => {
      if (typeof window === "undefined") return;
      if (window.location.hash !== "#book") return;
      requestAnimationFrame(() => {
        document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };
    scrollToBook();
    window.addEventListener("hashchange", scrollToBook);
    return () => window.removeEventListener("hashchange", scrollToBook);
  }, []);
  return null;
}
