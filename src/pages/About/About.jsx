import { useState } from 'react';
import CTA from '../../components/CTA/CTA.jsx';
import Gallery from '../../components/Gallery/Gallery.jsx';
import {
  footerMark,
  image158,
  image165,
  image166,
  image167,
  image175,
  image178,
  image179,
  image186,
  image186Improved,
  image189,
  processImage,
  processImage2,
} from '../../assets/media.js';
import usePageMeta from '../../hooks/usePageMeta.js';

const processSteps = [
  {
    title: 'Explorar',
    description: 'Una forma comienza en la observación, el dibujo y las pruebas de volumen.',
    image: image178,
    alt: 'Herramientas de cerámica reunidas sobre la mesa del taller',
  },
  {
    title: 'Modelar',
    description: 'Las manos construyen cada pieza y dejan en ella variaciones irrepetibles.',
    image: processImage,
    alt: 'Manos trabajando un bloque de arcilla húmeda',
  },
  {
    title: 'Esmaltar',
    description: 'Capas de color, textura y minerales transforman la superficie.',
    image: image175,
    alt: 'Pinceles del taller preparados para aplicar color y esmalte',
  },
  {
    title: 'Cocer',
    description: 'El horno completa el proceso y revela el carácter final del gres.',
    image: image179,
    alt: 'Piezas de arcilla cruda preparadas para la cocción',
  },
];

const initialProcessVisual = {
  title: 'Proceso artesanal',
  image: image186,
  alt: 'Lola trabajando con cerámica junto a la ventana del taller',
};

export default function About() {
  const [activeProcess, setActiveProcess] = useState(null);
  const activeProcessStep = activeProcess === null ? initialProcessVisual : processSteps[activeProcess];
  const processVisuals = [initialProcessVisual, ...processSteps];
  const activeVisual = activeProcess === null ? 0 : activeProcess + 1;

  usePageMeta(
    'Sobre La Garza — Cerámica en Valdivia',
    'La historia, filosofía y proceso artesanal del taller de cerámica La Garza en Valdivia.',
  );

  return (
    <main id="contenido">
      <section className="page-hero section">
        <img className="page-hero__background" src={image189} alt="" aria-hidden="true" />
        <div className="page-hero__copy">
          <p className="eyebrow">Sobre La Garza</p>
          <h1>Una manera<br />de mirar<br />el tiempo.</h1>
          <p className="page-hero__note">Taller de cerámica en gres<br />Valdivia, Chile</p>
        </div>
        <figure className="page-hero__image">
          <div className="page-hero__frame image-reveal">
            <img src={image165} alt="Lola, fundadora de La Garza, en su taller" fetchPriority="high" />
          </div>
          <figcaption>Lola · Fundadora y ceramista</figcaption>
        </figure>
      </section>

      <section className="story section section--sand">
        <div className="story__copy reveal">
          <p className="eyebrow">Nuestra historia</p>
          <h2>Una práctica hecha de tiempo y atención.</h2>
          <div className="story__body" data-content-status="provisional">
            <p>La Garza nace en Valdivia como un espacio de exploración en torno a la cerámica en gres. El taller reúne el oficio cotidiano y el deseo de crear objetos que permanezcan cerca.</p>
            <p>Cada colección se construye sin prisa. Las pequeñas variaciones de forma, tono y textura son parte esencial de las piezas: señales de un proceso humano que no busca repetirse de manera exacta.</p>
            <small>Texto provisional · pendiente de validación</small>
          </div>
        </div>
        <div className="story__images">
          <figure className="story__portrait image-reveal">
            <img
              src={image186Improved}
              alt="Lola seleccionando materiales junto a la ventana del taller"
              loading="lazy"
            />
          </figure>
          <figure className="story__materials image-reveal">
            <img
              src={image158}
              alt="Materiales y herramientas de cerámica dispuestos en el taller"
              loading="lazy"
            />
          </figure>
        </div>
      </section>

      <Gallery
        as="section"
        className="editorial-gallery section"
        images={[
          {
            src: image167,
            alt: 'Vista amplia del taller con su mesa central',
            className: 'editorial-gallery__wide',
            reveal: true,
          },
          {
            src: image166,
            alt: 'Retrato de Lola sonriendo dentro del taller',
            className: 'editorial-gallery__portrait',
            reveal: true,
          },
        ]}
      >
        <p className="editorial-gallery__caption">Un lugar de trabajo para observar, probar y volver a empezar.</p>
      </Gallery>

      <section className="philosophy section">
        <div className="philosophy__copy reveal">
          <p className="eyebrow">Filosofía</p>
          <h2>La belleza del proceso.</h2>
          <p>Cada pieza nace del encuentro entre la arcilla, las manos y el tiempo. Valoramos el proceso y el trabajo artesanal para crear objetos con identidad propia, capaces de aportar belleza, presencia y uso al entorno.</p>
        </div>
        <div className="philosophy__images">
          <figure className="philosophy__image philosophy__image--primary image-reveal">
            <img src={processImage2} alt="Manos afinando una pieza de arcilla con una herramienta" loading="lazy" />
          </figure>
          <figure className="philosophy__image philosophy__image--secondary image-reveal">
            <img src={processImage} alt="Manos trabajando un bloque de arcilla húmeda" loading="lazy" />
          </figure>
        </div>
      </section>

      <section className="process section">
        <header className="section-heading reveal">
          <div>
            <p className="eyebrow">Proceso artesanal</p>
            <h2>De la idea a la pieza.</h2>
          </div>
        </header>
        <div className="process__timeline" onMouseLeave={() => setActiveProcess(null)}>
          <p className="process__hint">
            <span className="process__hint--desktop">Recorre cada etapa con el cursor</span>
            <span className="process__hint--mobile">Toca una etapa para descubrirla</span>
          </p>
          <ol className="process-list">
            {processSteps.map(({ title, description }, index) => (
              <li className={activeProcess === index ? 'is-active' : ''} key={title}>
                <div
                  className="process-step"
                  tabIndex="0"
                  onMouseEnter={() => setActiveProcess(index)}
                  onFocus={() => setActiveProcess(index)}
                  onTouchStart={() => setActiveProcess(index)}
                >
                  <div className="process-step__heading">
                    <img className="process-step__icon" src={footerMark} alt="" aria-hidden="true" />
                    <h3>{title}</h3>
                  </div>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <figure className="process-visual">
          {processVisuals.map((step, index) => (
            <img
              className={activeVisual === index ? 'is-active' : ''}
              src={step.image}
              alt={activeVisual === index ? step.alt : ''}
              aria-hidden={activeVisual !== index}
              loading="lazy"
              key={step.title}
            />
          ))}
          <figcaption>{activeProcessStep.title}</figcaption>
        </figure>
      </section>

      <CTA
        eyebrow="Piezas hechas para durar"
        title="Conoce el trabajo del taller."
        action={{ to: '/piezas', label: 'Ver las piezas', light: true, arrow: true }}
      />
    </main>
  );
}
