import { useMemo, useState } from 'react';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import SectionHeader from '../common/SectionHeader';

function buildEmptyRecord(fields) {
  return fields.reduce((record, field) => ({ ...record, [field.name]: field.defaultValue ?? '' }), {});
}

function displayValue(value, fieldName) {
  if (fieldName === 'price' && value !== '') return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
  return value;
}

function CrudModule({ title, description, entityName, fields, initialRows }) {
  const emptyRecord = useMemo(() => buildEmptyRecord(fields), [fields]);
  const [rows, setRows] = useState(initialRows);
  const [formValues, setFormValues] = useState(emptyRecord);
  const [editingRow, setEditingRow] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [query, setQuery] = useState('');

  const visibleRows = rows.filter((row) => fields.some((field) => String(row[field.name] ?? '').toLowerCase().includes(query.trim().toLowerCase())));

  const openCreateForm = () => { setEditingRow(null); setFormValues(emptyRecord); setFormOpen(true); };
  const openEditForm = (row) => { setEditingRow(row); setFormValues({ ...row }); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditingRow(null); setFormValues(emptyRecord); };
  const handleChange = (event) => { const { name, value, type } = event.target; setFormValues((current) => ({ ...current, [name]: type === 'number' ? Number(value) : value })); };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (editingRow) {
      const updatedRecord = { ...formValues, id: editingRow.id };
      setRows((current) => current.map((row) => (row.id === editingRow.id ? updatedRecord : row)));
      console.log(`[TWM] Actualizacion de ${entityName}`, { ...updatedRecord });
    } else {
      const createdRecord = { ...formValues, id: Date.now() };
      setRows((current) => [createdRecord, ...current]);
      console.log(`[TWM] Creacion de ${entityName}`, { ...createdRecord });
    }
    closeForm();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setRows((current) => current.filter((row) => row.id !== deleteTarget.id));
    console.log(`[TWM] Eliminacion de ${entityName}`, { ...deleteTarget });
    setDeleteTarget(null);
  };

  return (
    <Box>
      <SectionHeader
        title={title}
        description={description}
        extraActions={<TextField value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar ${entityName}`} aria-label={`Buscar ${entityName}`} sx={{ minWidth: { sm: 220 } }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />}
        actionLabel={`Nuevo ${entityName}`}
        actionIcon={<AddIcon />}
        onAction={openCreateForm}
      />
      <Paper variant="outlined" sx={{ p: { xs: 1, md: 2 }, bgcolor: '#FFFFFF', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead><TableRow>{fields.map((field) => <TableCell key={field.name}>{field.label}</TableCell>)}<TableCell align="right">Acciones</TableCell></TableRow></TableHead>
            <TableBody>
              {visibleRows.map((row) => <TableRow key={row.id} hover>{fields.map((field) => <TableCell key={field.name}>{field.name === 'status' ? <Chip size="small" label={row[field.name]} sx={{ bgcolor: row[field.name] === 'Activo' ? '#8FA0D8' : row[field.name] === 'Pendiente' ? '#FF8400' : '#F9DFC6', color: '#0B0829', fontWeight: 800 }} /> : displayValue(row[field.name], field.name)}</TableCell>)}<TableCell align="right"><Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}><Tooltip title="Editar"><IconButton aria-label={`Editar ${entityName}`} onClick={() => openEditForm(row)} sx={{ color: '#0B0829' }}><EditIcon /></IconButton></Tooltip><Tooltip title="Eliminar"><IconButton aria-label={`Eliminar ${entityName}`} onClick={() => setDeleteTarget(row)} sx={{ color: '#FF8400' }}><DeleteIcon /></IconButton></Tooltip></Stack></TableCell></TableRow>)}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={formOpen} onClose={closeForm} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle sx={{ pr: 7 }}>{editingRow ? `Editar ${entityName}` : `Crear ${entityName}`}<IconButton aria-label="Cerrar formulario" onClick={closeForm} sx={{ position: 'absolute', right: 12, top: 10 }}><CloseIcon /></IconButton></DialogTitle>
          <DialogContent dividers><Stack spacing={2} sx={{ pt: 0.5 }}>{fields.map((field) => <TextField key={field.name} select={field.type === 'select'} name={field.name} label={field.label} type={field.type === 'select' ? undefined : field.type ?? 'text'} value={formValues[field.name]} onChange={handleChange} required={field.required} fullWidth>{field.options?.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}</TextField>)}</Stack></DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}><Button onClick={closeForm}>Cancelar</Button><Button type="submit" variant="contained" color="primary">{editingRow ? 'Guardar cambios' : 'Crear registro'}</Button></DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent><Typography color="text.secondary">Esta acción quitará el registro de la lista local y quedará registrada en la consola del navegador.</Typography></DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}><Button onClick={() => setDeleteTarget(null)}>Cancelar</Button><Button color="secondary" variant="contained" onClick={confirmDelete}>Eliminar</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

export default CrudModule;
