"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, useInView, animate } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  duration?: number;      
  decimals?: number;
  prefix?: string;
  suffix?: string;
  delay?: number;
}

export function AnimatedNumber({
  value,
  duration = 2.5,       
  decimals = 0,
  prefix = "",
  suffix = "",
  delay = 0,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const count = useMotionValue(0);

  const rounded = useTransform(count, (latest) =>
    latest.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  );

  useEffect(() => {
    if (isInView) {
      // Reset
      count.set(0);

      // Lance l'animation avec DURATION fixe
      const controls = animate(count, value, {
        duration,                    
        delay: delay ?? 0,
        ease: "circOut",            
      });

      // Nettoyage si démontage prématuré
      return () => controls.stop();
    }
  }, [isInView, value, count, duration, delay]);

  return (
    <motion.span ref={ref}>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  );
}