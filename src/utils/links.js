export const whatsappNumber = '56978322580';
export const whatsappUrl = (message) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

export const contactUrl = whatsappUrl('Hola La Garza');
export const homeContactUrl = whatsappUrl('Hola La Garza, quisiera hacer una consulta.');
export const instagramUrl = 'https://www.instagram.com/';
