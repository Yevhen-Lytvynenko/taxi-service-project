import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';
import type { ReactNode } from 'react';

type AnalyticsHintProps = {
  title?: string;
  children: ReactNode;
};

/** Згортаєма підказка для екранів аналітики (за замовчуванням згорнута). */
export function AnalyticsHint({ title = 'Що показує цей екран', children }: AnalyticsHintProps) {
  return (
    <Accordion
      defaultExpanded={false}
      variant="outlined"
      sx={{ mb: 2, borderRadius: 1, '&:before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="analytics-hint-panel">
        <Typography fontWeight={600}>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>{children}</AccordionDetails>
    </Accordion>
  );
}
