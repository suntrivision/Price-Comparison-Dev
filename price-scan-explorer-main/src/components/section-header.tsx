
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  alignment?: "left" | "center" | "right";
  className?: string;
}

export function SectionHeader({ 
  title, 
  description, 
  alignment = "left",
  className 
}: SectionHeaderProps) {
  const alignmentClasses = {
    left: "text-left",
    center: "text-center mx-auto",
    right: "text-right ml-auto"
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        alignmentClasses[alignment],
        "max-w-lg mb-6",
        className
      )}
    >
      <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
      {description && (
        <p className="mt-2 text-muted-foreground">{description}</p>
      )}
    </motion.div>
  );
}
