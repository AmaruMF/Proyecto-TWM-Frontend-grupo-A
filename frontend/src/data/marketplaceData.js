import { products, services } from './catalog';

export const initialMarketplace = {
  version: 1,
  profile: { name: 'Fernando', lastName: 'Martínez', run: '12.345.678-9', email: 'fernando.martinez@gmail.com', phone: '+56 9 1234 5678', location: 'Osorno, Chile' },
  products,
  services,
  cart: [{ productId: 'hp-victus', quantity: 1 }, { productId: 'air-jordan', quantity: 2 }],
  wishlists: [{ id: 'favorites', name: 'Mis favoritos', productIds: products.slice(4, 12).map((product) => product.id) }],
  orders: [
    { id: '10541', seller: 'HP Store', items: [{ productId: 'hp-victus', name: products[0].name, image: products[0].detailImage, price: 677990, quantity: 1 }], date: '2026-09-20', step: 1, delivery: true, shipping: 4990, total: 682980, carrier: 'Chilexpress', tracking: 'AA-99453701CL', address: 'Av. República 1234, Depto 55, Osorno' },
    { id: '10678', seller: 'Nike Store', items: [{ productId: 'air-jordan', name: products[4].name, image: products[4].image, price: 98990, quantity: 2 }], date: '2026-09-12', step: 3, delivery: false, shipping: 0, total: 197980, tracking: 'AA-99453702CL', address: 'Tienda Nike, Osorno' },
  ],
  transactions: [
    { id: '5521', seller: 'Nike Store', description: 'Air Jordan 1 Retro High ×1', date: '2026-09-16', total: 98990, status: 'Completada' },
    { id: '5522', seller: 'Nike Store', description: 'Air Jordan 1 Retro High ×1', date: '2026-09-15', total: 98990, status: 'Cancelada' },
    { id: '5523', seller: 'HP Store', description: 'Notebook HP Gamer Victus ×1', date: '2026-09-13', total: 682980, status: 'Pendiente' },
  ],
  returns: [
    { id: '5521', seller: 'Nike Store', description: 'Air Jordan 1 Retro High ×1', date: '2026-09-14', total: 98990, step: 3, status: 'Reembolso emitido' },
    { id: '5102', seller: 'Nespresso', description: 'Cafetera Nespresso Inissia Color Negro ×1', date: '2026-09-14', total: 74990, step: 2, status: 'Rechazada' },
  ],
  quotes: [
    { id: '10541', serviceId: 'jardineria', serviceName: services[0].name, customer: 'Millaray Godoy', date: '2026-11-22', detail: 'Mantención de jardín y poda.', step: 2, price: 65000 },
    { id: '10542', serviceId: 'jardineria', serviceName: services[0].name, customer: 'Sofía Pezo', date: '2026-11-30', detail: 'Limpieza de patio.', step: 1, price: 45000 },
    { id: '10543', serviceId: 'jardineria', serviceName: services[0].name, customer: 'Sofía Pezo', date: '2026-12-05', detail: 'Necesito una evaluación de mi jardín.', step: 0 },
  ],
  offers: [],
  messages: [{ id: 'welcome', seller: 'HP Store', context: 'Consulta de producto', messages: [{ id: 'hello', incoming: true, text: '¡Hola! Cuéntanos en qué podemos ayudarte.', time: '13:58' }] }],
  questions: [{ id: 'q1', productId: 'hp-victus', text: '¿Viene con Windows instalado y cargador original?', answer: '¡Hola! Sí, incluye Windows 11 Home preinstalado y su cargador de fábrica. ¡Saludos!' }, { id: 'q2', productId: 'hp-victus', text: '¿Tienen stock para retiro en local en Osorno?', answer: 'Sí, tenemos unidades disponibles para retiro en sucursal.' }],
  ratings: {},
  company: null,
};
