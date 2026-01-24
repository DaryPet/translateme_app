'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';

const MagicLoader: React.FC = () => {
  const t = useTranslations();

  return (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        zIndex: 2,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          width: 120,
          height: 120,
          mb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 180 180"
          style={{ position: 'absolute', left: 0, top: 0 }}
        >
          <g>
            <circle
              cx="90"
              cy="90"
              r="78"
              stroke="#ffd77a"
              strokeWidth="4"
              fill="none"
              opacity="0.21"
            />
            <circle
              cx="90"
              cy="90"
              r="60"
              stroke="#ffe4b8"
              strokeWidth="2"
              fill="none"
              opacity="0.33"
            />
            <circle
              cx="90"
              cy="90"
              r="50"
              stroke="#ffd77a"
              strokeWidth="1"
              fill="none"
              opacity="0.5"
            />
            <g>
              <circle
                cx="90"
                cy="90"
                r="42"
                fill="none"
                stroke="#fff7cc"
                strokeWidth="1.5"
                opacity="0.25"
              />
              <circle cx="90" cy="35" r="3" fill="#ffd77a" />
              <circle cx="90" cy="145" r="2.1" fill="#fff7cc" />
              <circle cx="145" cy="90" r="2.6" fill="#ffe4b8" />
              <circle cx="35" cy="90" r="1.8" fill="#ffd77a" />
            </g>
          </g>
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 90 90"
              to="360 90 90"
              dur="2.7s"
              repeatCount="indefinite"
            />
            <circle cx="90" cy="34" r="5" fill="#ffd77a" opacity="0.9" />
            <circle cx="150" cy="90" r="3" fill="#fff7cc" opacity="0.6" />
            <circle cx="90" cy="146" r="3.5" fill="#ffe4b8" opacity="0.7" />
            <circle cx="32" cy="90" r="2.2" fill="#ffd77a" opacity="0.7" />
          </g>
        </svg>
      </Box>
      {/* Надпись */}
      <Typography
        sx={{
          fontFamily: 'Cormorant Garamond, serif',
          fontWeight: 500,
          fontSize: 20,
          letterSpacing: 2,
          color: '#ffd77a',
          textShadow: '0 2px 14px #181426, 0 1px 5px #ffd77a99',
          mb: 1,
          animation: 'fadeInText 1.5s',
        }}
      >
        {t('generatingReading', {
          defaultMessage: 'Generating your reading',
        })}
      </Typography>
      <style>{`
        @keyframes fadeInText {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Box>
  );
};

export default MagicLoader;
