// src/components/Terms/TermsContent.tsx
'use client';
import { useTranslations } from 'next-intl';
import { Typography, Box, List, ListItem } from '@mui/material';

export default function TermsContent() {
  const t = useTranslations();

  return (
    <Box sx={{ color: 'white', maxWidth: 800, mx: 'auto', py: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t('terms.title')}
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        {t('terms.lastUpdated')}
      </Typography>
      <Typography paragraph>{t('terms.intro')}</Typography>

      <Typography variant="h6" sx={{ mt: 4 }}>
        {t('terms.purposeOfServiceTitle')}
      </Typography>
      <Typography paragraph>{t('terms.purposeOfService')}</Typography>

      <Typography variant="h6" sx={{ mt: 4 }}>
        {t('terms.natureOfInformationTitle')}
      </Typography>
      <Typography paragraph>{t('terms.natureOfInformation')}</Typography>

      <Typography variant="h6" sx={{ mt: 4 }}>
        {t('terms.ageRestrictionsTitle')}
      </Typography>
      <Typography paragraph>{t('terms.ageRestrictions')}</Typography>

      <Typography variant="h6" sx={{ mt: 4 }}>
        {t('terms.disclaimerOfLiabilityTitle')}
      </Typography>
       <Typography paragraph>{t('terms.disclaimerOfLiability')}</Typography>


      <Typography variant="h6" sx={{ mt: 4 }}>
        {t('terms.emotionalDependencyRiskTitle')}
      </Typography>
      <Typography paragraph>{t('terms.emotionalDependencyRisk')}</Typography>

      <Typography variant="h6" sx={{ mt: 4 }}>
        {t('terms.refundPolicyTitle')}
      </Typography>
      <Typography paragraph>{t('terms.refundPolicy')}</Typography>

      <Typography variant="h6" sx={{ mt: 4 }}>
        {t('terms.processingTimeTitle')}
      </Typography>
      <Typography paragraph>{t('terms.processingTime')}</Typography>

      <Typography variant="h6" sx={{ mt: 4 }}>
        {t('terms.privacyAndDataTitle')}
      </Typography>
      <Typography paragraph>{t('terms.privacyAndData')}</Typography>
       
       <Typography variant="h6" sx={{ mt: 4 }}>
        {t('terms.jurisdictionTitle')}
      </Typography>
      <Typography paragraph>{t('terms.jurisdiction')}</Typography>

      <Typography variant="h6" sx={{ mt: 4 }}>
        {t('terms.entireAgreementTitle')}
      </Typography>
      <Typography paragraph>{t('terms.entireAgreement')}</Typography>

      <Typography variant="h6" sx={{ mt: 4 }}>
        {t('terms.forceMajeureTitle')}
      </Typography>
      <Typography paragraph>{t('terms.forceMajeure')}</Typography>
 <Typography variant="h6" sx={{ mt: 4 }}>
        {t('terms.consentTitle')}
      </Typography>
      <Typography paragraph>{t('terms.consent')}</Typography>
      <Typography variant="h6" sx={{ mt: 4 }}>
        {t('terms.contactTitle')}
      </Typography>
      <Typography paragraph>{t('terms.contact')}</Typography>
    </Box>
  );
}
