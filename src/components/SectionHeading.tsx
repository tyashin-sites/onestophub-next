interface SectionHeadingProps {
  eyebrow: string;
  title: string;
}

export default function SectionHeading({ eyebrow, title }: SectionHeadingProps) {
  return (
    <div className="mb-12 text-center">
      <p className="mb-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
      <h2 className="text-3xl font-semibold text-foreground md:text-4xl">{title}</h2>
      <div className="mx-auto mt-4 h-0.5 w-16 bg-accent" />
    </div>
  );
}
