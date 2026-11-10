import { Box, MenuItem, TextField, Typography } from '@mui/material';
import { categoryAncestors, categoryById, categoryChildren, categoryPath } from '../../utils/categories';

export default function CategoryFields({ value = '', onChange, type, required = false, allowParents = false }) {
  const rootId = type === 'service' ? '1' : type === 'product' ? '2' : null;
  const selection = categoryById(value);
  const selectedValue = selection && (!type || selection.type === type) ? value : '';
  const path = categoryAncestors(selectedValue).filter(category => !rootId || category.id !== rootId);
  const rows = [];
  let parentId = rootId;
  let level = 0;
  while (categoryChildren(parentId).length) {
    const options = categoryChildren(parentId);
    const selected = path[level]?.parentId === parentId ? path[level].id : '';
    rows.push({ parentId, options, selected, level });
    if (!selected) break;
    parentId = selected; level++;
  }
  return <Box sx={{ minWidth: 0, width: '100%' }}><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5 }}>
    {rows.map(row => <TextField key={row.parentId || 'catalog-type'} select label={!rootId && row.level === 0 ? 'Tipo de catálogo' : row.level === (rootId ? 0 : 1) ? 'Categoría' : row.level === (rootId ? 1 : 2) ? 'Subcategoría' : 'Especialidad'} value={row.selected} onChange={event => onChange(event.target.value || row.parentId || '')} required={required && !allowParents} fullWidth>
      <MenuItem value="">{allowParents ? row.parentId && categoryById(row.parentId)?.parentId ? 'Todas las subcategorías' : 'Todas las categorías' : 'Selecciona una opción'}</MenuItem>
      {row.options.map(category => <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)}
    </TextField>)}
  </Box>{selectedValue && <Typography variant="caption" display="block" sx={{ mt: 1, overflowWrap: 'anywhere' }}>{categoryPath(selectedValue)}</Typography>}</Box>;
}
