import CTA from '../../components/CTA/CTA.jsx';
import Gallery from '../../components/Gallery/Gallery.jsx';
import { ButtonLink } from '../../components/Links/Links.jsx';
import SectionHeading from '../../components/SectionHeading/SectionHeading.jsx';
import WorkshopCard from '../../components/WorkshopCard/WorkshopCard.jsx';
import { image168, image174, image180, image186 } from '../../assets/media.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { whatsappUrl } from '../../utils/links.js';

const workshopInfoUrl = whatsappUrl('Hola La Garza, quisiera recibir información sobre los talleres.');
const workshopSignupUrl = whatsappUrl('Hola La Garza, quisiera inscribirme en un taller.');

const methodSteps = [
  ['01', 'Conocer la materia', 'Comenzamos con sus propiedades, herramientas y posibilidades.'],
  ['02', 'Modelar a mano', 'Exploramos técnicas de construcción manual y terminaciones.'],
  ['03', 'Dar identidad', 'Trabajamos forma, textura y color para que cada pieza sea personal.'],
];

const workshopDetails = [
  ['Experiencia', 'No se requiere experiencia previa.'],
  ['Modalidad', 'Encuentros presenciales en Valdivia.'],
  ['Materiales', 'Incluidos durante la experiencia.'],
  ['Fechas y valores', 'Consultar calendario por WhatsApp.'],
];

const questions = [
  ['¿Necesito experiencia previa?', 'No. Los encuentros están pensados para personas que se acercan por primera vez y también para quienes desean seguir practicando.'],
  ['¿Qué materiales debo llevar?', 'Los materiales y herramientas de trabajo están incluidos. Recomendamos venir con ropa cómoda.'],
  ['¿Me llevo mi pieza el mismo día?', 'La cerámica requiere secado, esmaltado y cocción. Te explicaremos el plazo de entrega al comenzar.'],
  ['¿Cómo conozco las próximas fechas?', 'Escríbenos por WhatsApp para recibir el calendario actualizado y conocer los cupos disponibles.'],
];

export default function Workshops() {
  usePageMeta(
    'Talleres de cerámica — La Garza',
    'Talleres de cerámica en gres de La Garza en Valdivia. Aprende, experimenta y crea con tus manos.',
  );

  return (
    <main id="contenido">
      <section className="workshops-hero">
        <div className="workshops-hero__copy">
          <p className="eyebrow">Talleres en Valdivia</p>
          <h1>Tiempo para<br />hacer con<br />las manos.</h1>
          <p>Una experiencia cercana para conocer la cerámica desde la materia, el gesto y la experimentación.</p>
          <ButtonLink href={workshopInfoUrl} light>Consultar próximos encuentros</ButtonLink>
        </div>
        <figure className="workshops-hero__media">
          <img src={image168} alt="Vista amplia de la mesa central del taller La Garza" fetchPriority="high" />
          <figcaption>La mesa del taller · Valdivia</figcaption>
        </figure>
      </section>

      <section className="workshop-intro section">
        <div className="section-number">01</div>
        <div className="reveal">
          <p className="eyebrow">La experiencia</p>
          <h2>Tiempo, atención y manos en la arcilla.</h2>
        </div>
        <div className="reveal" data-content-status="provisional">
          <p>Los talleres de La Garza están pensados para descubrir el gres en un ambiente acogedor y grupos pequeños. No necesitas experiencia previa: acompañamos cada etapa para que explores con libertad y construyas una pieza propia.</p>
          <small>Información provisional · pendiente de validación</small>
        </div>
      </section>

      <section className="method section section--sand">
        <SectionHeading eyebrow="Metodología" title="Una práctica guiada y personal" />
        <div className="method-grid">
          {methodSteps.map(([number, title, description]) => (
            <WorkshopCard key={number} number={number} title={title}>{description}</WorkshopCard>
          ))}
        </div>
        <Gallery
          className="method-images"
          images={[
            { src: image174, alt: 'Mesa de herramientas junto a las ventanas del taller' },
            { src: image180, alt: 'Piezas de gres crudo durante el proceso de modelado' },
          ]}
        />
      </section>

      <section className="workshop-info section">
        <figure className="image-reveal">
          <img src={image186} alt="Lola trabajando con cerámica dentro del taller" loading="lazy" />
        </figure>
        <div>
          <p className="eyebrow">Información general</p>
          <h2>Antes de venir</h2>
          <dl>
            {workshopDetails.map(([term, description]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
          <ButtonLink href={workshopInfoUrl}>Consultar e inscribirme</ButtonLink>
        </div>
      </section>

      <section className="faq section">
        <SectionHeading eyebrow="Preguntas frecuentes" title="Lo que necesitas saber" />
        <div className="accordion">
          {questions.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}<span>+</span></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <CTA
        eyebrow="Próximos encuentros"
        title="Reserva un lugar en la mesa."
        description="Consulta fechas, valores y disponibilidad directamente con La Garza."
        action={{ href: workshopSignupUrl, label: 'Inscribirme por WhatsApp', light: true, arrow: true }}
      />
    </main>
  );
}
