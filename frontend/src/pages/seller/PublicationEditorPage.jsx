import { useState } from 'react';
import { Alert, Box, Button, FormControlLabel, Checkbox, MenuItem, Stack, TextField, Typography } from '@mui/material';
import SectionHeader from '../../components/common/SectionHeader';
import PagePanel from '../../components/common/PagePanel';
import useMarketplace from '../../hooks/useMarketplace';
import { navigate } from '../../hooks/useNavigation';
export default function PublicationEditorPage({
  id,
  service = false
}) {
  const {
    data,
    setData,
    notify
  } = useMarketplace();
  const existing = (service ? data.services : data.products).find(item => item.id === id);
  const [values, setValues] = useState(existing ? { ...existing, price: existing.basePrice || existing.price } : {
    name: '',
    category: '',
    subcategory: '',
    price: '',
    stock: '',
    sku: '',
    size: '',
    color: '',
    weight: '',
    material: '',
    duration: '',
    description: '',
    adultOnly: false,
    image: ''
  });
  const [error, setError] = useState('');
  const categories = service ? ['Jardinería', 'Reparaciones', 'Cuidado de adultos', 'Computación y Tecnología', 'Dentistas', 'Contadores y Auditores', 'Clases Particulares', 'Psicólogos', 'Otros servicios'] : ['Tecnología - Computación', 'Tecnología - Celulares', 'Tecnología - Tablets', 'Tecnología', 'Audio y Música', 'Electrodomésticos', 'Calzado - Zapatillas', 'Vídeo y Fotografía', 'Libros', 'Otros productos'];
  const change = field => event => setValues(current => ({
    ...current,
    [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value
  }));
  const upload = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) {
      setError('Selecciona una imagen PNG, JPG o WebP de hasta 1 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setValues(current => ({
        ...current,
        image: reader.result
      }));
      setError('');
    };
    reader.readAsDataURL(file);
  };
  const submit = event => {
    event.preventDefault();
    const price = Number(values.price);
    const originalPrice = Math.max(existing?.originalPrice || price, price);
    const item = {
      ...values,
      id: id || crypto.randomUUID(),
      seller: existing?.seller || data.company?.name || `${data.profile.name} ${data.profile.lastName}`,
      brand: existing?.brand || data.company?.name || 'Multiplaza',
      ...(service ? {} : {
        price,
        originalPrice,
        discount: originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0,
        stock: Number(values.stock)
      })
    };
    setData(current => ({
      ...current,
      [service ? 'services' : 'products']: existing ? current[service ? 'services' : 'products'].map(record => record.id === id ? item : record) : [...current[service ? 'services' : 'products'], item]
    }));
    notify(`${service ? 'Servicio' : 'Producto'} guardado.`);
    navigate(service ? '/servicios-vendedor' : '/inventario');
  };
  return <><SectionHeader title={`${existing ? 'Editar' : 'Agregar'} ${service ? 'servicio' : 'producto'}`} /><Box component="form" onSubmit={submit}><PagePanel sx={{
        borderRadius: 3
      }}><Stack spacing={3}>
    <Typography component="h2" variant="h3">Datos {service ? 'del servicio' : 'del producto'}</Typography><TextField label={`Nombre ${service ? 'del servicio' : 'del producto'}`} value={values.name} onChange={change('name')} required fullWidth slotProps={{
            htmlInput: {
              maxLength: 120
            }
          }} />
    <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr'
            },
            gap: 3
          }}><TextField select label="Categoría" value={values.category} onChange={change('category')} required>{[...new Set([...categories, ...(values.category ? [values.category] : [])])].map(category => <MenuItem key={category} value={category}>{category}</MenuItem>)}</TextField><TextField label="Subcategoría" value={values.subcategory || ''} onChange={change('subcategory')} /></Box>
    <Typography component="h2" variant="h3">Detalles</Typography><Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr'
            },
            gap: 3
          }}>
      {service ? <><TextField label="Tiempo (duración)" required value={values.duration || ''} onChange={change('duration')} placeholder="Ej. 1 hora" /><FormControlLabel control={<Checkbox checked={Boolean(values.adultOnly)} onChange={change('adultOnly')} />} label="Restricción de edad: mayores de 18 años" /></> : <>{[['size', 'Tamaño'], ['color', 'Color'], ['weight', 'Peso'], ['material', 'Material principal'], ['sku', 'SKU']].map(([field, label]) => <TextField key={field} label={label} value={values[field] || ''} onChange={change(field)} required={field === 'sku'} />)}<TextField label="Precio (CLP)" type="number" value={values.price} onChange={change('price')} required slotProps={{
                htmlInput: {
                  min: 1,
                  step: 1
                }
              }} /><TextField label="Stock inicial" type="number" value={values.stock} onChange={change('stock')} required slotProps={{
                htmlInput: {
                  min: 0,
                  max: 999999,
                  step: 1
                }
              }} /></>}
    </Box><TextField label="Descripción" multiline minRows={3} value={values.description || ''} onChange={change('description')} />
    <Box><Button component="label" variant="outlined">{values.image ? 'Cambiar imagen' : 'Agregar imagen'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} hidden /></Button><Typography variant="caption" display="block" sx={{
              mt: 1
            }}>PNG, JPG o WebP · Hasta 1 MB</Typography>{values.image && <Box component="img" src={values.image} alt="Vista previa de la publicación" sx={{
              width: 180,
              height: 150,
              mt: 2,
              objectFit: 'contain',
              borderRadius: 1,
              bgcolor: 'background.paper'
            }} />}</Box>
    {error && <Alert severity="error">{error}</Alert>}
    </Stack></PagePanel><Stack direction={{
        xs: 'column',
        sm: 'row'
      }} sx={{
        mt: 4,
        gap: 2
      }}><Button variant="contained" type="submit" sx={{
          minWidth: {
            md: 260
          }
        }}>Guardar {service ? 'servicio' : 'producto'}</Button><Button variant="outlined" onClick={() => navigate(service ? '/servicios-vendedor' : '/inventario')} sx={{
          minWidth: {
            md: 200
          }
        }}>Cancelar</Button></Stack></Box></>;
}
