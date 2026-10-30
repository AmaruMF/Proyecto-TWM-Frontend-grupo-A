import { Chip, Stack, Typography } from '@mui/material';
import PagePanel from '../../components/common/PagePanel';
import SectionHeader from '../../components/common/SectionHeader';
import useMarketplace from '../../hooks/useMarketplace';
import { currency, dateLabel } from '../../utils/commerce';
export default function TransactionsPage() {
  const {
    data
  } = useMarketplace();
  return <><SectionHeader title="Historial de transacciones" /><Stack spacing={2.5}>{data.transactions.map(item => <PagePanel key={item.id}><Stack direction={{
          xs: 'column',
          sm: 'row'
        }} sx={{
          justifyContent: "space-between",
          gap: 1
        }}><Typography component="h2" sx={{
            fontWeight: 800,
            fontSize: 18
          }}>Transacción #{item.id} – {item.seller}</Typography><Typography sx={{
            fontWeight: 900
          }}>{currency(item.total)}</Typography></Stack><Typography sx={{
          my: 2,
          fontWeight: 700
        }}>{item.description} – {dateLabel(item.date)}</Typography><Chip label={item.status} size="small" sx={{
          fontWeight: 800,
          bgcolor: item.status === 'Completada' ? 'background.paper' : item.status === 'Pendiente' ? 'warning.main' : 'secondary.light'
        }} /></PagePanel>)}</Stack></>;
}
