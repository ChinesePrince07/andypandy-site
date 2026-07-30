"use client";

import { motion, useReducedMotion } from "motion/react";
import { ReactNode } from "react";

export function StaggerReveal({ children, index }: { children: ReactNode; index: number }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: shouldReduceMotion ? 0 : index * 0.06,
      }}
    >
      {children}
    </motion.div>
  );
}
