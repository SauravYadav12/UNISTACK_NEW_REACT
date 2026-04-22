import { CardContent, Typography, Stack, Box, alpha } from '@mui/material';
import { tokens } from '../../theme/theme';

type Props = {
  title?: string;
  subtitle?: string | JSX.Element;
  action?: JSX.Element;
  footer?: JSX.Element;
  cardheading?: string | JSX.Element;
  headtitle?: string | JSX.Element;
  headsubtitle?: string | JSX.Element;
  children?: JSX.Element;
  middlecontent?: string | JSX.Element;
  boxShadow?: boolean;
  p?: string;
};

const ChartCardWrapper = ({
  title,
  subtitle,
  children,
  action,
  footer,
  cardheading,
  headtitle,
  headsubtitle,
  middlecontent,
  p = '24px',
}: Props) => {
  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        bgcolor: 'background.paper',
        borderRadius: 4,
        border: `1px solid`,
        borderColor: 'divider',
        overflow: 'hidden',
        transition: 'box-shadow 0.25s ease',
        '&:hover': {
          boxShadow: tokens.shadows.soft4,
        },
      }}
    >
      {cardheading ? (
        <CardContent>
          <Typography variant="h5">{headtitle}</Typography>
          <Typography variant="body2" color="text.secondary">
            {headsubtitle}
          </Typography>
        </CardContent>
      ) : (
        <CardContent sx={{ p, pl: '32px', pr: '32px' }}>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Box>
              {title && (
                <Typography variant="h5" fontWeight={600} color="text.primary">
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            {action}
          </Stack>

          {children}
        </CardContent>
      )}

      {middlecontent}
      {footer}
    </Box>
  );
};

export default ChartCardWrapper;
