import { TextLink } from '../Links/Links.jsx';

export default function SectionHeading({ eyebrow, title, action }) {
  return (
    <header className="section-heading reveal">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {action && <TextLink to={action.to}>{action.label}</TextLink>}
    </header>
  );
}
