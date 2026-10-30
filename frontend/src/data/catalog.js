const image = (name) => `/assets/figma/${name}`;

export const products = [
  { id: 'hp-victus', name: 'Notebook HP Gamer Victus 15-fa2009la', brand: 'HP', seller: 'HP Store', category: 'Tecnología - Computación', price: 677990, originalPrice: 1199990, discount: 43, image: image('da0c3.png'), detailImage: image('28074.png'), sku: '0341', stock: 5, size: '15.6 pulgadas (35.7 × 25.5 × 2.35 cm)', weight: '2.29 kg', color: 'Negro', material: 'Policarbonato' },
  { id: 'gopro', name: 'GoPro HERO11 Black', brand: 'GOPRO', seller: 'GoPro Store', category: 'Vídeo y Fotografía', price: 479990, originalPrice: 549990, discount: 13, image: image('53439.png'), stock: 8 },
  { id: 'dyson', name: 'Dyson V15 Detect Vacuum Cleaner', brand: 'DYSON', seller: 'Dyson', category: 'Electrodomésticos', price: 799990, originalPrice: 899990, discount: 11, image: image('3b162.png'), stock: 6 },
  { id: 'fitbit', name: 'Fitbit Charge 5 Aluminio Pulsera de actividad', brand: 'FITBIT', seller: 'Fitbit', category: 'Tecnología', price: 99990, originalPrice: 129990, discount: 23, image: image('f99c0.png'), stock: 10 },
  { id: 'air-jordan', name: 'Air Jordan 1 Retro High OG', brand: 'NIKE', seller: 'Nike Store', category: 'Calzado - Zapatillas', price: 98990, originalPrice: 194990, discount: 49, image: image('eab58.png'), stock: 6 },
  { id: 'iphone', name: 'Iphone 17 Pro Max 5G', brand: 'APPLE', seller: 'Apple Store', category: 'Tecnología - Celulares', price: 1389990, originalPrice: 1549990, discount: 10, image: image('6ce23.png'), stock: 4 },
  { id: 'nespresso', name: 'Cafetera Nespresso Inissia Color Negro', brand: 'NESPRESSO', seller: 'Nespresso', category: 'Electrodomésticos', price: 74990, originalPrice: 139990, discount: 47, image: image('31c05.png'), stock: 7 },
  { id: 'jbl', name: 'JBL Go 5 Bt Speaker-Blanco', brand: 'JBL', seller: 'JBL', category: 'Audio y Música', price: 43990, originalPrice: 59990, discount: 47, image: image('8a19d.png'), stock: 12 },
  { id: 'samsung', name: 'Samsung Galaxy Tab S9 Ultra', brand: 'SAMSUNG', seller: 'Samsung', category: 'Tecnología - Tablets', price: 1099990, originalPrice: 1299990, discount: 15, image: image('67eba.png'), stock: 8 },
  { id: 'kindle', name: 'Kindle Paperwhite Signature Edition', brand: 'AMAZON', seller: 'Amazon', category: 'Libros', price: 159990, originalPrice: 199990, discount: 20, image: image('4706f.png'), stock: 5 },
  { id: 'sony', name: 'Sony WH-1000XM5 Wireless Headphones', brand: 'SONY', seller: 'Sony', category: 'Audio y Música', price: 299990, originalPrice: 349990, discount: 14, image: image('9662a.png'), stock: 9 },
  { id: 'macbook', name: 'Apple MacBook Air M2 15-inch', brand: 'APPLE', seller: 'Apple Store', category: 'Tecnología - Computación', price: 1049990, originalPrice: 1199990, discount: 12, image: image('7f24a.png'), stock: 3 },
  { id: 'mouse', name: 'Mouse Gamer RGB', brand: 'LOGITECH', seller: 'HP Store', category: 'Tecnología', price: 29990, originalPrice: 29990, discount: 0, image: image('d45be.png'), sku: '0267', stock: 2 },
  { id: 'keyboard', name: 'Teclado Mecánico RGB', brand: 'RGB', seller: 'HP Store', category: 'Tecnología', price: 49990, originalPrice: 49990, discount: 0, image: image('8048d.png'), sku: '0199', stock: 0 },
];

export const services = [
  { id: 'jardineria', name: 'Trabajo de jardinería profesional', seller: 'Miguel Núñez', category: 'Jardinería', image: image('86e66.png'), duration: '2 horas', description: 'Mantención de jardines, poda y cuidado de áreas verdes.' },
  { id: 'reparacion', name: 'Limpieza de combustión y reparaciones', seller: 'Reparaciones Osorno', category: 'Reparaciones', image: image('65ae4.png'), duration: '1 hora', description: 'Revisión y mantención de equipos de calefacción.' },
  { id: 'cuidados', name: 'Cuidado de adultos a tiempo completo', seller: 'María González', category: 'Cuidado de adultos', image: image('aef8e.png'), duration: '8 horas', description: 'Acompañamiento y asistencia en las actividades diarias.' },
  { id: 'web', name: 'Creación de páginas web (Frontend y Backend)', seller: 'Grupo A', category: 'Computación y Tecnología', image: image('e3b4f.png'), duration: 'Según proyecto', description: 'Diseño y desarrollo de sitios adaptados a tu negocio.' },
  { id: 'dentista', name: 'Extracciones dentales para toda edad', seller: 'Clínica Famident', category: 'Dentistas', image: image('28838.png'), duration: '1 hora', description: 'Agenda una evaluación y solicita un presupuesto personalizado.' },
  { id: 'auditoria', name: 'Auditorías para procesos financieros', seller: 'Firma Billar', category: 'Contadores y Auditores', image: image('b511f.png'), duration: 'Según proyecto', description: 'Revisión de procesos y asesoría contable para tu empresa.' },
  { id: 'clases', name: 'Clases particulares de matemáticas', seller: 'Cristina Sanhueza', category: 'Clases Particulares', image: image('9ba5e.png'), duration: '1 hora', description: 'Clases personalizadas y apoyo para preparar tus evaluaciones.' },
  { id: 'terapia', name: 'Sesiones de terapia psicológica para adultos', seller: 'Tamara Candia', category: 'Psicólogos', image: image('690a7.png'), duration: '50 minutos', adultOnly: true, description: 'Solicita información sobre disponibilidad y modalidad de atención.' },
];
