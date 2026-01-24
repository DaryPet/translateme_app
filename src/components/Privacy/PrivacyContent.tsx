'use client';
import { useTranslations } from 'next-intl';
import {
  Box,
  Typography,
  List,
  ListItem,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  Divider,
  Paper,
} from '@mui/material';

export default function PrivacyContent() {
  const t = useTranslations();

  // Массивы и таблицы достаем через .raw
  const principles = t.raw('privacy.principles');
  const section1Table = t.raw('privacy.section1Table');
  const section2Body = t.raw('privacy.section2Body');
  const section3Body = t.raw('privacy.section3Body');
  const section4Body = t.raw('privacy.section4Body');
  const section5Body = t.raw('privacy.section5Body');
  const section6Body = t.raw('privacy.section6Body');
  const section7Body = t.raw('privacy.section7Body');
  const section8Body = t.raw('privacy.section8Body');
  const section9Body = t.raw('privacy.section9Body');
  const section10Body = t.raw('privacy.section10Body');
  const section11Body = t.raw('privacy.section11Body');
  const section12Body = t.raw('privacy.section12Body');

  return (
    <Box
      sx={{
        maxWidth: 800,
        mx: 'auto',
        my: { xs: 3, md: 6 },
        px: { xs: 1, sm: 3 },
        py: 3,
        // bgcolor: 'background.paper',
        backgroundColor: 'rgb(152, 159, 210)',
        borderRadius: 3,
        boxShadow: 3,
      }}
    >
      {/* Заголовок и дата */}
      <Typography variant="h4" fontWeight={700} gutterBottom>
        {t('privacy.title')}
      </Typography>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {t('privacy.lastUpdated')}
      </Typography>

      {/* Введение */}
      <Typography variant="body1" sx={{ mb: 2 }}>
        {t('privacy.intro')}
      </Typography>

      {/* Принципы */}
      <Typography variant="h5" sx={{ mt: 4, mb: 1, color: 'primary.main' }}>
        {t('privacy.principlesTitle')}
      </Typography>
      <List dense>
        {principles.map((p: string, idx: number) => (
          <ListItem key={idx} sx={{ pl: 0, display: 'list-item' }}>
            <Typography>{p}</Typography>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 3 }} />

      {/* Секция 1: Таблица */}
      <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
        {t('privacy.section1Title')}
      </Typography>
      <Typography>{t('privacy.section1TableTitle')}</Typography>
      <Paper sx={{ overflowX: 'auto', my: 2, borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ background: 'blue' }}>
            <TableRow>
              {/* <TableCell>
                <b>Категория</b>
              </TableCell>
              <TableCell>
                <b>Примеры</b>
              </TableCell>
              <TableCell>
                <b>Источник</b>
              </TableCell>
              <TableCell>
                <b>Цель</b> */}
              {/* </TableCell> */}
            </TableRow>
          </TableHead>
          <TableBody sx={{ background: 'rgb(172, 177, 213) ' }}>
            {section1Table.map((row: any, idx: number) => (
              <TableRow key={idx}>
                <TableCell>{row.category}</TableCell>
                <TableCell>{row.examples}</TableCell>
                <TableCell>{row.source}</TableCell>
                <TableCell>{row.purpose}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mb: 2, display: 'block' }}
      >
        {t('privacy.section1Note')}
      </Typography>
      <Divider sx={{ my: 3 }} />

      {/* Секция 2 */}
      <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
        {t('privacy.section2Title')}
      </Typography>
      <List dense>
        {section2Body.map((item: string, idx: number) => (
          <ListItem key={idx} sx={{ pl: 0, display: 'list-item' }}>
            <Typography>{item}</Typography>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 3 }} />

      {/* Секция 3 */}
      <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
        {t('privacy.section3Title')}
      </Typography>
      <List dense>
        {section3Body.map((item: string, idx: number) => (
          <ListItem key={idx} sx={{ pl: 0, display: 'list-item' }}>
            <Typography>{item}</Typography>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 3 }} />

      {/* Секция 4 */}
      <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
        {t('privacy.section4Title')}
      </Typography>
      <List dense>
        {section4Body.map((item: string, idx: number) => (
          <ListItem key={idx} sx={{ pl: 0, display: 'list-item' }}>
            <Typography>{item}</Typography>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 3 }} />

      {/* Секция 5 */}
      <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
        {t('privacy.section5Title')}
      </Typography>
      {section5Body.map((item: string, idx: number) => (
        <Typography key={idx} sx={{ mb: 1 }}>
          {item}
        </Typography>
      ))}
      <Divider sx={{ my: 3 }} />

      {/* Секция 6 */}
      <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
        {t('privacy.section6Title')}
      </Typography>
      <List dense>
        {section6Body.map((item: string, idx: number) => (
          <ListItem key={idx} sx={{ pl: 0, display: 'list-item' }}>
            <Typography>{item}</Typography>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 3 }} />

      {/* Секция 7 */}
      <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
        {t('privacy.section7Title')}
      </Typography>
      <List dense>
        {section7Body.map((item: string, idx: number) => (
          <ListItem key={idx} sx={{ pl: 0, display: 'list-item' }}>
            <Typography>{item}</Typography>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 3 }} />

      {/* Секция 8 */}
      <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
        {t('privacy.section8Title')}
      </Typography>
      {section8Body.map((item: string, idx: number) => (
        <Typography key={idx} sx={{ mb: 1 }}>
          {item}
        </Typography>
      ))}
      <Divider sx={{ my: 3 }} />

      {/* Секция 9 */}
      <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
        {t('privacy.section9Title')}
      </Typography>
      {section9Body.map((item: string, idx: number) => (
        <Typography key={idx} sx={{ mb: 1 }}>
          {item}
        </Typography>
      ))}
      <Divider sx={{ my: 3 }} />

      {/* Секция 10 */}
      <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
        {t('privacy.section10Title')}
      </Typography>
      {section10Body.map((item: string, idx: number) => (
        <Typography key={idx} sx={{ mb: 1 }}>
          {item}
        </Typography>
      ))}
      <Divider sx={{ my: 3 }} />

      {/* Секция 11 */}
      <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
        {t('privacy.section11Title')}
      </Typography>
      {section11Body.map((item: string, idx: number) => (
        <Typography key={idx} sx={{ mb: 1 }}>
          {item}
        </Typography>
      ))}
       <Divider sx={{ my: 3 }} />
        {/* Секция 12 */}
       <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>
        {t('privacy.section12Title')}
      </Typography>
      {section11Body.map((item: string, idx: number) => (
        <Typography key={idx} sx={{ mb: 1 }}>
          {item}
        </Typography>
      ))}
    </Box>
  );
}
