export function validRut(value) {
  const input = String(value || '').trim();
  if (!/^(?:\d{7,8}|\d{1,2}\.\d{3}\.\d{3})-?[\dkK]$/.test(input)) return false;
  const rut = input.replace(/[.-]/g, '').toUpperCase();
  const body = rut.slice(0, -1);
  if (Number(body) === 0) return false;
  let sum = 0;
  let factor = 2;
  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const remainder = 11 - sum % 11;
  return rut.at(-1) === (remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder));
}

export function isAdult(birthday, date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday || '') || !date) return false;
  const parsed = new Date(`${birthday}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== birthday || birthday > date) return false;
  const age = Number(date.slice(0, 4)) - Number(birthday.slice(0, 4)) - (date.slice(5) < birthday.slice(5) ? 1 : 0);
  return age >= 18;
}
