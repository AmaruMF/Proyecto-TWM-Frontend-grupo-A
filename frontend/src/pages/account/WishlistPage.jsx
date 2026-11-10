import { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import SectionHeader from '../../components/common/SectionHeader';
import EmptyState from '../../components/common/EmptyState';
import CatalogGrid from '../../components/catalog/CatalogGrid';
import QuoteDialog from '../../components/catalog/QuoteDialog';
import useMarketplace from '../../hooks/useMarketplace';
import { isFavorite, wishlistEntries } from '../../context/catalogActions';
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
  const [target, setTarget] = useState('');
  const [quote, setQuote] = useState(null);
  const list = data.wishlists.find(item => item.id === activeId) || data.wishlists[0];
  const entries = wishlistEntries(list);
  const products = entries.filter(entry => entry.itemType === 'product').map(entry => data.products.find(item => item.id === entry.itemId)).filter(Boolean);
  const services = entries.filter(entry => entry.itemType === 'service').map(entry => data.services.find(item => item.id === entry.itemId)).filter(Boolean);
  const candidates = [...data.products.map(item => ({ ...item, itemType: 'product' })), ...data.services.map(item => ({ ...item, itemType: 'service' }))].filter(item => !item.hidden && !isFavorite(list, item.id, item.itemType));
  const create = event => {
    event.preventDefault();
    const title = name.trim();
    if (!title || data.wishlists.some(item => item.id !== editingId && item.name.toLocaleLowerCase('es') === title.toLocaleLowerCase('es'))) { setError('Escribe un nombre que no esté vacío ni repetido.'); return; }
    const id = editingId || crypto.randomUUID();
    setData(current => ({ ...current, wishlists: editingId ? current.wishlists.map(item => item.id === editingId ? { ...item, name: title } : item) : [...current.wishlists, { id, name: title, items: [], productIds: [] }] }));
    setActiveId(id); setName(''); setCreateOpen(false); setEditingId(null); notify(editingId ? 'Lista actualizada.' : 'Lista creada.');
  };
  const add = event => {
    event.preventDefault();
    const separator = target.indexOf(':');
    if (separator < 0) return;
    if (!toggleFavorite(target.slice(separator + 1), list?.id, target.slice(0, separator))) return;
    setAddOpen(false); setTarget(''); notify('Publicación guardada en la lista.');
  };
  return <><SectionHeader title="Lista de deseos" actionLabel="Crear una lista ＋" onAction={() => { setName(''); setEditingId(null); setError(''); setCreateOpen(true); }} />
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}><TextField select label="Mis listas" value={list?.id || ''} onChange={event => setActiveId(event.target.value)} sx={{ minWidth: { sm: 280 } }}>{data.wishlists.map(item => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</TextField><Button variant="outlined" disabled={!list} onClick={() => { setTarget(''); setAddOpen(true); }}>Agregar producto o servicio a esta lista</Button><Button variant="outlined" disabled={!list} onClick={() => { setEditingId(list.id); setName(list.name); setError(''); setCreateOpen(true); }}>Renombrar lista</Button><Button color="error" disabled={!list} onClick={() => setDeleteTarget(list)}>Eliminar lista</Button></Stack>
    <Typography component="h2" variant="h3" sx={{ mb: 3 }}>{list?.name}</Typography>
    {products.length + services.length ? <>{products.length > 0 && <CatalogGrid items={products} listId={list?.id} />}{services.length > 0 && <Box sx={{ mt: products.length ? 5 : 0 }}>{products.length > 0 && <Typography component="h3" variant="h3" sx={{ mb: 3 }}>Servicios guardados</Typography>}<CatalogGrid items={services} service listId={list?.id} onQuote={setQuote} /></Box>}</> : <EmptyState title={list ? 'Esta lista aún no tiene productos ni servicios' : 'Aún no tienes listas de deseos'} description="Guarda tus favoritos para encontrarlos fácilmente." actionLabel="Explorar productos" onAction={() => navigate('/productos')} icon="heart" />}
    <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth><form onSubmit={create}><DialogTitle>{editingId ? 'Renombrar lista' : 'Crear una lista'}</DialogTitle><DialogContent><TextField autoFocus error={Boolean(error)} helperText={error} label="Nombre de la lista" value={name} onChange={event => setName(event.target.value)} required fullWidth sx={{ mt: 1 }} slotProps={{ htmlInput: { maxLength: 60, pattern: '.*\\S.*' } }} /></DialogContent><DialogActions sx={{ px: 3, pb: 3 }}><Button onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" variant="contained">{editingId ? 'Guardar cambios' : 'Crear lista'}</Button></DialogActions></form></Dialog>
    <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth><Box component="form" onSubmit={add}><DialogTitle>Agregar a {list?.name}</DialogTitle><DialogContent><TextField select label="Producto o servicio" value={target} onChange={event => setTarget(event.target.value)} required fullWidth sx={{ mt: 1 }}>{candidates.map(item => <MenuItem value={`${item.itemType}:${item.id}`} key={`${item.itemType}:${item.id}`}>{item.name} · {item.itemType === 'service' ? 'Servicio' : 'Producto'}</MenuItem>)}</TextField></DialogContent><DialogActions sx={{ px: 3, pb: 3 }}><Button onClick={() => setAddOpen(false)}>Cancelar</Button><Button type="submit" variant="contained" disabled={!target}>Agregar</Button></DialogActions></Box></Dialog>
    <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth><DialogTitle>¿Eliminar {deleteTarget?.name}?</DialogTitle><DialogContent>Se eliminará la lista y sus favoritos. Las publicaciones seguirán en el catálogo.</DialogContent><DialogActions><Button onClick={() => setDeleteTarget(null)}>Cancelar</Button><Button color="error" onClick={() => { setData(current => ({ ...current, wishlists: current.wishlists.filter(item => item.id !== deleteTarget.id) })); setActiveId(''); setDeleteTarget(null); notify('Lista eliminada.'); }}>Eliminar lista</Button></DialogActions></Dialog>
    {quote && <QuoteDialog service={quote} onClose={() => setQuote(null)} />}
  </>;
}
