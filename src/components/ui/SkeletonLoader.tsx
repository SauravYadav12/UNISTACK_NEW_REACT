import { Skeleton, Stack, Box, Card } from '@mui/material';

interface SkeletonProps {
  variant: 'card' | 'table' | 'form' | 'stats';
  count?: number;
}

function CardSkeleton() {
  return (
    <Card sx={{ p: 2.5, borderRadius: 4 }}>
      <Stack spacing={1.5}>
        <Skeleton variant="rounded" width="40%" height={16} />
        <Skeleton variant="rounded" width="60%" height={28} />
        <Skeleton variant="rounded" width="30%" height={12} />
      </Stack>
    </Card>
  );
}

function TableSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Card sx={{ borderRadius: 4, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={2}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rounded" width={`${20}%`} height={16} />
          ))}
        </Stack>
      </Box>
      {/* Rows */}
      {Array.from({ length: count }).map((_, i) => (
        <Box
          key={i}
          sx={{ p: 2, borderBottom: i < count - 1 ? 1 : 0, borderColor: 'divider' }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Skeleton variant="circular" width={32} height={32} />
            {[1, 2, 3, 4].map((j) => (
              <Skeleton
                key={j}
                variant="rounded"
                width={`${15 + Math.random() * 10}%`}
                height={14}
              />
            ))}
          </Stack>
        </Box>
      ))}
    </Card>
  );
}

function FormSkeleton() {
  return (
    <Card sx={{ p: 3, borderRadius: 4 }}>
      <Stack spacing={3}>
        <Skeleton variant="rounded" width="30%" height={20} />
        <Stack direction="row" spacing={2}>
          <Skeleton variant="rounded" width="100%" height={40} sx={{ borderRadius: 2.5 }} />
          <Skeleton variant="rounded" width="100%" height={40} sx={{ borderRadius: 2.5 }} />
        </Stack>
        <Stack direction="row" spacing={2}>
          <Skeleton variant="rounded" width="100%" height={40} sx={{ borderRadius: 2.5 }} />
          <Skeleton variant="rounded" width="100%" height={40} sx={{ borderRadius: 2.5 }} />
        </Stack>
        <Skeleton variant="rounded" width="100%" height={100} sx={{ borderRadius: 2.5 }} />
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Skeleton variant="rounded" width={100} height={36} sx={{ borderRadius: 6 }} />
          <Skeleton variant="rounded" width={100} height={36} sx={{ borderRadius: 6 }} />
        </Stack>
      </Stack>
    </Card>
  );
}

function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Stack direction="row" spacing={2} flexWrap="wrap">
      {Array.from({ length: count }).map((_, i) => (
        <Box key={i} sx={{ flex: 1, minWidth: 180 }}>
          <CardSkeleton />
        </Box>
      ))}
    </Stack>
  );
}

export default function SkeletonLoader({ variant, count }: SkeletonProps) {
  switch (variant) {
    case 'card':
      return <CardSkeleton />;
    case 'table':
      return <TableSkeleton count={count} />;
    case 'form':
      return <FormSkeleton />;
    case 'stats':
      return <StatsSkeleton count={count} />;
    default:
      return <CardSkeleton />;
  }
}
