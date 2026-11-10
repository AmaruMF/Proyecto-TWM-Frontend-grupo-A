import { isAdult, validRut } from './validation.js';
import bcrypt from 'bcryptjs';

export const normalizeEmail = value => String(value || '').trim().toLowerCase();
export const normalizeRun = value => String(value || '').replace(/[.\s-]/g, '').toUpperCase();
export const normalizePhone = value => {
  const digits = String(value || '').replace(/\D/g, '').replace(/^00/, '');
  return /^9\d{8}$/.test(digits) ? `56${digits}` : digits;
};
export const fullName = profile => `${profile?.name || ''} ${profile?.lastName || ''}`.trim();
export const passwordValid = value => /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value || '') && !bcrypt.truncates(String(value));
export const bcryptSalt = salt => /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{22}$/.test(salt || '');
export const newPasswordSalt = () => bcrypt.genSalt(12);

export async function passwordDigest(password, salt) {
  if (bcryptSalt(salt)) {
    if (bcrypt.truncates(password)) throw new Error('La contraseña no puede superar 72 bytes.');
    return bcrypt.hash(password, salt);
  }
  // Compatibilidad de lectura para cuentas existentes; el login migra a bcrypt.
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const digest = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 120000, hash: 'SHA-256' }, key, 256);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function addressError(addresses) {
  if (!Array.isArray(addresses) || !addresses.length) return 'Debes mantener al menos una dirección.';
  if (addresses.some(address => !['region', 'commune', 'city', 'street', 'number'].every(field => String(address[field] || '').trim()))) return 'Completa todos los datos de cada dirección.';
  if (new Set(addresses.map(address => address.id)).size !== addresses.length || addresses.some(address => !address.id)) return 'Cada dirección debe tener un identificador único.';
  return '';
}

export function contactError(phones) {
  if (!Array.isArray(phones) || !phones.length) return 'Debes mantener al menos un teléfono.';
  if (phones.some(phone => !/^\d{8,15}$/.test(normalizePhone(phone)))) return 'Cada teléfono debe contener entre 8 y 15 dígitos.';
  if (new Set(phones.map(normalizePhone)).size !== phones.length) return 'Los teléfonos no pueden repetirse.';
  return '';
}

export function profileError(profile, accounts, date, existingId) {
  if (!String(profile.name || '').trim() || !String(profile.lastName || '').trim()) return 'Completa tus nombres y apellidos.';
  if (!validRut(profile.run)) return 'El RUN es inválido.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(profile.email))) return 'Ingresa un correo electrónico válido.';
  const birthday = new Date(`${profile.birthday}T12:00:00Z`);
  if (Number.isNaN(birthday.getTime()) || birthday.toISOString().slice(0, 10) !== profile.birthday || profile.birthday > date) return 'Ingresa una fecha de nacimiento válida.';
  if (profile.sellerEnabled && !isAdult(profile.birthday, date)) return 'Para vender debes tener 18 años cumplidos.';
  const others = accounts.filter(account => account.id !== existingId);
  if (others.some(account => normalizeEmail(account.email) === normalizeEmail(profile.email))) return 'Ese correo electrónico ya está registrado.';
  if (others.some(account => normalizeRun(account.run) === normalizeRun(profile.run))) return 'Ese RUN ya está registrado.';
  const phones = profile.phones || [profile.phone];
  const contact = contactError(phones);
  if (contact) return contact;
  if (others.some(account => (account.phones || []).some(phone => phones.map(normalizePhone).includes(normalizePhone(phone))))) return 'Uno de los teléfonos ya pertenece a otra persona.';
  return addressError(profile.addresses);
}

export function companyError(company) {
  if (!String(company.name || '').trim() || !validRut(company.rut)) return 'Completa la razón social y un RUT válido.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(company.email))) return 'Ingresa un correo comercial válido.';
  if (company.website && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(company.website)) return 'El sitio web debe comenzar con https:// o http://.';
  if (!['Producto', 'Servicio', 'Ambos'].includes(company.offering)) return 'Selecciona qué ofrecerá tu empresa.';
  const phones = contactError(company.phones);
  if (phones) return phones;
  if (company.physical) {
    const address = addressError([{ ...company.address, id: company.address?.id || 'local' }]);
    if (address) return 'Completa la dirección de la tienda física.';
  }
  if (!Number.isInteger(Number(company.defaultShipping ?? 7990)) || Number(company.defaultShipping ?? 7990) < 0) return 'La tarifa de envío debe ser un entero mayor o igual a cero.';
  const rates = company.shippingRates || [];
  if (rates.some(rate => !String(rate.region || '').trim() || !Number.isInteger(Number(rate.price)) || Number(rate.price) < 0)) return 'Completa la región y un precio de envío válido para cada tarifa.';
  const zones = rates.map(rate => `${normalizeEmail(rate.region)}|${normalizeEmail(rate.commune)}`);
  if (new Set(zones).size !== zones.length) return 'No repitas una misma zona de envío.';
  return '';
}

export function shippingCost(company, destination, delivery = true) {
  if (!delivery) return 0;
  const matches = (company?.shippingRates || []).filter(rate => normalizeEmail(rate.region) === normalizeEmail(destination.region));
  const rate = matches.find(item => item.commune && normalizeEmail(item.commune) === normalizeEmail(destination.commune)) || matches.find(item => !String(item.commune || '').trim());
  return Number(rate?.price ?? company?.defaultShipping ?? 7990);
}

export function canManageCompany(state, session, companyId) {
  return Boolean(session?.role === 'seller' && state.companies.some(company => company.id === companyId && company.ownerId === session.accountId));
}

export function canAccessThread(state, session, thread) {
  if (!session || !thread) return false;
  return session.role === 'seller' ? canManageCompany(state, session, thread.companyId) : thread.customerId === session.accountId;
}

export function reviewOrder(state, accountId, targetType, targetId) {
  return state.orders.find(order => order.customerId === accountId && order.step === 3 && (targetType === 'seller' ? order.companyId === targetId : order.items.some(item => targetType === 'service' ? item.serviceId === targetId : item.productId === targetId)));
}

export function orderUpdateError(state, session, order, patch) {
  if (!order || !canManageCompany(state, session, order.companyId)) return 'No puedes gestionar este pedido.';
  if (order.delivery && order.step >= 2 && patch.carrier !== undefined && String(patch.carrier).trim() !== String(order.carrier || '').trim()) return 'La empresa de transporte no puede cambiar después del envío.';
  if (patch.step !== undefined && (!Number.isInteger(patch.step) || patch.step !== order.step + 1 || patch.step > 3)) return 'Solo puedes avanzar al siguiente estado del pedido.';
  const next = { ...order, ...patch };
  if (order.delivery && next.step >= 2 && (!String(next.carrier || '').trim() || !String(next.tracking || '').trim() || next.carrier === 'Por asignar' || next.tracking === 'Por asignar')) return 'Registra la empresa de transporte y el número de seguimiento antes de enviar.';
  return '';
}
