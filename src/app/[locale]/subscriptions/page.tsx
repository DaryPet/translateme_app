import SubscriptionsClient from 'src/components/SubscriptionsClient';
import { Box, Container } from '@mui/material';

export default function SubscriptionsPage() {
  return (
    <Container maxWidth="sm">
      <Box mt={10}>
        <SubscriptionsClient />
      </Box>
    </Container>
  );
}
