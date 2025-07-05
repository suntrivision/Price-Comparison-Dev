import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, Settings, Heart, Users, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const [pathname, setPathname] = useState(location.pathname);

  useEffect(() => {
    setPathname(location.pathname);
  }, [location.pathname]);

  // Navigation items
  const navItems = [
    { name: "Home", href: "/", icon: <Home className="h-5 w-5" /> },
    { name: "Favorites", href: "/favorites", icon: <Heart className="h-5 w-5" /> },
    { name: "Accounts", href: "/accounts", icon: <Users className="h-5 w-5" /> },
    { name: "Settings", href: "/settings", icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 md:gap-6">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-lg font-semibold tracking-tight"
            >
              <img 
                src="/lovable-uploads/89231f98-3e5f-49f4-bacd-98dfc2c19e4d.png" 
                alt="Y3 Logo" 
                className="h-8 w-8"
              />
              <span className="hidden md:inline-block">Product Scan</span>
            </Link>
            
            <div className="hidden lg:block">
              <nav className="flex items-center gap-6 text-sm">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "transition-colors hover:text-foreground/80",
                      pathname === item.href ? "text-foreground font-medium" : "text-foreground/60"
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-block text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
              v4.0
            </span>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}
          </div>
        </div>
      </header>
      
      {/* Mobile Nav */}
      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-30 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto bg-background p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80 md:hidden">
          <div className="relative z-20 grid gap-6 rounded-md p-4">
            <nav className="grid grid-flow-row auto-rows-max text-sm">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-base hover:bg-accent",
                    pathname === item.href ? "bg-accent" : ""
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="flex-1">{children}</main>
      
      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/89231f98-3e5f-49f4-bacd-98dfc2c19e4d.png" 
              alt="Y3 Logo" 
              className="h-6 w-6"
            />
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Y3 Product Scan. All rights reserved.
            </p>
            <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
              v4.0
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            <a href="#" className="hover:underline">Privacy Policy</a> | <a href="#" className="hover:underline">Terms of Service</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
