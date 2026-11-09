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
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [productId, setProductId] = useState('');
  const list = data.wishlists.find((item) => item.id === activeId) || data.wishlists[0];
  const items = data.products.filter((product) => list?.productIds.includes(product.id));
  const create = (event) => {
    event.preventDefault();
    const title = name.trim();
    if (!title || data.wishlists.some(item => item.id !== editingId && item.name.toLocaleLowerCase('es') === title.toLocaleLowerCase('es'))) { setError('Escribe un nombre que no esté vacío ni repetido.'); return; }
    const id = editingId || crypto.randomUUID();
    setData(current => ({ ...current, wishlists: editingId ? current.wishlists.map(item => item.id === editingId ? { ...item, name: title } : item) : [...current.wishlists, { id, name: title, productIds: [] }] }));
    setActiveId(id); setName(''); setCreateOpen(false); setEditingId(null); notify(editingId ? 'Lista actualizada.' : 'Lista creada.');
  };

  return <><SectionHeader title="Lista de deseos" actionLabel="Crear una lista ＋" onAction={() => { setName(''); setEditingId(null); setError(''); setCreateOpen(true); }} />
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}><TextField select label="Mis listas" value={list?.id || ''} onChange={(event) => setActiveId(event.target.value)} sx={{ minWidth: { sm: 280 } }}>{data.wishlists.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</TextField><Button variant="outlined" disabled={!list} onClick={() => setAddOpen(true)}>Agregar producto a esta lista</Button><Button variant="outlined" disabled={!list} onClick={() => { setEditingId(list.id); setName(list.name); setError(''); setCreateOpen(true); }}>Renombrar lista</Button><Button color="error" disabled={!list} onClick={() => setDeleteTarget(list)}>Eliminar lista</Button></Stack>
    <Typography component="h2" variant="h3" sx={{ mb: 3 }}>{list?.name}</Typography>
    {items.length ? <CatalogGrid items={items} listId={list?.id} /> : <EmptyState title={list ? "Esta lista aún no tiene productos" : "Aún no tienes listas de deseos"} description="Guarda tus favoritos para encontrarlos fácilmente." actionLabel="Explorar productos" onAction={() => navigate('/productos')} icon="heart" />}
    <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth><form onSubmit={create}><DialogTitle>{editingId ? "Renombrar lista" : "Crear una lista"}</DialogTitle><DialogContent><TextField autoFocus error={Boolean(error)} helperText={error} label="Nombre de la lista" value={name} onChange={(event) => setName(event.target.value)} required fullWidth sx={{ mt: 1 }} slotProps={{ htmlInput: { maxLength: 60, pattern: '.*\\S.*' } }} /></DialogContent><DialogActions sx={{ px: 3, pb: 3 }}><Button onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" variant="contained">{editingId ? "Guardar cambios" : "Crear lista"}</Button></DialogActions></form></Dialog>
    <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth><Box component="form" onSubmit={(event) => { event.preventDefault(); toggleFavorite(productId, list?.id); setAddOpen(false); setProductId(''); notify('Producto guardado en la lista.'); }}><DialogTitle>Agregar a {list?.name}</DialogTitle><DialogContent><TextField select label="Producto" value={productId} onChange={(event) => setProductId(event.target.value)} required fullWidth sx={{ mt: 1 }}>{data.products.filter((product) => !product.hidden && !list?.productIds.includes(product.id)).map((product) => <MenuItem value={product.id} key={product.id}>{product.name}</MenuItem>)}</TextField></DialogContent><DialogActions sx={{ px: 3, pb: 3 }}><Button onClick={() => setAddOpen(false)}>Cancelar</Button><Button type="submit" variant="contained" disabled={!productId}>Agregar</Button></DialogActions></Box></Dialog>
    <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth><DialogTitle>¿Eliminar {deleteTarget?.name}?</DialogTitle><DialogContent>Se eliminará la lista y sus favoritos. Los productos seguirán en el catálogo.</DialogContent><DialogActions><Button onClick={() => setDeleteTarget(null)}>Cancelar</Button><Button color="error" onClick={() => { setData(current => ({ ...current, wishlists: current.wishlists.filter(item => item.id !== deleteTarget.id) })); setActiveId(''); setDeleteTarget(null); notify('Lista eliminada.'); }}>Eliminar lista</Button></DialogActions></Dialog>
  </>;
}
