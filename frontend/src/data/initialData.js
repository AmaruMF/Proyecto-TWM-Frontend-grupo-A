export const userProfile = {
  name: 'Equipo Grupo 5',
  email: 'grupo5@twm.cl',
  role: 'Administrador frontend',
  phone: '+56 9 5555 2026',
  location: 'Santiago, Chile',
};

export const dashboardStats = [
  { label: 'Clientes activos', value: '24', helper: '5 nuevos esta semana' },
  { label: 'Proyectos abiertos', value: '12', helper: '3 en revision' },
  { label: 'Servicios publicados', value: '8', helper: 'Catalogo actualizado' },
];

export const clientFields = [
  { name: 'name', label: 'Nombre del cliente', required: true },
  { name: 'email', label: 'Correo', type: 'email', required: true },
  { name: 'company', label: 'Empresa', required: true },
  { name: 'status', label: 'Estado', type: 'select', options: ['Activo', 'Pendiente', 'Inactivo'], required: true },
];

export const initialClients = [
  { id: 1, name: 'Camila Torres', email: 'camila@andes.cl', company: 'Andes Digital', status: 'Activo' },
  { id: 2, name: 'Luis Mendoza', email: 'lmendoza@novalab.cl', company: 'NovaLab', status: 'Pendiente' },
  { id: 3, name: 'Valentina Rojas', email: 'valentina@surdata.cl', company: 'SurData', status: 'Activo' },
];

export const serviceFields = [
  { name: 'name', label: 'Nombre del servicio', required: true },
  { name: 'category', label: 'Categoria', type: 'select', options: ['Diseno UX', 'Desarrollo', 'Soporte'], required: true },
  { name: 'owner', label: 'Responsable', required: true },
  { name: 'price', label: 'Valor estimado', type: 'number', required: true },
];

export const initialServices = [
  { id: 1, name: 'Landing page corporativa', category: 'Desarrollo', owner: 'Sofia Perez', price: 780000 },
  { id: 2, name: 'Auditoria de experiencia', category: 'Diseno UX', owner: 'Matias Bravo', price: 520000 },
  { id: 3, name: 'Mesa de ayuda mensual', category: 'Soporte', owner: 'Daniela Silva', price: 390000 },
];
