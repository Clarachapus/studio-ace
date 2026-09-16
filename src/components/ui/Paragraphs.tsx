/** Renders plain text with blank-line paragraph breaks; first paragraph gets a drop cap when asked. */
export function Paragraphs({ text, dropcap = false }: { text: string; dropcap?: boolean }) {
  const parts = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => (
        <p key={i} className={dropcap && i === 0 ? "dropcap" : undefined}>
          {p}
        </p>
      ))}
    </>
  );
}
