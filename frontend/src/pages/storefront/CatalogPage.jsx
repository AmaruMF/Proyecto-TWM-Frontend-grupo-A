import { useState } from 'react';
import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import CatalogGrid from '../../components/catalog/CatalogGrid';
import QuoteDialog from '../../components/catalog/QuoteDialog';
import CategoryFields from '../../components/forms/CategoryFields';
import SectionHeader from '../../components/common/SectionHeader';
import EmptyState from '../../components/common/EmptyState';
import useMarketplace from '../../hooks/useMarketplace';
import { isCategoryWithin, normalizeItemCategory } from '../../utils/categories';

const normalize = value => String(value).toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function CatalogPage({ type = 'products', search = '' }) {
  const { data } = useMarketplace();
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('featured');
  const [quote, setQuote] = useState(null);
  const service = type === 'services';
  const mixed = Boolean(search || type === 'offers');
  const products = data.products.map(item => normalizeItemCategory(item, 'product'));
  const services = data.services.map(item => ({ ...normalizeItemCategory(item, 'service'), isService: true }));
  const candidates = (service ? services : mixed ? [...products, ...services] : products).filter(item => !item.hidden && (type !== 'offers' || item.discount > 0));
  const query = normalize(search);
  const items = candidates.filter(item => isCategoryWithin(item.categoryId, category) && normalize(`${item.name} ${item.category} ${item.brand || ''} ${item.seller}`).includes(query)).sort((a, b) => sort === 'price-asc' ? a.price - b.price : sort === 'price-desc' ? b.price - a.price : sort === 'name' ? a.name.localeCompare(b.name, 'es') : 0);
  const productItems = items.filter(item => !item.isService);
  const serviceItems = items.filter(item => item.isService);
  return <><SectionHeader title={search ? `Resultados para “${search}”` : service ? 'Servicios para ti' : type === 'offers' ? 'Ofertas en productos y servicios' : 'Explora nuestros productos'} description={service ? 'Encuentra profesionales y solicita una cotización.' : 'Compara precios y encuentra lo que buscas en Multiplaza.'} />
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3, alignItems: { sm: 'flex-start' } }}>
      <Box sx={{ minWidth: { sm: 260 }, flex: 1 }}><CategoryFields value={category} onChange={setCategory} type={mixed ? undefined : service ? 'service' : 'product'} allowParents /></Box>
      <TextField select label="Ordenar por" value={sort} onChange={event => setSort(event.target.value)} sx={{ minWidth: { sm: 210 } }}><MenuItem value="featured">Destacados</MenuItem><MenuItem value="name">Nombre</MenuItem><MenuItem value="price-asc">Menor precio</MenuItem><MenuItem value="price-desc">Mayor precio</MenuItem></TextField>
      <Typography variant="body2" sx={{ ml: 'auto !important', pt: { sm: 4 } }}>{items.length} resultados</Typography>
    </Stack>
    {!items.length ? <EmptyState title="No encontramos resultados" description="Prueba con otro término o categoría." /> : <>
      {productItems.length > 0 && <CatalogGrid items={productItems} />}
      {serviceItems.length > 0 && <Box sx={{ mt: productItems.length ? 5 : 0 }}>{productItems.length > 0 && <Typography component="h2" variant="h3" sx={{ mb: 3 }}>{type === 'offers' ? 'Ofertas en servicios' : 'Servicios relacionados'}</Typography>}<CatalogGrid items={serviceItems} service onQuote={setQuote} /></Box>}
    </>}
    {quote && <QuoteDialog service={quote} onClose={() => setQuote(null)} />}
  </>;
}
