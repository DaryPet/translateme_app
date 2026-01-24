import * as Yup from 'yup';

export const getRegisterSchema = (t: (key: string) => string) =>
  Yup.object({
    email: Yup.string().email(t('invalidEmail')).required(t('fieldRequired')),
    password: Yup.string()
      .min(6, t('passwordTooShort'))
      .required(t('fieldRequired')),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], t('passwordsDontMatch'))
      .required(t('fieldRequired')),
  });
