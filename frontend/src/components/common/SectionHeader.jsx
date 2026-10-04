import { Box, Button, Stack, Typography } from '@mui/material';

function SectionHeader({ eyebrow, title, description, actionLabel, actionIcon, onAction }) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      alignItems={{ xs: 'flex-start', md: 'center' }}
      justifyContent="space-between"
      sx={{ mb: 3 }}
    >
      <Box>
        <Typography variant="overline" sx={{ color: '#FF8400', fontWeight: 900, letterSpacing: 1.2 }}>
          {eyebrow}
        </Typography>
        <Typography variant="h2" sx={{ mt: 0.5 }}>
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 760 }}>
          {description}
        </Typography>
      </Box>
      {actionLabel ? (
        <Button
          variant="contained"
          color="secondary"
          startIcon={actionIcon}
          onClick={onAction}
          sx={{ alignSelf: { xs: 'flex-start', md: 'center' }, whiteSpace: 'nowrap' }}
        >
          {actionLabel}
        </Button>
      ) : null}
    </Stack>
  );
}

export default SectionHeader;
