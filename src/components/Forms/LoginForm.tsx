'use client';

import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Button, TextField, Stack, Link as MuiLink } from '@mui/material';
import { supabase } from 'src/lib/supabase/supabaseClient';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import NextLink from 'next/link';

import { LoginFormValues } from 'src/types/auth';
import { getLoginSchema } from 'src/validations/loginSchema';
import { GoogleLoginButton } from '../GoogleLoginButton';

export const LoginForm = () => {
  const t = useTranslations();
  const router = useRouter();

  const validationSchema = getLoginSchema(t);

  return (
    <>
      <Formik<LoginFormValues>
        initialValues={{ email: '', password: '' }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          const { error } = await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password,
          });

          if (error) {
            toast.error(`${t('loginError')}: ${error.message}`);
          } else {
            toast.success(t('loginSuccess'));
            router.push('/');
          }

          setSubmitting(false);
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <Stack spacing={2}>
              <Field
                name="email"
                as={TextField}
                label={t('email')}
                type="email"
                fullWidth
                helperText={<ErrorMessage name="email" />}
                error={Boolean(<ErrorMessage name="email" />)}
              />
              <Field
                name="password"
                as={TextField}
                label={t('password')}
                type="password"
                fullWidth
                helperText={<ErrorMessage name="password" />}
                error={Boolean(<ErrorMessage name="password" />)}
              />
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {t('login')}
              </Button>
              <GoogleLoginButton />
              <MuiLink
                component={NextLink}
                href="/reset-password-request"
                variant="body2"
                alignSelf="flex-end"
              >
                {t('forgotPassword')}
              </MuiLink>
            </Stack>
          </Form>
        )}
      </Formik>
    </>
  );
};
