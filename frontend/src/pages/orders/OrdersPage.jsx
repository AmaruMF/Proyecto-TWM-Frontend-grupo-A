import { Stack } from '@mui/material';
import SectionHeader from '../../components/common/SectionHeader';
import OrderCard from '../../components/orders/OrderCard';
import EmptyState from '../../components/common/EmptyState';
import useMarketplace from '../../hooks/useMarketplace';
import { navigate } from '../../hooks/useNavigation';

export default function OrdersPage() {
  const { data } = useMarketplace();
  return <><SectionHeader title="Mis pedidos" />{data.orders.length ? <Stack spacing={2.5}>{data.orders.map((order) => <OrderCard order={order} key={order.id} />)}</Stack> : <EmptyState title="Aún no tienes pedidos" actionLabel="Explorar productos" onAction={() => navigate('/productos')} />}</>;
}
