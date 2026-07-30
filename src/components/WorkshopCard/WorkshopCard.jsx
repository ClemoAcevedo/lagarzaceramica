export default function WorkshopCard({ title, children }) {
  return (
    <article className="reveal">
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}
