import { Paper } from '@mui/material';

export default function PagePanel({ children, sx, ...props }) {
  return <Paper elevation={0} {...props} sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 2, bgcolor: 'secondary.light', border: '1px solid', borderColor: 'divider', ...sx }}>{children}</Paper>;
}
