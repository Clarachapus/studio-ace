"use client";

import { useEffect } from "react";

/** Sets <html lang> from the locale segment (root layout is shared by both locales). */
export function LangAttribute({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
