import { Box, Button, Typography } from '@mui/material';
import DesignIcon from './DesignIcon';

export default function EmptyState({ title, description, actionLabel, onAction, icon = 'bag' }) {
  return <Box sx={{ py: 7, px: 2, textAlign: 'center', bgcolor: 'background.paper', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
    <DesignIcon name={icon} />
    <Typography component="h2" variant="h3" sx={{ mt: 2 }}>{title}</Typography>
    {description && <Typography color="text.secondary" sx={{ mt: 1 }}>{description}</Typography>}
    {actionLabel && <Button variant="contained" sx={{ mt: 3 }} onClick={onAction}>{actionLabel}</Button>}
  </Box>;
}
