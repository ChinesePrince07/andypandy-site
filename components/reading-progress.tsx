"use client";

import { motion, useScroll, useSpring, useTransform, useReducedMotion } from "motion/react";
import { useState, useEffect } from "react";

export default function ReadingProgress() {
  const { scrollY, scrollYProgress } = useScroll();
  const shouldReduceMotion = useReducedMotion();
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      setIsComplete(v >= 0.99);
    });
  }, [scrollYProgress]);

  const opacity = useTransform(scrollY, [0, 200], [0, 1]);
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className="fixed left-0 right-0 top-0 z-50 h-[2px] pointer-events-none"
      style={{ opacity }}
    >
      <motion.div
        className="h-full w-full origin-left bg-[var(--accent)]"
        style={{ scaleX: shouldReduceMotion ? scrollYProgress : scaleX }}
        initial={false}
        animate={{ opacity: isComplete ? [1, 0.5] : 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </motion.div>
  );
}
