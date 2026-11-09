import test from 'node:test';
import assert from 'node:assert/strict';
import { isAdult, validRut } from '../src/utils/validation.js';

test('RUT con y sin puntos valida el dígito verificador, incluido K', () => {
  for (const rut of ['12.345.678-5', '12345678-5', '123456785', '6.000.000-k', '76.123.456-0']) assert.equal(validRut(rut), true, rut);
  for (const rut of ['', '12.345.678-9', '00000000-0', '12345678-X', 'abc123456785', '12..345.678-5']) assert.equal(validRut(rut), false, rut);
});

test('vendedor: se exige haber cumplido 18, no solo el año de nacimiento', () => {
  assert.equal(isAdult('2008-11-08', '2026-11-08'), true);
  assert.equal(isAdult('2008-11-09', '2026-11-08'), false);
  assert.equal(isAdult('2008-11-07', '2026-11-08'), true);
  for (const birthday of ['', undefined, '2027-01-01', '2000-02-30', '1995-13-01']) assert.equal(isAdult(birthday, '2026-11-08'), false);
  assert.equal(isAdult('2008-02-29', '2026-02-28'), false);
  assert.equal(isAdult('2008-02-29', '2026-03-01'), true);
});
