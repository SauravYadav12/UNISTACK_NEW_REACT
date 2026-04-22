import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Typography, TypographyProps } from '@mui/material';

interface AnimatedCounterProps extends Omit<TypographyProps, 'children'> {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export default function AnimatedCounter({
  value,
  duration = 1,
  prefix = '',
  suffix = '',
  decimals = 0,
  ...typographyProps
}: AnimatedCounterProps) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) =>
    `${prefix}${v.toFixed(decimals)}${suffix}`
  );
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [value, duration, motionValue]);

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => {
      if (ref.current) ref.current.textContent = v;
    });
    return unsubscribe;
  }, [rounded]);

  return (
    <Typography ref={ref} component={motion.span} {...typographyProps}>
      {`${prefix}0${suffix}`}
    </Typography>
  );
}
