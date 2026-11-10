import { useState } from 'react';
import { Alert, Box, Button, Divider, FormControlLabel, Checkbox, MenuItem, Stack, TextField, Typography } from '@mui/material';
import SectionHeader from '../../components/common/SectionHeader';
import EmptyState from '../../components/common/EmptyState';
import PagePanel from '../../components/common/PagePanel';
import CategoryFields from '../../components/forms/CategoryFields';
import useMarketplace from '../../hooks/useMarketplace';
import { getVariants } from '../../utils/commerce';
import { categoryPath, normalizeItemCategory, validCategory } from '../../utils/categories';
import { navigate } from '../../hooks/useNavigation';

const attributeLabels = { color: 'Color', size: 'Talla / Tamaño', model: 'Modelo', material: 'Material principal' };
const freshVariant = () => ({ id: crypto.randomUUID(), sku: '', attributes: { color: '', size: '', model: '', material: '' }, price: '', stock: '' });
export default function PublicationEditorPage({ id, service = false }) {
  const { data, savePublication, notify } = useMarketplace();
  const publications = service ? data.ownedServices || [] : data.ownedProducts || [];
  const existing = publications.find(item => item.id === id);
  const [values, setValues] = useState(existing ? {
    ...normalizeItemCategory(existing, service ? 'service' : 'product'), price: existing.basePrice ?? existing.price, relatedProductIds: [...(existing.relatedProductIds || [])],
    durationMinutes: existing.durationMinutes || '',
    variants: service ? [] : getVariants(existing).map(variant => ({ ...variant, price: variant.basePrice ?? variant.price, attributes: { ...variant.attributes } })),
  } : {
    name: '', category: '', categoryId: '', relatedProductIds: [], price: '', stock: '', sku: '', size: '', color: '', weight: '', material: '',
    durationMinutes: '', description: '', adultOnly: false, image: '', variants: [freshVariant()],
  });
  const [error, setError] = useState('');
  const change = field => event => setValues(current => ({ ...current, [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));
  const updateVariant = (variantId, field, value, attribute = false) => setValues(current => ({
    ...current, variants: current.variants.map(variant => variant.id !== variantId ? variant : attribute ? { ...variant, attributes: { ...variant.attributes, [field]: value } } : { ...variant, [field]: value }),
  }));
  const upload = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) { setError('Selecciona una imagen PNG, JPG o WebP de hasta 1 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setValues(current => ({ ...current, image: reader.result })); setError(''); };
    reader.readAsDataURL(file);
  };
  const submit = event => {
    event.preventDefault();
    const price = Number(values.price);
    if (!values.name.trim() || !validCategory(values.categoryId, service ? 'service' : 'product') || !values.sku.trim()) { setError('Completa el nombre, la categoría más específica y el SKU.'); return; }
    if (!Number.isInteger(price) || price < 1) { setError('El precio debe ser un número entero mayor que cero.'); return; }
    if (service && (!Number.isInteger(Number(values.durationMinutes)) || Number(values.durationMinutes) < 1)) { setError('Indica una duración válida en minutos.'); return; }
    if (!service && ['size', 'color', 'weight', 'material'].some(field => !values[field]?.trim())) { setError('Completa tamaño, peso, color y material principal.'); return; }
    let variants = [];
    if (!service) {
      variants = values.variants.length > 1 ? values.variants : [{ ...values.variants[0], sku: values.sku, price, stock: values.stock, attributes: { ...values.variants[0].attributes, size: values.size, color: values.color, material: values.material } }];
      if (variants.some(variant => !variant.sku.trim() || !Number.isInteger(Number(variant.price)) || Number(variant.price) < 1 || !Number.isInteger(Number(variant.stock)) || Number(variant.stock) < 0)) { setError('Cada variante necesita un SKU, un precio entero positivo y un stock entero no negativo.'); return; }
      if (new Set(variants.map(variant => variant.sku.trim().toLowerCase())).size !== variants.length) { setError('Cada variante debe tener un SKU diferente.'); return; }
      if (variants.length > 1 && variants.some(variant => !Object.values(variant.attributes).some(value => String(value).trim()))) { setError('Describe las opciones de cada variante para que el cliente pueda diferenciarlas.'); return; }
      const combinations = variants.map(variant => JSON.stringify(Object.entries(variant.attributes).filter(([, value]) => String(value).trim()).sort().map(([key, value]) => [key, String(value).trim().toLowerCase()])));
      if (new Set(combinations).size !== combinations.length) { setError('Las variantes deben tener combinaciones diferentes.'); return; }
      variants = variants.map(variant => {
        const option = { ...variant, sku: variant.sku.trim(), attributes: Object.fromEntries(Object.entries(variant.attributes).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])), price: Number(variant.price), stock: Number(variant.stock) };
        delete option.basePrice; delete option.originalPrice; delete option.discount; delete option.activeOfferId;
        return option;
      });
    }
    const publication = {
      ...values, id: id || crypto.randomUUID(), name: values.name.trim(), sku: values.sku.trim(), price, originalPrice: price, discount: 0,
      ...(service ? { durationMinutes: Number(values.durationMinutes), duration: `${Number(values.durationMinutes)} minutos` } : { variants, stock: variants.reduce((total, variant) => total + variant.stock, 0), price: Math.min(...variants.map(variant => variant.price)) }),
    };
    delete publication.basePrice;
    delete publication.activeOfferId;
    if (!savePublication(publication, service)) return;
    notify(`${service ? 'Servicio' : 'Producto'} guardado.`);
    navigate(service ? '/servicios-vendedor' : '/inventario');
  };
  if (id && !existing) return <EmptyState title="Publicación no encontrada" actionLabel="Volver a publicaciones" onAction={() => navigate('/publicaciones')} />;
  const multiple = !service && values.variants.length > 1;
  return <><SectionHeader title={`${existing ? 'Editar' : 'Agregar'} ${service ? 'servicio' : 'producto'}`} /><Box component="form" onSubmit={submit}><PagePanel sx={{ borderRadius: 3 }}><Stack spacing={3}>
    <Typography component="h2" variant="h3">Datos {service ? 'del servicio' : 'del producto'}</Typography>
    <TextField label={`Nombre ${service ? 'del servicio' : 'del producto'}`} value={values.name} onChange={change('name')} required fullWidth slotProps={{ htmlInput: { maxLength: 100 } }} />
    <CategoryFields value={values.categoryId} onChange={categoryId => setValues(current => ({ ...current, categoryId, category: categoryPath(categoryId) }))} type={service ? 'service' : 'product'} required />
    <Typography component="h2" variant="h3">Detalles</Typography>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
      {service ? <><TextField label="Tiempo (duración en minutos)" type="number" required value={values.durationMinutes} onChange={change('durationMinutes')} slotProps={{ htmlInput: { min: 1, step: 1 } }} /><TextField label="SKU del servicio" value={values.sku} onChange={change('sku')} required slotProps={{ htmlInput: { maxLength: 50 } }} /></> : <>{[['size', 'Tamaño'], ['color', 'Color'], ['weight', 'Peso'], ['material', 'Material principal'], ['sku', 'SKU del producto']].map(([field, label]) => <TextField key={field} label={label} value={values[field] || ''} onChange={change(field)} required slotProps={{ htmlInput: { maxLength: field === 'sku' ? 50 : 100 } }} />)}</>}
      <TextField label={multiple ? 'Precio de referencia (CLP)' : 'Precio (CLP)'} type="number" value={values.price} onChange={change('price')} required slotProps={{ htmlInput: { min: 1, step: 1 } }} />
      {!service && !multiple && <TextField label="Stock disponible" type="number" value={values.stock} onChange={change('stock')} required slotProps={{ htmlInput: { min: 0, max: 999999, step: 1 } }} />}
      <FormControlLabel control={<Checkbox checked={Boolean(values.adultOnly)} onChange={change('adultOnly')} />} label="Restricción de edad: mayores de 18 años" />
    </Box>
    {!service && <Box><Typography component="h2" variant="h3" sx={{ mb: 2 }}>Variantes</Typography>
      {multiple && <Stack spacing={3}>{values.variants.map((variant, index) => <Box key={variant.id}>
        {index > 0 && <Divider sx={{ mb: 3 }} />}<Typography sx={{ fontWeight: 800, mb: 2 }}>Variante {index + 1}</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
          <TextField label={`SKU variante ${index + 1}`} value={variant.sku} onChange={event => updateVariant(variant.id, 'sku', event.target.value)} required slotProps={{ htmlInput: { maxLength: 50 } }} />
          {[...new Set([...Object.keys(attributeLabels), ...Object.keys(variant.attributes || {})])].map(attribute => <TextField key={attribute} label={`${attributeLabels[attribute] || attribute} · Variante ${index + 1}`} value={variant.attributes?.[attribute] || ''} onChange={event => updateVariant(variant.id, attribute, event.target.value, true)} />)}
          <TextField label={`Precio variante ${index + 1} (CLP)`} type="number" value={variant.price} onChange={event => updateVariant(variant.id, 'price', event.target.value)} required slotProps={{ htmlInput: { min: 1, step: 1 } }} />
          <TextField label={`Stock variante ${index + 1}`} type="number" value={variant.stock} onChange={event => updateVariant(variant.id, 'stock', event.target.value)} required slotProps={{ htmlInput: { min: 0, max: 999999, step: 1 } }} />
        </Box><Button sx={{ mt: 1 }} onClick={() => setValues(current => ({ ...current, variants: current.variants.filter(item => item.id !== variant.id), ...(current.variants.length === 2 ? { sku: current.variants.find(item => item.id !== variant.id).sku, price: current.variants.find(item => item.id !== variant.id).price, stock: current.variants.find(item => item.id !== variant.id).stock, color: current.variants.find(item => item.id !== variant.id).attributes?.color || current.color, size: current.variants.find(item => item.id !== variant.id).attributes?.size || current.size, material: current.variants.find(item => item.id !== variant.id).attributes?.material || current.material } : {}) }))}>Quitar variante</Button>
      </Box>)}</Stack>}
      <Button variant="outlined" sx={{ mt: 2 }} onClick={() => setValues(current => ({ ...current, variants: [...(current.variants.length === 1 ? [{ ...current.variants[0], sku: current.sku, price: current.price, stock: current.stock, attributes: { ...current.variants[0].attributes, size: current.size, color: current.color, material: current.material } }] : current.variants), freshVariant()] }))}>＋ Agregar variante</Button>
    </Box>}
    <TextField label="Descripción" multiline minRows={3} value={values.description || ''} onChange={change('description')} required={service} />
    {!service && <Box><Typography component="h2" variant="h3" sx={{ mb: 2 }}>Productos recomendados</Typography><Typography variant="body2" sx={{ mb: 2 }}>Selecciona productos activos de tu empresa. La recomendación principal se mostrará primero.</Typography><TextField select label="Productos para recomendar" fullWidth value={values.relatedProductIds} onChange={event => setValues(current => ({ ...current, relatedProductIds: typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value }))} slotProps={{ select: { multiple: true, renderValue: selected => selected.map(productId => data.products.find(item => item.id === productId)?.name || 'Publicación no disponible').join(', ') } }}>{(data.ownedProducts || []).filter(item => item.id !== id && (!item.hidden || values.relatedProductIds.includes(item.id))).map(item => <MenuItem value={item.id} key={item.id}>{item.name}{item.hidden ? ' · Dado de baja' : ''}</MenuItem>)}</TextField>{values.relatedProductIds.length > 0 && <TextField select label="Recomendación principal" value={values.relatedProductIds[0]} onChange={event => setValues(current => ({ ...current, relatedProductIds: [event.target.value, ...current.relatedProductIds.filter(productId => productId !== event.target.value)] }))} fullWidth sx={{ mt: 3 }}>{values.relatedProductIds.map(productId => <MenuItem value={productId} key={productId}>{data.products.find(item => item.id === productId)?.name || 'Publicación no disponible'}</MenuItem>)}</TextField>}</Box>}
    <Box><Button component="label" variant="outlined">{values.image ? 'Cambiar imagen' : 'Agregar imagen'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} hidden /></Button><Typography variant="caption" display="block" sx={{ mt: 1 }}>PNG, JPG o WebP · Hasta 1 MB</Typography>{values.image && <Box component="img" src={values.image} alt="Vista previa de la publicación" sx={{ width: 180, height: 150, mt: 2, objectFit: 'contain', borderRadius: 1, bgcolor: 'background.paper' }} />}</Box>
    {error && <Alert severity="error">{error}</Alert>}
  </Stack></PagePanel><Stack direction={{ xs: 'column', sm: 'row' }} sx={{ mt: 4, gap: 2 }}><Button variant="contained" type="submit" sx={{ minWidth: { md: 260 } }}>Guardar {service ? 'servicio' : 'producto'}</Button><Button variant="outlined" onClick={() => navigate(service ? '/servicios-vendedor' : '/inventario')} sx={{ minWidth: { md: 200 } }}>Cancelar</Button></Stack></Box></>;
}
