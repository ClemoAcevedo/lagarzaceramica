import { TextLink } from '../Links/Links.jsx';

export default function Hero({ image, imageAlt, eyebrow, title, action, caption }) {
  return (
    <section className="hero">
      <div className="hero__content">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <TextLink to={action.to} light>{action.label}</TextLink>
      </div>
      <figure className="hero__figure">
        <img className="hero__media" src={image} alt={imageAlt} fetchPriority="high" />
        <figcaption className="hero__caption">{caption}</figcaption>
      </figure>
    </section>
  );
}
