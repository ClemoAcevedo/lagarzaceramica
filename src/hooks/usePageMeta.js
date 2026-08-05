import { useEffect } from 'react';
import { businessStructuredData } from '../lib/seo.js';

function setMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export default function usePageMeta(title, description, {
  image,
  imageAlt,
  type = 'website',
  robots = 'index,follow,max-image-preview:large',
  structuredData = [],
} = {}) {
  useEffect(() => {
    const canonicalUrl = new URL(window.location.pathname, window.location.origin).href;
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }

    document.title = title;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', robots);
    canonical.setAttribute('href', canonicalUrl);
    setMeta('property', 'og:locale', 'es_CL');
    setMeta('property', 'og:site_name', 'La Garza');
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonicalUrl);

    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);

    const imageUrl = image ? new URL(image, window.location.origin).href : null;
    for (const [attribute, key] of [['property', 'og:image'], ['name', 'twitter:image']]) {
      const existing = document.head.querySelector(`meta[${attribute}="${key}"]`);
      if (imageUrl) setMeta(attribute, key, imageUrl);
      else existing?.remove();
    }
    if (imageUrl && imageAlt) {
      setMeta('property', 'og:image:alt', imageAlt);
      setMeta('name', 'twitter:image:alt', imageAlt);
    } else {
      document.head.querySelector('meta[property="og:image:alt"]')?.remove();
      document.head.querySelector('meta[name="twitter:image:alt"]')?.remove();
    }

    let jsonLd = document.head.querySelector('script[data-la-garza-json-ld]');
    if (!jsonLd) {
      jsonLd = document.createElement('script');
      jsonLd.type = 'application/ld+json';
      jsonLd.dataset.laGarzaJsonLd = '';
      document.head.appendChild(jsonLd);
    }
    const pageData = (Array.isArray(structuredData) ? structuredData : [structuredData]).filter(Boolean);
    jsonLd.textContent = JSON.stringify([businessStructuredData(), ...pageData]);
    document.head.querySelectorAll('script[data-la-garza-snapshot]').forEach((snapshot) => snapshot.remove());
  }, [description, image, imageAlt, robots, structuredData, title, type]);
}
