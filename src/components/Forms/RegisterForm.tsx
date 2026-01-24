'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { Button, TextField, Stack, Typography } from '@mui/material';
import { supabase } from 'src/lib/supabase/supabaseClient';
import { getRegisterSchema } from 'src/validations/registerSchema';
import toast from 'react-hot-toast';
import { LoginForm } from './LoginForm';

type RegisterFormValues = {
  email: string;
  password: string;
  confirmPassword: string;
};

export const RegisterForm = () => {
  const t = useTranslations();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const validationSchema = getRegisterSchema(t);

  return (
    <>
      <Formik<RegisterFormValues>
        initialValues={{ email: '', password: '', confirmPassword: '' }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          setError(null);

          const { error, data } = await supabase.auth.signUp({
            email: values.email,
            password: values.password,
          });

          if (error) {
            toast.error(`${t('registrationError')}: ${error.message}`);
          } else {
            if (!data.session) {
              toast.success(t('emailConfirmationSent'));
            } else {
              toast.success(t('registrationSuccess'));
              router.push('/login');
            }
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
              <Field
                name="confirmPassword"
                as={TextField}
                label={t('confirmPassword')}
                type="password"
                fullWidth
                helperText={<ErrorMessage name="confirmPassword" />}
                error={Boolean(<ErrorMessage name="confirmPassword" />)}
              />
              {error && <Typography color="error">{error}</Typography>}
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {t('signup')}
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    </>
  );
};
