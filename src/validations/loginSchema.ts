import * as Yup from 'yup';

export const getLoginSchema = (t: (key: string) => string) =>
  Yup.object({
    email: Yup.string().email(t('invalidEmail')).required(t('fieldRequired')),
    password: Yup.string().required(t('fieldRequired')),
  });
