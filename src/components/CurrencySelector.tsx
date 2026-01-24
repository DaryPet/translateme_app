// 'use client';

// import React from 'react';
// import { Box, Select, MenuItem, Typography } from '@mui/material';

// const currencies = ['EUR', 'USD', 'CAD', 'UAH', 'RUB'];

// interface Props {
//   value: string;
//   onChange: (value: string) => void;
// }

// const CurrencySelector: React.FC<Props> = ({ value, onChange }) => {
//   return (
//     <Box sx={{ mb: 2, textAlign: 'center' }}>
//       <Typography sx={{ mb: 1, color: 'white' }}>Выберите валюту:</Typography>
//       <Select
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         sx={{ backgroundColor: 'white', minWidth: 120 }}
//       >
//         {currencies.map((cur) => (
//           <MenuItem key={cur} value={cur}>
//             {cur}
//           </MenuItem>
//         ))}
//       </Select>
//     </Box>
//   );
// };

// export default CurrencySelector;
