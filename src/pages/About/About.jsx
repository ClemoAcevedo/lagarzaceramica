import CTA from '../../components/CTA/CTA.jsx';
import Gallery from '../../components/Gallery/Gallery.jsx';
import {
  image150,
  image158,
  image165,
  image166,
  image167,
  image175,
  image180,
  image186,
  image186Improved,
  image189,
} from '../../assets/media.js';
import usePageMeta from '../../hooks/usePageMeta.js';

const processSteps = [
  ['Explorar', 'Una forma comienza en la observación, el dibujo y las pruebas de volumen.'],
  ['Modelar', 'Las manos construyen cada pieza y dejan en ella variaciones irrepetibles.'],
  ['Esmaltar', 'Capas de color, textura y minerales transforman la superficie.'],
  ['Cocer', 'El horno completa el proceso y revela el carácter final del gres.'],
];

export default function About() {
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
        <div className="story__title reveal">
          <p className="eyebrow">Nuestra historia</p>
          <h2>Una práctica hecha de tiempo y atención.</h2>
          <figure className="story__portrait image-reveal">
            <img
              src={image186Improved}
              alt="Lola seleccionando materiales junto a la ventana del taller"
              loading="lazy"
            />
          </figure>
        </div>
        <figure className="story__materials image-reveal">
          <img
            src={image158}
            alt="Materiales y herramientas de cerámica dispuestos en el taller"
            loading="lazy"
          />
        </figure>
        <div className="story__aside">
          <div className="story__body reveal" data-content-status="provisional">
            <p>La Garza nace en Valdivia como un espacio de exploración en torno a la cerámica en gres. El taller reúne el oficio cotidiano y el deseo de crear objetos que permanezcan cerca.</p>
            <p>Cada colección se construye sin prisa. Las pequeñas variaciones de forma, tono y textura son parte esencial de las piezas: señales de un proceso humano que no busca repetirse de manera exacta.</p>
            <small>Texto provisional · pendiente de validación</small>
          </div>
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

      <section className="philosophy section section--green">
        <div className="philosophy__copy reveal">
          <p className="eyebrow">Filosofía</p>
          <h2>Lo imperfecto también puede ser preciso.</h2>
          <p>Trabajamos respetando la personalidad del material. El gesto, la huella y el fuego participan de cada resultado. Buscamos formas serenas y útiles que hagan especial lo cotidiano.</p>
        </div>
        <figure className="philosophy__image image-reveal">
          <img src={image150} alt="Cuencos de gres anidados sobre una pieza de madera" loading="lazy" />
        </figure>
      </section>

      <section className="process section">
        <header className="section-heading reveal">
          <div>
            <p className="eyebrow">Proceso artesanal</p>
            <h2>De la idea al fuego</h2>
          </div>
        </header>
        <ol className="process-list">
          {processSteps.map(([title, description]) => (
            <li className="reveal" key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
        <Gallery
          className="process-gallery"
          images={[
            { src: image175, alt: 'Pinceles del taller en primer plano' },
            { src: image180, alt: 'Piezas de cerámica cruda en proceso' },
            { src: image186, alt: 'Ceramista trabajando junto a la ventana' },
          ]}
        />
      </section>

      <CTA
        eyebrow="Piezas hechas para durar"
        title="Conoce el trabajo del taller."
        action={{ to: '/products', label: 'Ver las piezas', light: true, arrow: true }}
      />
    </main>
  );
}
