import categoryData from '../data/categories.json' with { type: 'json' };

export const categories = categoryData;
const byId = new Map(categories.map(category => [category.id, category]));
const normalized = value => String(value || '').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
export const categoryById = id => byId.get(String(id || '')) || null;
export const categoryChildren = parentId => categories.filter(category => category.parentId === (parentId || null));
export const categoryIsLeaf = id => Boolean(categoryById(id)) && !categoryChildren(id).length;
export const validCategory = (id, type, { allowParents = false } = {}) => Boolean(categoryById(id)?.parentId && (!type || categoryById(id).type === type) && (allowParents || categoryIsLeaf(id)));

export function categoryTreeError(nodes = categories) {
  const index = new Map(nodes.map(node => [node.id, node]));
  if (index.size !== nodes.length) return 'Las categorías deben tener identificadores únicos.';
  for (const node of nodes) {
    if (!node.id || !node.name || !['product', 'service'].includes(node.type)) return 'Cada categoría necesita identidad, nombre y tipo.';
    const seen = new Set();
    let current = node;
    while (current) {
      if (seen.has(current.id)) return 'La jerarquía de categorías no puede contener ciclos.';
      seen.add(current.id);
      if (!current.parentId) break;
      const parent = index.get(current.parentId);
      if (!parent || parent.type !== node.type) return 'Cada categoría hija debe pertenecer a un padre del mismo tipo.';
      current = parent;
    }
  }
  return '';
}

export function categoryAncestors(id) {
  const result = [];
  const seen = new Set();
  let category = categoryById(id);
  while (category && !seen.has(category.id)) {
    seen.add(category.id); result.unshift(category); category = categoryById(category.parentId);
  }
  return result;
}

export function categoryPath(id, { includeRoot = true } = {}) {
  return categoryAncestors(id).filter(category => includeRoot || category.parentId).map(category => category.name).join(' / ');
}

export function categoryDescendantIds(id, { includeSelf = true } = {}) {
  if (!categoryById(id)) return [];
  const result = includeSelf ? [String(id)] : [];
  for (const child of categoryChildren(String(id))) result.push(...categoryDescendantIds(child.id));
  return result;
}

export const isCategoryWithin = (categoryId, ancestorId) => !ancestorId || categoryAncestors(categoryId).some(category => category.id === ancestorId);

const productLegacy = {
  'tecnologia - computacion': '2.1.1', computacion: '2.1.1', 'tecnologia - tablets': '2.1.1',
  'audio y musica': '2.1.2', 'juegos y consolas': '2.1.3', 'video y fotografia': '2.1.4',
  'electronica y television': '2.1.4', tecnologia: '2.1.5', 'tecnologia - celulares': '2.2', celulares: '2.2',
  electrodomesticos: '2.3', 'hogar y cocina': '2.3', alimentacion: '2.4', 'accesorios para vehiculos': '2.5',
  libros: '2.6', 'libros e instrumentos musicales': '2.6', 'calzado - zapatillas': '2.7', 'ropa, moda y calzado': '2.7',
  'juguetes y ninos': '2.8', 'utiles y libreria': '2.9', 'otros productos': '2.10', otros: '2.10',
};
const serviceLegacy = {
  'computacion y tecnologia': '1.1', aseo: '1.2.1', jardineria: '1.2.2', 'trabajo de jardin': '1.2.2',
  reparaciones: '1.2.3', 'limpieza de combustion y reparaciones menores': '1.2.3', 'cuidado de adultos': '1.2.4',
  'cuidado de ninos': '1.2.5', 'otros servicios domesticos': '1.2.6', 'computacion (creacion pagina web, diseno, publicidad)': '1.3.1',
  abogados: '1.3.2', 'contadores y auditores': '1.3.3', arquitecto: '1.3.4', psicologos: '1.3.5', medico: '1.3.6.1',
  dentista: '1.3.6.2', dentistas: '1.3.6.2', enfermeria: '1.3.6.3', kinesiologia: '1.3.6.4',
  'clases particulares': '1.3.7.1', fonoaudiologia: '1.3.7.2', 'terapeuta ocupacional': '1.3.7.3', veterinarios: '1.3.8',
  'confeccion de ropa y vestuario': '1.5', 'servicio de banqueteria, reposteria y alimentacion en general': '1.6',
  'otros servicios': '1.7', otros: '1.7',
};

export function normalizeItemCategory(item, type = 'product') {
  const correctType = type === 'service' || type === 'services' ? 'service' : 'product';
  const existing = categoryById(item.categoryId);
  let id = existing?.type === correctType && existing.parentId ? existing.id : '';
  const original = String(item.category || '');
  if (!id) {
    const exact = categories.find(category => category.type === correctType && category.parentId && (normalized(categoryPath(category.id)) === normalized(original) || normalized(categoryPath(category.id, { includeRoot: false })) === normalized(original)));
    id = exact?.id || (correctType === 'service' ? serviceLegacy : productLegacy)[normalized(original)] || '';
  }
  if (!id && correctType === 'product' && /mouse|teclado|notebook|macbook|tablet/i.test(item.name || '')) id = '2.1.1';
  if (correctType === 'product' && normalized(original) === 'tecnologia' && /mouse|teclado/i.test(item.name || '')) id = '2.1.1';
  if (correctType === 'service' && item.id === 'web' && !existing) id = '1.3.1';
  if (!id) id = correctType === 'service' ? '1.7' : '2.10';
  return { ...item, categoryId: id, category: categoryPath(id), ...(original && original !== categoryPath(id) ? { legacyCategory: item.legacyCategory || original } : {}) };
}

export function recommendationError(state, product, ids, session) {
  const company = state.companies.find(item => item.id === product?.companyId);
  if (!product || !company || session?.role !== 'seller' || company.ownerId !== session.accountId) return 'Solo puedes recomendar artículos desde tus propias publicaciones.';
  if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string') || new Set(ids).size !== ids.length) return 'Selecciona productos distintos para las recomendaciones.';
  if (ids.includes(product.id)) return 'Un producto no puede recomendarse a sí mismo.';
  if (ids.some(id => !state.products.some(item => item.id === id && item.companyId === product.companyId && !item.hidden))) return 'Las recomendaciones deben ser productos activos de tu empresa.';
  return '';
}

export function recommendedProducts(product, products) {
  return [...new Set(product?.relatedProductIds || [])].map(id => products.find(item => item.id === id && item.id !== product.id && item.companyId === product.companyId && !item.hidden)).filter(Boolean);
}
