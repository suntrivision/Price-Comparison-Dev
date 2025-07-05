
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { SectionHeader } from "@/components/section-header";
import { Search, TrendingUp, UserCircle, ShoppingBasket } from "lucide-react";

const Index = () => {
  return (
    <MainLayout>
      <div className="container py-12">
        {/* Hero Section */}
        <motion.div 
          className="text-center py-16 md:py-24 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find the Best Price for <span className="text-primary">Everything</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10">
            Compare prices across all major retailers and save money on every purchase
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link to="/categories">
                <ShoppingBasket className="h-5 w-5" />
                Browse Categories
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/auth">
                <UserCircle className="h-5 w-5" />
                Sign Up Now
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
          <motion.div 
            className="bg-card rounded-lg p-6 shadow-sm border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Compare Prices</h3>
            <p className="text-muted-foreground">
              Find the best deals and lowest prices from all your favorite stores in one place.
            </p>
          </motion.div>
          
          <motion.div 
            className="bg-card rounded-lg p-6 shadow-sm border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Track Price History</h3>
            <p className="text-muted-foreground">
              See price trends over time and get notified when prices drop on items you're watching.
            </p>
          </motion.div>
          
          <motion.div 
            className="bg-card rounded-lg p-6 shadow-sm border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <UserCircle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2">Personal Account</h3>
            <p className="text-muted-foreground">
              Create an account to save your favorite products and get personalized price alerts.
            </p>
          </motion.div>
        </div>

        {/* CTA Section */}
        <motion.div 
          className="bg-primary/5 rounded-lg p-8 md:p-12 mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <SectionHeader
            title="Ready to start saving?"
            description="Create your free account today and start comparing prices across all major retailers"
          />
          <div className="mt-6">
            <Button asChild size="lg">
              <Link to="/auth">
                Get Started
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default Index;
