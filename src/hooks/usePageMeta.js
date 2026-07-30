import { useEffect } from 'react';

function setMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export default function usePageMeta(title, description, { image } = {}) {
  useEffect(() => {
    const canonicalUrl = new URL(window.location.pathname, window.location.origin).href;
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }

    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    canonical.setAttribute('href', canonicalUrl);
    setMeta('property', 'og:locale', 'es_CL');
    setMeta('property', 'og:site_name', 'La Garza');
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonicalUrl);

    const existingImage = document.head.querySelector('meta[property="og:image"]');
    if (image) setMeta('property', 'og:image', new URL(image, window.location.origin).href);
    else existingImage?.remove();
  }, [description, image, title]);
}
