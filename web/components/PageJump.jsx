"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * "Go to page" input. Navigates to the typed page number while preserving the
 * current filters/sort in the query string. Clamps to [1, totalPages].
 */
export default function PageJump({ totalPages, currentPage }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(String(currentPage));

  const go = (e) => {
    e.preventDefault();
    let n = parseInt(value, 10);
    if (Number.isNaN(n)) return;
    n = Math.min(Math.max(1, n), totalPages);

    const params = new URLSearchParams(searchParams.toString());
    if (n > 1) params.set("page", String(n));
    else params.delete("page");
    const qs = params.toString();
    // scroll:false lets SmoothPageScroll handle the (animated) scroll to top.
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <form className="page-jump" onSubmit={go}>
      <label htmlFor="page-jump-input">Go to</label>
      <input
        id="page-jump-input"
        type="number"
        min={1}
        max={totalPages}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label={`Page number, 1 to ${totalPages}`}
      />
      <span className="muted">/ {totalPages}</span>
      <button className="btn btn-ghost sm" type="submit">
        Go
      </button>
    </form>
  );
}
