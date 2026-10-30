import { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import SectionHeader from '../../components/common/SectionHeader';
import EmptyState from '../../components/common/EmptyState';
import CatalogGrid from '../../components/catalog/CatalogGrid';
import useMarketplace from '../../hooks/useMarketplace';
import { navigate } from '../../hooks/useNavigation';

export default function WishlistPage() {
  const { data, setData, toggleFavorite, notify } = useMarketplace();
  const [activeId, setActiveId] = useState('favorites');
  const [createOpen, setCreateOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [productId, setProductId] = useState('');
  const list = data.wishlists.find((item) => item.id === activeId) || data.wishlists[0];
  const items = data.products.filter((product) => list.productIds.includes(product.id));
  const create = (event) => { event.preventDefault(); const id = crypto.randomUUID(); setData((current) => ({ ...current, wishlists: [...current.wishlists, { id, name: name.trim(), productIds: [] }] })); setActiveId(id); setName(''); setCreateOpen(false); notify('Lista creada.'); };

  return <><SectionHeader title="Lista de deseos" actionLabel="Crear una lista ＋" onAction={() => setCreateOpen(true)} />
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}><TextField select label="Mis listas" value={list.id} onChange={(event) => setActiveId(event.target.value)} sx={{ minWidth: { sm: 280 } }}>{data.wishlists.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</TextField><Button variant="outlined" onClick={() => setAddOpen(true)}>Agregar producto a esta lista</Button></Stack>
    <Typography component="h2" variant="h3" sx={{ mb: 3 }}>{list.name}</Typography>
    {items.length ? <CatalogGrid items={items} listId={list.id} /> : <EmptyState title="Esta lista aún no tiene productos" description="Guarda tus favoritos para encontrarlos fácilmente." actionLabel="Explorar productos" onAction={() => navigate('/productos')} icon="heart" />}
    <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth><form onSubmit={create}><DialogTitle>Crear una lista</DialogTitle><DialogContent><TextField autoFocus label="Nombre de la lista" value={name} onChange={(event) => setName(event.target.value)} required fullWidth sx={{ mt: 1 }} slotProps={{ htmlInput: { maxLength: 60, pattern: '.*\\S.*' } }} /></DialogContent><DialogActions sx={{ px: 3, pb: 3 }}><Button onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" variant="contained">Crear lista</Button></DialogActions></form></Dialog>
    <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth><Box component="form" onSubmit={(event) => { event.preventDefault(); toggleFavorite(productId, list.id); setAddOpen(false); setProductId(''); notify('Producto guardado en la lista.'); }}><DialogTitle>Agregar a {list.name}</DialogTitle><DialogContent><TextField select label="Producto" value={productId} onChange={(event) => setProductId(event.target.value)} required fullWidth sx={{ mt: 1 }}>{data.products.filter((product) => !list.productIds.includes(product.id)).map((product) => <MenuItem value={product.id} key={product.id}>{product.name}</MenuItem>)}</TextField></DialogContent><DialogActions sx={{ px: 3, pb: 3 }}><Button onClick={() => setAddOpen(false)}>Cancelar</Button><Button type="submit" variant="contained" disabled={!productId}>Agregar</Button></DialogActions></Box></Dialog>
  </>;
}
