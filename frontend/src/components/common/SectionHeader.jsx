import { Box, Button, Stack, Typography } from '@mui/material';

function SectionHeader({ title, description, actionLabel, actionIcon, onAction, extraActions }) {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4, alignItems: { xs: 'flex-start', md: 'flex-end' }, justifyContent: 'space-between' }}>
      <Box>
        <Typography sx={{ color: '#0B0829', fontSize: { xs: 30, md: 38 }, lineHeight: 1.08, fontWeight: 900, letterSpacing: '-0.045em' }}>{title}</Typography>
        <Typography sx={{ color: '#6F6B78', mt: 1, maxWidth: 780, fontSize: 16 }}>{description}</Typography>
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
        {extraActions}
        {actionLabel ? <Button variant="contained" color="primary" startIcon={actionIcon} onClick={onAction} sx={{ minHeight: 46, px: 2.5, borderRadius: 1.5, whiteSpace: 'nowrap' }}>{actionLabel}</Button> : null}
      </Stack>
    </Stack>
  );
}

export default SectionHeader;
