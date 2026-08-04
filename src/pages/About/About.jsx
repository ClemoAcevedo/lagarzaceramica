import { useState } from 'react';
import CTA from '../../components/CTA/CTA.jsx';
import Gallery from '../../components/Gallery/Gallery.jsx';
import LoadingImage from '../../components/LoadingImage/LoadingImage.jsx';
import {
  footerMark,
  image158,
  image165,
  image166,
  image167,
  image186Improved,
  image189,
  processImage,
  processImage2,
  processExplore,
  processFire,
  processGlaze,
  processModel,
  processCraft,
} from '../../assets/media.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { pageStructuredData } from '../../lib/seo.js';

const processSteps = [
  {
    order: 'Primero',
    title: 'Explorar',
    description: 'El proceso comienza eligiendo la arcilla según su color, textura y las posibilidades que ofrece para cada pieza.',
    image: processExplore,
    alt: 'Muestras de distintas arcillas reunidas durante la exploración de materiales',
  },
  {
    order: 'Luego',
    title: 'Modelar',
    description: 'Las manos construyen cada pieza y dejan en ella variaciones irrepetibles.',
    image: processModel,
    alt: 'Manos modelando vasos de arcilla en el taller',
  },
  {
    order: 'Después',
    title: 'Esmaltar',
    description: 'Capas de color, textura y minerales transforman la superficie.',
    image: processGlaze,
    alt: 'Pieza de cerámica sumergida en esmalte líquido',
  },
  {
    order: 'Finalmente',
    title: 'Cocer',
    description: 'El horno completa el proceso y revela el carácter final del gres.',
    image: processFire,
    alt: 'Piezas de cerámica acomodadas dentro del horno para su cocción',
  },
];

const initialProcessVisual = {
  title: 'Proceso artesanal',
  image: processCraft,
  alt: 'Distintas etapas de transformación de la arcilla dispuestas en secuencia',
};

export default function About() {
  const [activeProcess, setActiveProcess] = useState(null);
  const activeProcessStep = activeProcess === null ? initialProcessVisual : processSteps[activeProcess];
  const processVisuals = [initialProcessVisual, ...processSteps];
  const activeVisual = activeProcess === null ? 0 : activeProcess + 1;

  usePageMeta(
    'Sobre La Garza — Cerámica en Valdivia',
    'La historia, filosofía y proceso artesanal del taller de cerámica La Garza en Valdivia.',
    { image: image165, imageAlt: 'Lola, fundadora de La Garza, en su taller', structuredData: pageStructuredData({ type: 'AboutPage', name: 'Sobre La Garza', description: 'La historia, filosofía y proceso artesanal del taller de cerámica La Garza en Valdivia.', path: 'sobre-la-garza', image: image165 }) },
  );

  return (
    <main id="contenido" className="page-enter">
      <section className="page-hero section">
        <img className="page-hero__background" src={image189} alt="" aria-hidden="true" />
        <div className="page-hero__copy">
          <p className="eyebrow">Sobre La Garza</p>
          <h1>Una&nbsp;manera<br />de mirar<br />el tiempo.</h1>
          <p className="page-hero__note">Taller de cerámica en gres<br />Valdivia, Chile</p>
        </div>
        <figure className="page-hero__image">
          <div className="page-hero__frame image-reveal">
            <LoadingImage src={image165} alt="Lola, fundadora de La Garza, en su taller" fetchPriority="high" />
          </div>
          <figcaption>Lola · Fundadora y ceramista</figcaption>
        </figure>
      </section>

      <section className="story section section--sand">
        <div className="story__copy reveal">
          <p className="eyebrow">Nuestra historia</p>
          <h2>Una práctica hecha de tiempo y atención.</h2>
          <div className="story__body">
            <p>La Garza nace en Valdivia como un espacio de exploración en torno a la cerámica en gres. El taller reúne el oficio cotidiano y el deseo de crear objetos que permanezcan cerca.</p>
            <p>Cada colección se construye sin prisa. Las pequeñas variaciones de forma, tono y textura son parte esencial de las piezas: señales de un proceso humano que no busca repetirse de manera exacta.</p>
          </div>
        </div>
        <div className="story__images">
          <figure className="story__portrait image-reveal">
            <LoadingImage
              src={image186Improved}
              alt="Lola seleccionando materiales junto a la ventana del taller"
              loading="lazy"
            />
          </figure>
          <figure className="story__materials image-reveal">
            <LoadingImage
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
            <LoadingImage src={processImage2} alt="Manos afinando una pieza de arcilla con una herramienta" loading="lazy" />
          </figure>
          <figure className="philosophy__image philosophy__image--secondary image-reveal">
            <LoadingImage src={processImage} alt="Manos trabajando un bloque de arcilla húmeda" loading="lazy" />
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
            {processSteps.map(({ order, title, description }, index) => (
              <li className={activeProcess === index ? 'is-active' : ''} key={title}>
                {index === 0 && (
                  <img
                    className={`process-timeline__bird${activeProcess === null ? ' is-idle' : ''}`}
                    src={footerMark}
                    alt=""
                    aria-hidden="true"
                    style={{
                      '--bird-offset': activeProcess === null ? '0rem' : `${2.9 + activeProcess * 5.8}rem`,
                    }}
                  />
                )}
                <div
                  className="process-step"
                  tabIndex="0"
                  onMouseEnter={() => setActiveProcess(index)}
                  onFocus={() => setActiveProcess(index)}
                  onTouchStart={() => setActiveProcess(index)}
                >
                  <div className="process-step__heading">
                    <span className="process-step__node" aria-hidden="true" />
                    <div>
                      <span className="process-step__order">{order}</span>
                      <h3>{title}</h3>
                    </div>
                  </div>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <figure className="process-visual">
          {processVisuals.map((step, index) => (
            <LoadingImage
              className={activeVisual === index ? 'is-active' : ''}
              src={step.image}
              alt={activeVisual === index ? step.alt : ''}
              aria-hidden={activeVisual !== index}
              loading="lazy"
              key={step.title}
            />
          ))}
          {activeProcess !== null && <figcaption>{activeProcessStep.title}</figcaption>}
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
