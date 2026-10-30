import { Box, Button, Stack, Typography } from '@mui/material';

function SectionHeader({ eyebrow, title, description, actionLabel, actionIcon, onAction, extraActions }) {
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 4, alignItems: { xs: 'flex-start', md: 'flex-end' }, justifyContent: 'space-between' }}>
      <Box>
        {eyebrow && <Typography variant="overline" color="text.secondary">{eyebrow}</Typography>}
        <Typography component="h1" sx={{ color: 'text.primary', fontSize: { xs: 26, md: 30 }, lineHeight: 1.15, fontWeight: 800, letterSpacing: '-0.035em' }}>{title}</Typography>
        {description && <Typography sx={{ color: 'text.secondary', mt: 1, maxWidth: 780, fontSize: 15 }}>{description}</Typography>}
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
        {extraActions}
        {actionLabel ? <Button variant="contained" color="primary" startIcon={actionIcon} onClick={onAction} sx={{ minHeight: 46, px: 2.5, borderRadius: 1.5, whiteSpace: 'nowrap' }}>{actionLabel}</Button> : null}
      </Stack>
    </Stack>
  );
}

export default SectionHeader;
