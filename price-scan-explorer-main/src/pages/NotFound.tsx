
import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <MainLayout>
      <div className="container flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="text-[10rem] font-display font-bold text-primary/20">404</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-3xl font-display font-bold">Page Not Found</div>
              </div>
            </div>
          </div>
          
          <p className="text-xl text-muted-foreground max-w-lg mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to="/">Return to Home</Link>
          </Button>
        </motion.div>
      </div>
    </MainLayout>
  );
}
