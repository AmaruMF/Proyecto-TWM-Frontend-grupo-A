import { useState } from 'react';
import { Box, Button, Chip, MenuItem, Stack, TextField, Typography } from '@mui/material';
import PagePanel from '../../components/common/PagePanel';
import SectionHeader from '../../components/common/SectionHeader';
import EmptyState from '../../components/common/EmptyState';
import FinancialDetails from '../../components/orders/FinancialDetails';
import useMarketplace from '../../hooks/useMarketplace';
import { currency, dateLabel } from '../../utils/commerce';

function TransactionCard({ transaction, orders }) {
  const [expanded, setExpanded] = useState(false);
  const refund = transaction.type === 'refund';
  return <PagePanel><Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 1 }}>
    <Typography component="h2" sx={{ fontWeight: 800, fontSize: 18, overflowWrap: 'anywhere' }}>{refund ? 'Reembolso' : 'Transacción'} #{transaction.id} – {transaction.seller}</Typography>
    <Typography sx={{ fontWeight: 900, whiteSpace: 'nowrap' }}>{refund ? '−' : ''}{currency(transaction.total)}</Typography>
  </Stack><Typography sx={{ my: 2, fontWeight: 700, overflowWrap: 'anywhere' }}>{transaction.description} – {dateLabel(transaction.date)}</Typography>
    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}><Box><Chip label={transaction.status} size="small" sx={{ fontWeight: 800, bgcolor: transaction.status === 'Completada' ? 'background.paper' : transaction.status === 'Pendiente' ? 'warning.main' : 'secondary.light' }} />{refund && <Chip label="Reembolso" size="small" sx={{ ml: 1, bgcolor: 'secondary.light' }} />}</Box><Button variant="outlined" onClick={() => setExpanded(!expanded)}>{expanded ? 'Ocultar detalle' : 'Ver detalle financiero'}</Button></Stack>
    {expanded && <FinancialDetails transaction={transaction} orders={orders} />}
  </PagePanel>;
}

export default function TransactionsPage() {
  const { data, session } = useMarketplace();
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');
  const allowed = (data.transactions || []).filter(item => session?.role === 'seller' ? item.companyId === data.company?.id : item.customerId === session?.accountId);
  const transactions = allowed.filter(item => (status === 'all' || item.status === status) && (type === 'all' || (type === 'refund' ? item.type === 'refund' : item.type !== 'refund')) && `${item.id} ${item.orderId || ''} ${item.description || ''} ${item.seller || ''}`.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))).sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date));
  const orders = [...(data.orders || []), ...(data.sales || [])];
  return <><SectionHeader title="Historial de transacciones" />
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}><TextField select label="Estado de transacción" value={status} onChange={event => setStatus(event.target.value)} sx={{ minWidth: { sm: 200 } }}><MenuItem value="all">Todos los estados</MenuItem>{['Pendiente', 'Completada', 'Cancelada'].map(value => <MenuItem value={value} key={value}>{value}</MenuItem>)}</TextField><TextField select label="Tipo de movimiento" value={type} onChange={event => setType(event.target.value)} sx={{ minWidth: { sm: 200 } }}><MenuItem value="all">Todos los movimientos</MenuItem><MenuItem value="payment">Pagos</MenuItem><MenuItem value="refund">Reembolsos</MenuItem></TextField><TextField label="Buscar operación o pedido" value={search} onChange={event => setSearch(event.target.value)} fullWidth /></Stack>
    <Stack spacing={2.5}>{transactions.map(item => <TransactionCard transaction={item} orders={orders} key={item.id} />)}</Stack>
    {!transactions.length && <EmptyState title="No hay transacciones que coincidan" />}
  </>;
}
