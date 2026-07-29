import { ButtonLink } from '../Links/Links.jsx';

export default function CTA({ eyebrow, title, description, action }) {
  return (
    <section className="cta section">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      <ButtonLink {...action}>{action.label}</ButtonLink>
    </section>
  );
}
