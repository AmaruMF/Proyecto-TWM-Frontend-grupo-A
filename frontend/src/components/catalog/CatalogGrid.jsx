import { Box } from '@mui/material';
import ProductCard from './ProductCard';

export default function CatalogGrid({ items, service = false, onQuote, listId, columns = 4 }) {
  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: `repeat(${columns}, minmax(0, 1fr))` }, gap: { xs: 2, md: 3 } }}>{items.map((item) => <ProductCard key={item.id} product={item} service={service} onQuote={onQuote} listId={listId} />)}</Box>;
}
