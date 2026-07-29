import CTA from '../../components/CTA/CTA.jsx';
import Hero from '../../components/Hero/Hero.jsx';
import { ButtonLink, TextLink } from '../../components/Links/Links.jsx';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import SectionHeading from '../../components/SectionHeading/SectionHeading.jsx';
import {
  image12,
  image25,
  image43,
  image49,
  image103,
  image159Improved,
  image168,
} from '../../assets/media.js';
import usePageMeta from '../../hooks/usePageMeta.js';
import { homeContactUrl } from '../../utils/links.js';

const featuredProducts = [
  {
    to: '/piezas/gallina-contenedora',
    image: image12,
    alt: 'Conjunto de gallinas de cerámica con tapa',
    title: 'Gallina contenedora',
    material: 'Gres esmaltado',
  },
  {
    to: '/piezas/familia-azul-rio',
    image: image43,
    alt: 'Conjunto de platos y cuencos esmaltados en azul',
    title: 'Familia Azul Río',
    material: 'Gres esmaltado',
    tall: true,
  },
  {
    to: '/piezas/taza-de-campo',
    image: image103,
    alt: 'Tazas color tierra sobre platos de gres',
    title: 'Taza de campo',
    material: 'Gres esmaltado',
  },
];

export default function Home() {
  usePageMeta(
    'La Garza — Cerámica en gres, Valdivia',
    'La Garza, taller de cerámica en gres hecho a mano en Valdivia, Chile. Conoce nuestras piezas y talleres.',
  );

  return (
    <main id="contenido">
      <Hero
        image={image25}
        imageAlt="Cuencos de gres natural agrupados sobre fondo claro"
        eyebrow="Cerámica en gres · Valdivia, Chile"
        title={<>Piezas con memoria,<br />hechas para acompañar.</>}
        action={{ to: '/piezas', label: 'Descubrir las piezas' }}
        caption="Cuencos de ribera · Gres natural"
      />

      <section className="intro section">
        <div className="intro__copy reveal">
          <p className="eyebrow">La materia y el tiempo</p>
          <h2>Cerámica que guarda el gesto de quien la hizo.</h2>
          <p>En La Garza creamos piezas de gres de manera lenta y consciente. Cada forma nace en el taller, entre pruebas, esmaltes y una forma muy personal de mirar lo cotidiano.</p>
          <TextLink to="/sobre-la-garza">Conocer nuestra historia</TextLink>
        </div>
        <figure className="intro__image">
          <div className="intro__image-frame image-reveal">
            <img src={image49} alt="Vajilla de gres vista desde arriba" loading="lazy" />
          </div>
          <figcaption>Formas únicas · Modeladas a mano</figcaption>
        </figure>
      </section>

      <section className="featured section section--sand">
        <SectionHeading
          eyebrow="Selección del taller"
          title="Piezas singulares"
          action={{ to: '/piezas', label: 'Ver todas' }}
        />
        <div className="product-grid product-grid--featured">
          {featuredProducts.map((product) => <ProductCard key={product.title} {...product} />)}
        </div>
      </section>

      <section className="workshop-preview">
        <div className="workshop-preview__media image-reveal">
          <img src={image168} alt="Interior luminoso del taller La Garza con mesa central y grandes ventanas" loading="lazy" />
        </div>
        <div className="workshop-preview__copy reveal">
          <p className="eyebrow">La mesa del taller</p>
          <h2>Un espacio para crear con las manos.</h2>
          <p>Encuentros de cerámica en grupos pequeños, pensados para explorar la materia, aprender el proceso y crear una pieza propia.</p>
          <ButtonLink to="/talleres">Conocer los talleres</ButtonLink>
        </div>
      </section>

      <section className="atmosphere section">
        <figure className="atmosphere__image image-reveal">
          <img src={image159Improved} alt="Ventanas del taller cubiertas por la lluvia de Valdivia" loading="lazy" />
        </figure>
        <div className="atmosphere__copy reveal">
          <p className="eyebrow">Valdivia, sur de Chile</p>
          <p>La lluvia cambia la luz. El taller aprende a trabajar con ese ritmo.</p>
        </div>
      </section>

      <CTA
        eyebrow="Conversemos"
        title="¿Hay una pieza que te interesó?"
        description="Escríbenos para consultar por piezas disponibles, encargos o próximos talleres."
        action={{ href: homeContactUrl, label: 'Escribir por WhatsApp', light: true, arrow: true }}
      />
    </main>
  );
}
