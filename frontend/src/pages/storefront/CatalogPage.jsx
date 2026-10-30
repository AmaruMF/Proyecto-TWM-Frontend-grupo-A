import { useState } from 'react';
import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import CatalogGrid from '../../components/catalog/CatalogGrid';
import QuoteDialog from '../../components/catalog/QuoteDialog';
import SectionHeader from '../../components/common/SectionHeader';
import EmptyState from '../../components/common/EmptyState';
import useMarketplace from '../../hooks/useMarketplace';
export default function CatalogPage({
  type = 'products',
  search = ''
}) {
  const {
    data
  } = useMarketplace();
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('featured');
  const [quote, setQuote] = useState(null);
  const service = type === 'services';
  const candidates = (service ? data.services : data.products).filter(item => !item.hidden && (type !== 'offers' || item.discount > 0));
  const categories = [...new Set(candidates.map(item => item.category))];
  const normalizedSearch = search.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const items = candidates.filter(item => (category === 'all' || category === item.category) && `${item.name} ${item.category} ${item.brand || ''} ${item.seller}`.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedSearch)).sort((a, b) => sort === 'price-asc' ? a.price - b.price : sort === 'price-desc' ? b.price - a.price : sort === 'name' ? a.name.localeCompare(b.name, 'es') : 0);
  return <><SectionHeader title={search ? `Resultados para “${search}”` : service ? 'Servicios para ti' : type === 'offers' ? 'Ofertas en productos' : 'Explora nuestros productos'} description={service ? 'Encuentra profesionales y solicita una cotización.' : 'Compara precios y encuentra lo que buscas en Multiplaza.'} />
    <Stack direction={{
      xs: 'column',
      sm: 'row'
    }} spacing={2} sx={{
      mb: 3,
      alignItems: {
        sm: 'center'
      }
    }}><TextField select label="Categoría" value={category} onChange={event => setCategory(event.target.value)} sx={{
        minWidth: {
          sm: 260
        }
      }}><MenuItem value="all">Todas las categorías</MenuItem>{categories.map(label => <MenuItem key={label} value={label}>{label}</MenuItem>)}</TextField><TextField select label="Ordenar por" value={sort} onChange={event => setSort(event.target.value)} sx={{
        minWidth: {
          sm: 210
        }
      }}><MenuItem value="featured">Destacados</MenuItem><MenuItem value="name">Nombre</MenuItem>{!service && <MenuItem value="price-asc">Menor precio</MenuItem>}{!service && <MenuItem value="price-desc">Mayor precio</MenuItem>}</TextField><Typography variant="body2" sx={{
        ml: 'auto !important'
      }}>{items.length} resultados</Typography></Stack>
    {items.length ? <CatalogGrid items={items} service={service} onQuote={setQuote} /> : <EmptyState title="No encontramos resultados" description="Prueba con otro término o categoría." />}
    {search && !service && <Box sx={{
      mt: 5
    }}><Typography component="h2" variant="h3" sx={{
        mb: 3
      }}>Servicios relacionados</Typography><CatalogGrid items={data.services.filter(item => `${item.name} ${item.category}`.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedSearch))} service onQuote={setQuote} /></Box>}
    {quote && <QuoteDialog service={quote} onClose={() => setQuote(null)} />}
  </>;
}
