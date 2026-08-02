import { useState } from 'react';
import CTA from '../../components/CTA/CTA.jsx';
import { ButtonLink } from '../../components/Links/Links.jsx';
import SectionHeading from '../../components/SectionHeading/SectionHeading.jsx';
import {
  footerMark,
  image57,
  image113,
  image123,
  image166,
  image176,
  image189,
  workshopIntroBackground,
} from '../../assets/media.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { whatsappUrl } from '../../utils/links.js';

const workshopInfoUrl = whatsappUrl('Hola La Garza, quisiera recibir información sobre los talleres.');
const workshopSignupUrl = whatsappUrl('Hola La Garza, quisiera inscribirme en un taller.');

const methodPoints = [
  {
    title: 'Conocer la materia',
    description: 'Comenzamos con sus propiedades, herramientas y posibilidades.',
    image: image123,
    alt: 'Vasos de gres modelados a mano sobre una bandeja',
  },
  {
    title: 'Modelar a mano',
    description: 'Exploramos técnicas de construcción manual y terminaciones.',
    image: image57,
    alt: 'Detalle de platos de gres apilados',
  },
  {
    title: 'Dar identidad',
    description: 'Trabajamos forma, textura y color para que cada pieza sea personal.',
    image: image113,
    alt: 'Cuencos de gres esmaltados y apilados',
  },
];

const participationInfo = [
  ['El encuentro', 'Los talleres son presenciales en Valdivia, en grupos pequeños y con acompañamiento cercano durante la práctica.'],
  ['Lo que necesitas', 'No necesitas experiencia previa. Los materiales y herramientas están incluidos; solo recomendamos venir con ropa cómoda.'],
  ['Después de modelar', 'Tu pieza permanece en el taller para completar el secado, esmaltado y la cocción. Al comenzar te explicaremos el plazo de entrega.'],
  ['Fechas, valores y reserva', 'El calendario y los cupos se actualizan periódicamente. Puedes consultar la próxima fecha y reservar directamente por WhatsApp.'],
];

export default function Workshops() {
  const [activeMethod, setActiveMethod] = useState(null);

  usePageMeta(
    'Talleres de cerámica — La Garza',
    'Talleres de cerámica en gres de La Garza en Valdivia. Aprende, experimenta y crea con tus manos.',
    { image: image189 },
  );

  return (
    <main id="contenido" className="page-enter">
      <section className="workshops-hero">
        <div className="workshops-hero__copy reveal">
          <p className="eyebrow">Talleres en Valdivia</p>
          <h1><span>Tiempo para</span><br />hacer con<br />las manos.</h1>
          <p>Una experiencia cercana para conocer la cerámica desde la materia, el gesto y la experimentación.</p>
          <ButtonLink href={workshopInfoUrl}>Consultar próximos encuentros</ButtonLink>
        </div>
        <figure className="workshops-hero__media">
          <div className="workshops-hero__image workshops-hero__image--primary image-reveal">
            <img src={image189} alt="Estanterías del taller con piezas de cerámica en proceso" fetchPriority="high" />
          </div>
          <div className="workshops-hero__image workshops-hero__image--detail image-reveal">
            <img src={image176} alt="Detalle de herramientas de modelado en el taller" fetchPriority="high" />
          </div>
          <figcaption>Taller y herramientas · Valdivia</figcaption>
        </figure>
      </section>

      <section className="workshop-intro section">
        <img
          className="workshop-intro__background"
          src={workshopIntroBackground}
          alt=""
          aria-hidden="true"
          loading="lazy"
        />
        <div className="workshop-intro__heading reveal">
          <p className="eyebrow">La experiencia</p>
          <h2>
            <span>Descubre la magia</span>
            <span>del gres en</span>
            <span>nuestro taller.</span>
          </h2>
        </div>
        <div className="workshop-intro__body reveal">
          <p>Los talleres de La Garza están pensados para descubrir el gres en un ambiente acogedor y grupos pequeños. No necesitas experiencia previa: acompañamos cada etapa para que explores con libertad y construyas una pieza propia.</p>
        </div>
      </section>

      <section className="process method section">
        <SectionHeading
          eyebrow="Metodología"
          title={<><span>Una práctica</span><br /><span>guiada y personal</span></>}
        />
        <div className="method__points" onMouseLeave={() => setActiveMethod(null)}>
          <p className="process__hint">
            <span className="process__hint--desktop">Explora cada aspecto con el cursor</span>
            <span className="process__hint--mobile">Toca un aspecto para descubrirlo</span>
          </p>
          <ul className="method-list">
            {methodPoints.map(({ title, description }, index) => (
              <li className={activeMethod === index ? 'is-active' : ''} key={title}>
                <div
                  className="method-point"
                  tabIndex="0"
                  onMouseEnter={() => setActiveMethod(index)}
                  onFocus={() => setActiveMethod(index)}
                  onTouchStart={() => setActiveMethod(index)}
                >
                  <div className="method-point__heading">
                    <span className="method-point__marker" aria-hidden="true">
                      <img src={footerMark} alt="" />
                    </span>
                    <h3>{title}</h3>
                  </div>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <figure className={`process-visual method-visual ${activeMethod === null ? 'is-overview' : 'is-detail'}`}>
          <img
            className={activeMethod === null ? 'is-active' : ''}
            src={image166}
            alt={activeMethod === null ? 'Vista general del taller de La Garza en Valdivia' : ''}
            aria-hidden={activeMethod !== null}
            loading="lazy"
          />
          {methodPoints.map((point, index) => (
            <img
              className={activeMethod === index ? 'is-active' : ''}
              src={point.image}
              alt={activeMethod === index ? point.alt : ''}
              aria-hidden={activeMethod !== index}
              loading="lazy"
              key={point.title}
            />
          ))}
          {activeMethod !== null && <figcaption>{methodPoints[activeMethod].title}</figcaption>}
        </figure>
      </section>

      <section className="workshop-guide section">
        <div className="workshop-guide__heading">
          <p className="eyebrow">Información para participar</p>
          <h2>Lo esencial antes de venir al taller.</h2>
          <p>Información práctica para que solo tengas que concentrarte en crear.</p>
        </div>
        <div className="workshop-guide__content">
          <div className="accordion workshop-guide__accordion">
            {participationInfo.map(([topic, detail], index) => (
              <details key={topic} open={index === 0 || undefined}>
                <summary>{topic}<span>+</span></summary>
                <p>{detail}</p>
              </details>
            ))}
          </div>
          <ButtonLink href={workshopInfoUrl}>Consultar próximos encuentros</ButtonLink>
        </div>
      </section>

      <CTA
        eyebrow="Próximos encuentros"
        title="Reserva un lugar en nuestro taller."
        description="Consulta fechas, valores y disponibilidad directamente con La Garza."
        action={{ href: workshopSignupUrl, label: 'Inscribirme por WhatsApp', light: true, arrow: true }}
      />
    </main>
  );
}
