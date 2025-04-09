import React from 'react';
import { Card, CardContent, Typography, Stack, Box } from '@mui/material';

type Props = {
  title?: string;
  subtitle?: string;
  action?: JSX.Element | any;
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
  boxShadow = true,
  p = '30px',
}: Props) => {
  return (
    <Card
      sx={{ padding: 0 }}
      variant={undefined}
      style={{
        height: '100%',
        width: '100%',
        ...(!boxShadow && { boxShadow: 'none' }),
      }}
    >
      {cardheading ? (
        <CardContent>
          <Typography variant="h5">{headtitle}</Typography>
          <Typography variant="subtitle2" color="textSecondary">
            {headsubtitle}
          </Typography>
        </CardContent>
      ) : (
        <CardContent sx={{ p }}>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="space-between"
            alignItems={'center'}
            mb={'18px'}
          >
            <Box>
              {title ? (
                <Typography
                  variant="h6"
                  fontWeight={600}
                  fontFamily={`'Plus Jakarta Sans','Plus Jakarta Sans Fallback',Helvetica,Arial,sans-serif`}
                >
                  {title}
                </Typography>
              ) : (
                ''
              )}

              {subtitle ? (
                <Typography variant="subtitle2" color="textSecondary">
                  {subtitle}
                </Typography>
              ) : (
                ''
              )}
            </Box>
            {action}
          </Stack>

          {children}
        </CardContent>
      )}

      {middlecontent}
      {footer}
    </Card>
  );
};

export default ChartCardWrapper;
