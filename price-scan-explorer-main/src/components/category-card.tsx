
import { Link } from "react-router-dom";
import { ArrowRight, BarChart2, Coffee, Cookie, Droplet, Leaf, Milk, Package, Apple } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Category } from "@/types";

interface CategoryCardProps {
  category: Category;
  className?: string;
  index: number;
}

const iconMap: Record<string, React.ReactNode> = {
  "droplet": <Droplet className="h-5 w-5" />,
  "grain": <Leaf className="h-5 w-5" />,
  "pepper": <Cookie className="h-5 w-5" />,
  "cookie": <Cookie className="h-5 w-5" />,
  "coffee": <Coffee className="h-5 w-5" />,
  "milk": <Milk className="h-5 w-5" />,
  "package": <Package className="h-5 w-5" />,
  "apple": <Apple className="h-5 w-5" />,
};

export function CategoryCard({ category, className, index }: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link
        to={`/categories/${category.slug}`}
        className={cn(
          "group block rounded-xl border border-border bg-card p-5 transition-all duration-300",
          "hover:border-primary/30 hover:shadow-md",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              {iconMap[category.icon] || <BarChart2 className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-medium">{category.name}</h3>
              <p className="text-xs text-muted-foreground">{category.count} products</p>
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-all duration-300 group-hover:bg-primary group-hover:text-white">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
