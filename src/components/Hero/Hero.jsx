import { TextLink } from '../Links/Links.jsx';
import LoadingImage from '../LoadingImage/LoadingImage.jsx';

export default function Hero({ image, imageAlt, subtitle, title, action, caption }) {
  return (
    <section className="hero">
      <div className="hero__content">
        <div className="hero__copy">
          <h1>{title}</h1>
          <p className="hero__subtitle">{subtitle}</p>
        </div>
        <TextLink to={action.to}>{action.label}</TextLink>
      </div>
      <figure className="hero__figure">
        <LoadingImage className="hero__media" src={image} alt={imageAlt} fetchPriority="high" />
        <figcaption className="hero__caption">{caption}</figcaption>
      </figure>
    </section>
  );
}
