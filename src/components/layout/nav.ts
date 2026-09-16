export type NavIcon = "cactus" | "arch" | "stairs";
export type NavHref = "/sculptures" | "/projets" | "/a-propos";

/** The three sections of the site, in the order visitors see them everywhere. */
export const NAV_ITEMS: { href: NavHref; key: "sculptures" | "projects" | "about"; icon: NavIcon }[] = [
  { href: "/sculptures", key: "sculptures", icon: "cactus" },
  { href: "/projets", key: "projects", icon: "arch" },
  { href: "/a-propos", key: "about", icon: "stairs" },
];

export const isNavActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
