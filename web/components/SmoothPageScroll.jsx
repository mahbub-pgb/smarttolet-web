"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Smoothly scrolls to the top when the `page` query param changes. Pagination
 * links opt out of Next's instant scroll (`scroll={false}`) so this animated
 * scroll is the only one that runs. Skips the initial mount.
 */
export default function SmoothPageScroll() {
  const searchParams = useSearchParams();
  const page = searchParams.get("page") || "1";
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  return null;
}
