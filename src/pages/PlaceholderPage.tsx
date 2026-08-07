interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <section className="placeholder-page">
      <span className="eyebrow">
        CommunePilot v2
      </span>

      <h2>{title}</h2>

      <p>{description}</p>
    </section>
  );
}