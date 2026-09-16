import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Section } from "@/components/ui/Section";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <Section mood="brut" className="pt-10 lg:pt-16 min-h-[70svh] flex items-center">
      <div className="text-center mx-auto">
        <div className="brand-logo" style={{ width: "4rem" }} role="img" aria-label="studio a.c.e" />
        <h1 className="mt-8 text-5xl lg:text-7xl">{t("title")}</h1>
        <p className="mt-4 text-fg-soft">{t("text")}</p>
        <Link href="/" className="mt-10 inline-block text-xs uppercase tracking-[0.22em] underline underline-offset-8 decoration-ochre">{t("home")}</Link>
      </div>
    </Section>
  );
}
