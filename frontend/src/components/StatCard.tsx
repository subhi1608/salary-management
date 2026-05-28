import { Card, CardContent, Typography } from '@mui/material';

interface Props { title: string; value: string | number; subtitle?: string }

export function StatCard({ title, value, subtitle }: Props) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography color="text.secondary" gutterBottom variant="body2">{title}</Typography>
        <Typography variant="h5" fontWeight="bold">{value}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      </CardContent>
    </Card>
  );
}
