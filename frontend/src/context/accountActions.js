import { today } from '../utils/commerce.js';
import { isAdult } from '../utils/validation.js';
import { bcryptSalt, companyError, newPasswordSalt, normalizeEmail, normalizeRun, passwordDigest, passwordValid, profileError } from '../utils/identity.js';

const emptyUserData = () => ({ cart: [], wishlists: [{ id: 'favorites', name: 'Mis favoritos', productIds: [] }], clients: [] });
const cleanAddresses = (addresses = []) => Array.isArray(addresses) ? addresses.map(address => ({
  id: address.id || crypto.randomUUID(), label: String(address.label || '').trim(),
  region: String(address.region || '').trim(), commune: String(address.commune || '').trim(),
  city: String(address.city || '').trim(), street: String(address.street || '').trim(), number: String(address.number || '').trim(),
  details: String(address.details || '').trim(),
})) : [];
const cleanProfile = (profile = {}) => ({
  name: String(profile.name || '').trim(), lastName: String(profile.lastName || '').trim(),
  run: String(profile.run || '').trim(), birthday: String(profile.birthday || ''),
  email: normalizeEmail(profile.email), phones: Array.isArray(profile.phones) ? profile.phones.map(phone => String(phone).trim()) : profile.phone ? [String(profile.phone).trim()] : [],
  addresses: cleanAddresses(profile.addresses), location: String(profile.location || '').trim(),
});
const sameSession = (api, accountId) => api.getSession()?.accountId === accountId;
const addressConflict = (profile, accounts, existingId) => accounts.some(account => account.id !== existingId && (account.addresses || []).some(address => profile.addresses.some(item => item.id === address.id)));

function anonymizeCommercial(record, accountId, companyIds) {
  let result = { ...record };
  if (record.customerId === accountId) {
    result = { ...result, customerId: null, customer: 'Cliente eliminado', address: 'Datos de dirección eliminados', addressId: null, lastFour: '', transferReference: '', reference: '', reason: '', detail: '' };
    for (const field of ['customerEmail', 'customerPhone', 'customerRun', 'run', 'email', 'phone', 'phones', 'addresses']) delete result[field];
  }
  if (companyIds.has(record.companyId) || companyIds.has(record.sellerId)) {
    result.seller = 'Empresa eliminada';
    if (!record.delivery) result.address = 'Punto de retiro eliminado';
  }
  return result;
}

export function createAccountActions(api) {
  const activeAccount = () => api.getState().accounts.find(account => account.id === api.getSession()?.accountId);
  const clearViews = accountId => {
    api.setChatId(null);
    api.setCheckout(api.checkoutFor(api.getState(), accountId));
  };

  const login = async ({ identifier, password, remember = false } = {}) => {
    const findAccount = state => state.accounts.find(account => normalizeEmail(account.email) === normalizeEmail(identifier) || normalizeRun(account.run) === normalizeRun(identifier));
    const account = findAccount(api.getState());
    if (!account || !password || !account.passwordHash || !account.passwordSalt) return api.fail('El correo/RUN o la contraseña no son correctos.');
    const digest = await passwordDigest(String(password), account.passwordSalt);
    const current = api.getState().accounts.find(item => item.id === account.id);
    if (!current || current.passwordSalt !== account.passwordSalt || digest !== current.passwordHash || findAccount(api.getState())?.id !== account.id) return api.fail('El correo/RUN o la contraseña no son correctos.');
    if (current.sellerEnabled && !isAdult(current.birthday, today())) return api.fail('Para vender debes tener 18 años cumplidos.');
    if (!bcryptSalt(current.passwordSalt)) {
      const passwordSalt = await newPasswordSalt();
      let passwordHash;
      try { passwordHash = await passwordDigest(String(password), passwordSalt); }
      catch { return api.fail('La contraseña debe tener un máximo de 72 bytes.'); }
      const latest = api.getState().accounts.find(item => item.id === current.id);
      if (!latest || latest.passwordHash !== current.passwordHash || latest.passwordSalt !== current.passwordSalt) return api.fail('La cuenta cambió. Vuelve a iniciar sesión.');
      api.commit(state => ({ ...state, accounts: state.accounts.map(item => item.id === current.id ? { ...item, passwordSalt, passwordHash, passwordAlgorithm: 'bcrypt' } : item) }));
    }
    const role = current.sellerEnabled ? 'seller' : 'client';
    api.setSession({ accountId: current.id, role, remember: Boolean(remember) });
    clearViews(current.id);
    return role;
  };

  const registerProfile = async (profile, business = false, password = '') => {
    const values = { ...cleanProfile(profile), sellerEnabled: Boolean(business) };
    const error = profileError(values, api.getState().accounts, today());
    if (error) return api.fail(error);
    if (!passwordValid(password)) return api.fail('Usa al menos 8 caracteres, una mayúscula, un número y un símbolo.');
    if (addressConflict(values, api.getState().accounts)) return api.fail('Cada dirección debe tener su propio identificador.');
    const id = `account-${crypto.randomUUID()}`;
    const passwordSalt = await newPasswordSalt();
    const passwordHash = await passwordDigest(password, passwordSalt);
    const current = api.getState();
    const currentError = profileError(values, current.accounts, today());
    if (currentError) return api.fail(currentError);
    if (addressConflict(values, current.accounts)) return api.fail('Cada dirección debe tener su propio identificador.');
    const role = business ? 'seller' : 'client';
    const account = { ...values, id, phone: values.phones[0], accountType: role, companyRegistrationPending: Boolean(business), passwordSalt, passwordHash, passwordAlgorithm: 'bcrypt' };
    api.commit(state => ({ ...state, accounts: [...state.accounts, account], userData: { ...state.userData, [id]: emptyUserData() } }));
    api.setSession({ accountId: id, role, remember: false });
    clearViews(id);
    return true;
  };

  const saveProfile = async (profile, { password = '' } = {}) => {
    const account = activeAccount();
    if (!account) return api.fail('Inicia sesión para editar tu perfil.');
    const values = { ...cleanProfile(profile), run: account.run, sellerEnabled: Boolean(account.sellerEnabled) };
    const error = profileError(values, api.getState().accounts, today(), account.id);
    if (error) return api.fail(error);
    if (addressConflict(values, api.getState().accounts, account.id)) return api.fail('Cada dirección debe tener su propio identificador.');
    if (password && !passwordValid(password)) return api.fail('Usa al menos 8 caracteres, una mayúscula, un número y un símbolo.');
    let credentials = {};
    if (password) {
      const passwordSalt = await newPasswordSalt();
      credentials = { passwordSalt, passwordHash: await passwordDigest(password, passwordSalt), passwordAlgorithm: 'bcrypt' };
    }
    if (!sameSession(api, account.id)) return api.fail('La sesión cambió. Vuelve a abrir tu perfil.');
    const current = api.getState();
    const latest = current.accounts.find(item => item.id === account.id);
    if (!latest) return api.fail('La cuenta ya no está disponible.');
    values.run = latest.run;
    values.sellerEnabled = Boolean(latest.sellerEnabled);
    const currentError = profileError(values, current.accounts, today(), account.id);
    if (currentError) return api.fail(currentError);
    if (addressConflict(values, current.accounts, account.id)) return api.fail('Cada dirección debe tener su propio identificador.');
    api.commit(state => ({ ...state, accounts: state.accounts.map(item => item.id === account.id ? { ...item, ...values, phone: values.phones[0], ...credentials } : item) }));
    const checkout = api.getCheckout?.();
    if (checkout?.accountId === account.id && checkout.addressId) {
      const selected = values.addresses.find(address => address.id === checkout.addressId);
      const previous = latest.addresses.find(address => address.id === checkout.addressId);
      const changed = previous && selected && ['label', 'region', 'commune', 'city', 'street', 'number', 'details'].some(field => (previous[field] || '') !== (selected[field] || ''));
      if (!selected || changed) {
        const replacement = selected || values.addresses[0];
        api.setCheckout(currentCheckout => currentCheckout.accountId === account.id && currentCheckout.addressId === checkout.addressId ? { ...currentCheckout, ...replacement, addressId: replacement.id } : currentCheckout);
      }
    }
    return true;
  };

  const saveCompany = async (company = {}) => {
    const account = activeAccount();
    if (!account) return api.fail('Inicia sesión para gestionar tu empresa.');
    if (!isAdult(account.birthday, today())) return api.fail('Para vender debes tener 18 años cumplidos.');
    const state = api.getState();
    const existing = state.companies.find(item => item.ownerId === account.id);
    const values = {
      id: existing?.id || `company-${crypto.randomUUID()}`, ownerId: account.id,
      name: String(company.name || '').trim(), rut: String(company.rut || '').trim(),
      email: normalizeEmail(company.email), website: String(company.website || '').trim(),
      phones: Array.isArray(company.phones) ? company.phones.map(phone => String(phone).trim()) : [],
      physical: Boolean(company.physical), offering: company.offering,
      address: company.physical ? cleanAddresses([{ ...company.address, id: existing?.address?.id || company.address?.id || crypto.randomUUID() }])[0] : null,
      defaultShipping: Number(company.defaultShipping ?? existing?.defaultShipping ?? 7990),
      shippingRates: Array.isArray(company.shippingRates) ? company.shippingRates.map(rate => ({ id: rate.id || crypto.randomUUID(), region: String(rate.region || '').trim(), commune: String(rate.commune || '').trim(), price: Number(rate.price) })) : [],
    };
    const error = companyError(values);
    if (error) return api.fail(error);
    if (new Set(values.shippingRates.map(rate => rate.id)).size !== values.shippingRates.length) return api.fail('Cada tarifa debe tener un identificador único.');
    if (state.companies.some(item => item.id !== values.id && (normalizeRun(item.rut) === normalizeRun(values.rut) || normalizeEmail(item.name) === normalizeEmail(values.name)))) return api.fail('Ya existe otra empresa con ese RUT o nombre.');
    if (values.address && state.accounts.some(item => (item.addresses || []).some(address => address.id === values.address.id))) return api.fail('La tienda debe tener una dirección identificada de forma independiente.');
    api.commit(current => ({ ...current,
      accounts: current.accounts.map(item => item.id === account.id ? { ...item, sellerEnabled: true, accountType: 'seller', companyRegistrationPending: false } : item),
      companies: existing ? current.companies.map(item => item.id === existing.id ? values : item) : [...current.companies, values],
      products: current.products.map(item => item.companyId === values.id ? { ...item, ownerId: account.id, seller: values.name } : item),
      services: current.services.map(item => item.companyId === values.id ? { ...item, ownerId: account.id, seller: values.name } : item),
    }));
    api.setSession({ ...api.getSession(), role: 'seller' });
    api.setChatId(null);
    return true;
  };

  const logout = () => {
    api.setSession(null);
    clearViews(null);
    api.navigate('/');
    return true;
  };

  const switchRole = () => {
    const account = activeAccount();
    if (!account) return api.fail('Inicia sesión para cambiar de vista.');
    const session = api.getSession();
    if (session.role === 'seller') {
      api.setSession({ ...session, role: 'client' });
      clearViews(account.id); api.navigate('/inicio'); return 'client';
    }
    if (!isAdult(account.birthday, today())) return api.fail('Para vender debes tener 18 años cumplidos.');
    if (!api.getState().companies.some(company => company.ownerId === account.id)) {
      clearViews(account.id); api.navigate('/registro-empresa'); return 'registration';
    }
    api.setSession({ ...session, role: 'seller' });
    clearViews(account.id); api.navigate('/inicio'); return 'seller';
  };

  const deleteAccount = async () => {
    const account = activeAccount();
    if (!account) return api.fail('Inicia sesión para eliminar tu cuenta.');
    api.commit(state => {
      const companyIds = new Set(state.companies.filter(company => company.ownerId === account.id).map(company => company.id));
      const userData = { ...state.userData }; delete userData[account.id];
      const personal = record => record.customerId === account.id || record.authorId === account.id || record.userId === account.id || record.accountId === account.id;
      const ownCompany = record => companyIds.has(record.companyId) || companyIds.has(record.sellerId);
      return { ...state,
        accounts: state.accounts.filter(item => item.id !== account.id), userData,
        companies: state.companies.map(company => companyIds.has(company.id) ? { id: company.id, ownerId: null, name: 'Empresa eliminada', rut: '', email: '', website: '', phones: [], physical: false, address: null, offering: company.offering, shippingRates: [], defaultShipping: 0, disabled: true } : company),
        products: state.products.map(item => ownCompany(item) || item.ownerId === account.id ? { ...item, hidden: true, ownerId: null, seller: 'Empresa eliminada', brand: companyIds.has(item.companyId) && item.brand === item.seller ? 'Empresa eliminada' : item.brand } : item),
        services: state.services.map(item => ownCompany(item) || item.ownerId === account.id ? { ...item, hidden: true, ownerId: null, seller: 'Empresa eliminada' } : item),
        offers: state.offers.map(offer => ownCompany(offer) ? { ...offer, enabled: false } : offer),
        orders: state.orders.map(record => anonymizeCommercial(record, account.id, companyIds)),
        transactions: state.transactions.map(record => anonymizeCommercial(record, account.id, companyIds)),
        returns: state.returns.map(record => anonymizeCommercial(record, account.id, companyIds)),
        messages: state.messages.filter(thread => !personal(thread) && !ownCompany(thread)),
        questions: state.questions.filter(question => !personal(question) && !ownCompany(question)),
        reviews: state.reviews.filter(review => !personal(review) && !ownCompany(review) && !(review.targetType === 'seller' && companyIds.has(review.targetId))),
        quotes: state.quotes.filter(quote => !personal(quote) && !ownCompany(quote)),
      };
    });
    logout();
    api.notify('Cuenta eliminada de este navegador.');
    return true;
  };

  return { login, registerProfile, saveProfile, saveCompany, deleteAccount, logout, switchRole };
}
