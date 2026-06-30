export function Flag({ code, alt }: { code?: string | null; alt: string }) {
  if (!code) {
    return <div className="h-5 w-7 rounded-sm bg-muted" aria-hidden />;
  }
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w80/${code.toLowerCase()}.png 2x`}
      width={28}
      height={20}
      alt={alt}
      loading="lazy"
      className="h-5 w-7 rounded-sm object-cover shadow-sm ring-1 ring-black/30"
    />
  );
}