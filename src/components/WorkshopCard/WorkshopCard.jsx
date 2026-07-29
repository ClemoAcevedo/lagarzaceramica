export default function WorkshopCard({ number, title, children }) {
  return (
    <article className="reveal">
      <span>{number}</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  );
}
