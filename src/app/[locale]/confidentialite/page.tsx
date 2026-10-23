import { redirect } from "@/i18n/navigation";
import { requireLocale } from "@/i18n/locale";

type Props = { params: Promise<{ locale: string }> };

/** The privacy policy now lives in the legal notice: old links land there. */
export default async function PrivacyPage({ params }: Props) {
  const { locale: raw } = await params;
  const locale = requireLocale(raw);
  redirect({ href: "/mentions-legales", locale });
}
