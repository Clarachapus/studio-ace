import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  /** "arch" masks the top as a half-circle; "flat" keeps a rectangle. */
  shape?: "arch" | "flat";
  aspect?: string;
};

export function ArchImage({
  src,
  alt,
  priority,
  sizes = "(min-width: 1024px) 33vw, 100vw",
  className = "",
  shape = "arch",
  aspect = "aspect-[4/5]",
}: Props) {
  return (
    <div className={`relative ${aspect} ${shape === "arch" ? "arch" : "overflow-hidden"} bg-ochre/20 ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}
