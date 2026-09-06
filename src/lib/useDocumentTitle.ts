"use client";

import { useEffect } from "react";

/**
 * Sets the browser tab title for client-component pages (Next.js `metadata`
 * exports only work from Server Components, and most pages here are client
 * components because of their interactivity).
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · Billing ERP`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
