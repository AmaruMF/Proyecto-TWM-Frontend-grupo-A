import test from 'node:test';
import assert from 'node:assert/strict';
import { categories, categoryAncestors, categoryById, categoryChildren, categoryDescendantIds, categoryIsLeaf, categoryPath, categoryTreeError, isCategoryWithin, normalizeItemCategory, validCategory } from '../src/utils/categories.js';

test('árbol oficial conserva las categorías del enunciado, padres y ramas profundas sin ciclos', () => {
  assert.equal(categories.length, 48);
  assert.equal(categoryTreeError(), '');
  assert.deepEqual(categoryChildren(null).map(item => item.name), ['Servicios', 'Productos']);
  assert.equal(categoryById('1.2.3').name, 'Limpieza de combustión y reparaciones menores');
  assert.equal(categoryById('1.3.6.2').parentId, '1.3.6');
  assert.equal(categoryById('1.3.7.3').name, 'Terapeuta Ocupacional');
  assert.equal(categoryById('2.9').name, 'Útiles y librería');
  assert.deepEqual(categoryAncestors('1.3.6.2').map(item => item.id), ['1', '1.3', '1.3.6', '1.3.6.2']);
  assert.equal(categoryPath('1.3.6.2'), 'Servicios / Servicios profesionales / Servicio de salud / Dentista');
});

test('filtros de una categoría padre incluyen todos sus descendientes y excluyen otras ramas', () => {
  const descendants = categoryDescendantIds('1.3');
  assert.ok(descendants.includes('1.3'));
  assert.ok(descendants.includes('1.3.7.3'));
  assert.equal(descendants.includes('1.2.4'), false);
  assert.equal(isCategoryWithin('1.3.6.2', '1.3'), true);
  assert.equal(isCategoryWithin('1.3.6.2', '1.2'), false);
  assert.equal(isCategoryWithin('2.1.1', '1'), false);
  assert.equal(isCategoryWithin('2.1.1', ''), true);
});

test('publicaciones requieren una categoría hoja del tipo correcto, sin confundir etiquetas Otros', () => {
  assert.equal(validCategory('1.3.6', 'service'), false);
  assert.equal(validCategory('1.3.6.2', 'service'), true);
  assert.equal(validCategory('1.3.6.2', 'product'), false);
  assert.equal(categoryIsLeaf('2.1.1'), true);
  assert.equal(validCategory('2', 'product'), false);
  assert.notEqual(categoryPath('1.3.6.5'), categoryPath('1.3.7.4'));
  assert.equal(validCategory('1.3', 'service', { allowParents: true }), true);
});

test('migración de categorías conserva información previa y produce claves estables del árbol', () => {
  const product = normalizeItemCategory({ id: 'mouse', name: 'Mouse RGB', category: 'Tecnología', custom: { x: 1 } }, 'product');
  assert.equal(product.categoryId, '2.1.1');
  assert.equal(product.category, 'Productos / Tecnología / Computación');
  assert.equal(product.legacyCategory, 'Tecnología');
  assert.deepEqual(product.custom, { x: 1 });
  const service = normalizeItemCategory({ id: 'dentista', category: 'Dentistas' }, 'service');
  assert.equal(service.categoryId, '1.3.6.2');
  assert.equal(normalizeItemCategory(service, 'service').categoryId, service.categoryId);
  assert.equal(normalizeItemCategory({ category: 'Categoría antigua sin correspondencia' }, 'service').categoryId, '1.7');
});

test('validación detecta relaciones huérfanas, ciclos, tipos cruzados e identidades repetidas', () => {
  const root = { id: 'a', parentId: null, name: 'Raíz', type: 'product' };
  assert.ok(categoryTreeError([root, { id: 'b', parentId: 'missing', name: 'Hija', type: 'product' }]));
  assert.ok(categoryTreeError([{ ...root, parentId: 'b' }, { id: 'b', parentId: 'a', name: 'Hija', type: 'product' }]));
  assert.ok(categoryTreeError([root, { id: 'b', parentId: 'a', name: 'Hija', type: 'service' }]));
  assert.ok(categoryTreeError([root, { ...root }]));
});
