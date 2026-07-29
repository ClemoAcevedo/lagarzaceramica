import { Link } from 'react-router-dom';

function LinkContent({ children, arrow }) {
  return (
    <>
      {children}
      {arrow && <> <span>↗</span></>}
    </>
  );
}

export function TextLink({ to, href, light = false, arrow = true, children }) {
  const className = `text-link${light ? ' text-link--light' : ''}`;

  if (to) {
    return (
      <Link className={className} to={to}>
        <LinkContent arrow={arrow}>{children}</LinkContent>
      </Link>
    );
  }

  return (
    <a className={className} href={href} target="_blank" rel="noopener">
      <LinkContent arrow={arrow}>{children}</LinkContent>
    </a>
  );
}

export function ButtonLink({ to, href, light = false, arrow = false, children }) {
  const className = `button${light ? ' button--light' : ''}`;

  if (to) {
    return <Link className={className} to={to}><LinkContent arrow={arrow}>{children}</LinkContent></Link>;
  }

  return (
    <a className={className} href={href} target="_blank" rel="noopener">
      <LinkContent arrow={arrow}>{children}</LinkContent>
    </a>
  );
}
