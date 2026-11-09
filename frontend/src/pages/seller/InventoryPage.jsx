import { useState } from 'react';
import { Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import SectionHeader from '../../components/common/SectionHeader';
import PagePanel from '../../components/common/PagePanel';
import EmptyState from '../../components/common/EmptyState';
import useMarketplace from '../../hooks/useMarketplace';
import { setProductHidden } from '../../utils/commerce';
import { navigate } from '../../hooks/useNavigation';

export default function InventoryPage() {
  const { data, setData, notify } = useMarketplace();
  const [drafts, setDrafts] = useState({});
  const [search, setSearch] = useState('');
  const items = data.products.filter((product) => product.sku && `${product.name} ${product.sku}`.toLowerCase().includes(search.toLowerCase()));
  const save = (event, product) => { event.preventDefault(); const stock = Number(drafts[product.id] ?? product.stock); if (!Number.isInteger(stock) || stock < 0) return; setData((current) => ({ ...current, products: current.products.map((item) => item.id === product.id ? { ...item, stock } : item) })); notify('Stock actualizado.'); };
  return <><SectionHeader title="Mi inventario" actionLabel="＋ Agregar producto" onAction={() => navigate('/nuevo-producto')} extraActions={<TextField label="Buscar nombre o SKU" value={search} onChange={(event) => setSearch(event.target.value)} />} />
    <Stack spacing={3}>{items.map((product) => <PagePanel component="form" onSubmit={(event) => save(event, product)} key={product.id} sx={{ p: { xs: 2.5, md: 3 }, display: 'grid', gridTemplateColumns: { xs: '80px minmax(0, 1fr)', sm: '110px minmax(0, 1fr) 90px auto' }, gap: { xs: 2, md: 3 }, alignItems: 'center' }}>
      {(product.detailImage || product.image) ? <Box component="img" src={product.detailImage || product.image} alt={product.name} sx={{ width: '100%', height: 110, objectFit: 'contain', bgcolor: 'background.paper', borderRadius: 1 }} /> : <Box sx={{ minHeight: 90, display: 'grid', placeItems: 'center', bgcolor: 'background.paper', borderRadius: 1 }}><Typography variant="body2">Sin imagen</Typography></Box>}
      <Box><Typography component="h2" sx={{ fontWeight: 800, fontSize: 18 }}>{product.name}</Typography><Typography variant="body2" sx={{ mt: 1 }}>SKU {product.sku} – {product.category}</Typography><Chip label={product.hidden ? 'Dado de baja' : product.stock === 0 ? 'Sin stock' : product.stock < 3 ? 'Stock bajo' : 'Disponible'} size="small" sx={{ mt: 1.5, bgcolor: product.stock < 3 ? 'warning.main' : 'background.paper', fontWeight: 800 }} /></Box>
      <TextField label={`Stock ${product.sku}`} type="number" value={drafts[product.id] ?? product.stock} onChange={(event) => setDrafts((current) => ({ ...current, [product.id]: event.target.value }))} required slotProps={{ htmlInput: { min: 0, max: 999999, step: 1 } }} />
      <Stack spacing={1}><Button type="submit" variant="contained">Guardar stock</Button><Button variant="outlined" onClick={() => { setData(current => setProductHidden(current, product.id, !product.hidden)); notify(product.hidden ? "Producto reactivado." : "Producto dado de baja. El historial de ventas se conserva."); }}>{product.hidden ? "Reactivar" : "Dar de baja"}</Button></Stack>
    </PagePanel>)}</Stack>{!items.length && <EmptyState title="No hay productos que coincidan" />}
  </>;
}
