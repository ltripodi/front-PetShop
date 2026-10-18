import { Box, Paper, Stack, Typography } from '@mui/material';

export default function ShowcaseSection({ title, description, children }) {
  return (
    <Paper component="section" variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography component="h2" variant="h3">{title}</Typography>
          {description && <Typography color="text.secondary" sx={{ mt: 1 }}>{description}</Typography>}
        </Box>
        {children}
      </Stack>
    </Paper>
  );
}
