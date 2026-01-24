// // src/components/SEO/CareerConstellation.tsx
// 'use client';

// import React, { useState } from 'react';
// import { Box, Typography, Paper, IconButton } from '@mui/material';
// import { useTranslations } from 'next-intl';
// import { motion, AnimatePresence } from 'framer-motion';
// import CloseIcon from '@mui/icons-material/Close';

// // Тип для узла созвездия
// type Node = {
//   id: string;
//   labelKey: string;
//   detailsKey: string;
//   cx: number;
//   cy: number;
// };

// // Данные для узлов (координаты в SVG)
// const nodes: Node[] = [
//   { id: 'skills', labelKey: 'map_node_skills', detailsKey: 'map_node_skills_desc', cx: 50, cy: 10 },
//   { id: 'market', labelKey: 'map_node_market', detailsKey: 'map_node_market_desc', cx: 85, cy: 35 },
//   { id: 'role', labelKey: 'map_node_role', detailsKey: 'map_node_role_desc', cx: 85, cy: 75 },
//   { id: 'growth', labelKey: 'map_node_growth', detailsKey: 'map_node_growth_desc', cx: 50, cy: 100 },
//   { id: 'risks', labelKey: 'map_node_risks', detailsKey: 'map_node_risks_desc', cx: 15, cy: 75 },
//   { id: 'values', labelKey: 'map_node_values', detailsKey: 'map_node_values_desc', cx: 15, cy: 35 },
// ];

// // Соединительные линии
// const lines = [
//   { x1: 50, y1: 10, x2: 85, y2: 35 },
//   { x1: 85, y1: 35, x2: 85, y2: 75 },
//   { x1: 85, y1: 75, x2: 50, y2: 100 },
//   { x1: 50, y1: 100, x2: 15, y2: 75 },
//   { x1: 15, y1: 75, x2: 15, y2: 35 },
//   { x1: 15, y1: 35, x2: 50, y2: 10 },
// ];

// export const CareerConstellation = () => {
//   const t = useTranslations('CareerTarot');
//   const [selectedNode, setSelectedNode] = useState<Node | null>(null);

//   return (
//     <Paper
//       elevation={3}
//       sx={{
//         position: 'relative',
//         p: { xs: 1, sm: 2 },
//         background: 'rgba(0,0,0,0.2)',
//         border: '1px solid rgba(255,255,255,0.1)',
//         borderRadius: 2,
//         overflow: 'hidden',
//       }}
//     >
//       <Box sx={{ width: '100%', maxWidth: '500px', mx: 'auto' }}>
//         <svg viewBox="0 0 100 110" width="100%" height="100%">
//           {/* Линии созвездия */}
//           <g>
//             {lines.map((line, index) => (
//               <motion.line
//                 key={index}
//                 x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
//                 stroke="rgba(216, 183, 221, 0.2)"
//                 strokeWidth="0.5"
//                 initial={{ pathLength: 0 }}
//                 animate={{ pathLength: 1 }}
//                 transition={{ duration: 1, delay: index * 0.1 }}
//               />
//             ))}
//           </g>
//           {/* Узлы (звезды) созвездия */}
//           <g>
//             {nodes.map((node) => (
//               <motion.g
//                 key={node.id}
//                 onClick={() => setSelectedNode(node)}
//                 style={{ cursor: 'pointer' }}
//                 whileHover={{ scale: 1.1 }}
//               >
//                 <motion.circle
//                   cx={node.cx}
//                   cy={node.cy}
//                   r="4"
//                   fill="#D8B7DD"
//                   stroke="#fff"
//                   strokeWidth="0.5"
//                   animate={{
//                     scale: selectedNode?.id === node.id ? [1, 1.5, 1] : 1,
//                     boxShadow: selectedNode?.id === node.id 
//                         ? '0 0 15px #D8B7DD' 
//                         : '0 0 5px rgba(216, 183, 221, 0.5)'
//                   }}
//                   transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
//                 />
//                 <text x={node.cx} y={node.cy - 7} textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.9)">
//                   {t(node.labelKey)}
//                 </text>
//               </motion.g>
//             ))}
//           </g>
//         </svg>
//       </Box>

//       <AnimatePresence>
//         {selectedNode && (
//           <Box
//             component={motion.div}
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: 20 }}
//             transition={{ duration: 0.3 }}
//             sx={{
//               position: 'absolute',
//               bottom: 0,
//               left: 0,
//               right: 0,
//               background: 'rgba(12, 11, 25, 0.9)',
//               backdropFilter: 'blur(10px)',
//               p: 3,
//               borderTop: '1px solid #D8B7DD',
//             }}
//           >
//             <IconButton
//               onClick={() => setSelectedNode(null)}
//               sx={{ position: 'absolute', top: 8, right: 8, color: 'white' }}
//             >
//               <CloseIcon />
//             </IconButton>
//             <Typography variant="h6" fontWeight="bold" sx={{ color: '#D8B7DD', mb: 1 }}>
//               {t(selectedNode.labelKey)}
//             </Typography>
//             <Typography sx={{ color: 'rgba(255,255,255,0.85)' }}>
//               {t(selectedNode.detailsKey)}
//             </Typography>
//           </Box>
//         )}
//       </AnimatePresence>
//     </Paper>
//   );
// };

// src/components/SEO/CareerConstellation.tsx
'use client';

import React, { useState } from 'react';
import { Box, Typography, Paper, IconButton } from '@mui/material';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';

// Тип для узла созвездия
type Node = {
  id: string;
  labelKey: string;
  detailsKey: string;
  cx: number;
  cy: number;
};

// ОБНОВЛЕННЫЕ данные для узлов (координаты в SVG)
const nodes: Node[] = [
  { id: 'skills', labelKey: 'map_node_skills', detailsKey: 'map_node_skills_desc', cx: 50, cy: 18 }, // Чуть ниже
  { id: 'market', labelKey: 'map_node_market', detailsKey: 'map_node_market_desc', cx: 85, cy: 40 },
  { id: 'role', labelKey: 'map_node_role', detailsKey: 'map_node_role_desc', cx: 85, cy: 80 },
  { id: 'growth', labelKey: 'map_node_growth', detailsKey: 'map_node_growth_desc', cx: 50, cy: 95 }, // Чуть выше
  { id: 'risks', labelKey: 'map_node_risks', detailsKey: 'map_node_risks_desc', cx: 15, cy: 80 },
  { id: 'values', labelKey: 'map_node_values', detailsKey: 'map_node_values_desc', cx: 15, cy: 40 },
];

// ОБНОВЛЕННЫЕ Соединительные линии
const lines = [
  { x1: 50, y1: 18, x2: 85, y2: 40 },
  { x1: 85, y1: 40, x2: 85, y2: 80 },
  { x1: 85, y1: 80, x2: 50, y2: 95 },
  { x1: 50, y1: 95, x2: 15, y2: 80 },
  { x1: 15, y1: 80, x2: 15, y2: 40 },
  { x1: 15, y1: 40, x2: 50, y2: 18 },
];

export const CareerConstellation = () => {
  const t = useTranslations('CareerTarot');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'relative',
        p: { xs: 1, sm: 2 },
        background: 'rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: '500px', mx: 'auto' }}>
        {/* ОБНОВЛЕННЫЙ viewBox - увеличил высоту, чтобы был запас */}
        <svg viewBox="0 0 100 115" width="100%" height="100%">
          {/* Линии созвездия */}
          <g>
            {lines.map((line, index) => (
              <motion.line
                key={index}
                x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                stroke="rgba(216, 183, 221, 0.2)"
                strokeWidth="0.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: index * 0.1 }}
              />
            ))}
          </g>
          {/* Узлы (звезды) созвездия */}
          <g>
            {nodes.map((node) => (
              <motion.g
                key={node.id}
                onClick={() => setSelectedNode(node)}
                style={{ cursor: 'pointer' }}
                whileHover={{ scale: 1.1 }}
              >
                <motion.circle
                  cx={node.cx}
                  cy={node.cy}
                  r="4"
                  fill="#D8B7DD"
                  stroke="#fff"
                  strokeWidth="0.5"
                  animate={{
                    scale: selectedNode?.id === node.id ? [1, 1.3, 1] : 1, // Меньше пульсация, чтобы не так сильно "прыгало"
                    boxShadow: selectedNode?.id === node.id 
                        ? '0 0 15px #D8B7DD' 
                        : '0 0 5px rgba(216, 183, 221, 0.5)'
                  }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                />
                {/* ОБНОВЛЕННОЕ расположение текста */}
                <text x={node.cx} y={node.cy - 7} textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.9)">
                  {t(node.labelKey)}
                </text>
              </motion.g>
            ))}
          </g>
        </svg>
      </Box>

      <AnimatePresence>
        {selectedNode && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 50 }} // Чуть больше начальное смещение, чтобы не конфликтовать с нижней частью SVG
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }} // И при выходе
            transition={{ duration: 0.3 }}
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(12, 11, 25, 0.9)',
              backdropFilter: 'blur(10px)',
              p: 3,
              borderTop: '1px solid #D8B7DD',
            }}
          >
            <IconButton
              onClick={() => setSelectedNode(null)}
              sx={{ position: 'absolute', top: 8, right: 8, color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#D8B7DD', mb: 1 }}>
              {t(selectedNode.labelKey)}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.85)' }}>
              {t(selectedNode.detailsKey)}
            </Typography>
          </Box>
        )}
      </AnimatePresence>
    </Paper>
  );
};