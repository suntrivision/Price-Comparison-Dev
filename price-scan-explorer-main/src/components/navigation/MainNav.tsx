
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserProfileMenu } from "@/components/UserProfileMenu";

export function MainNav() {
  const isMobile = useIsMobile();

  return (
    <div className="container flex h-16 items-center justify-between py-4">
      <Link to="/" className="mr-4 flex items-center space-x-2">
        <img 
          src="/lovable-uploads/89231f98-3e5f-49f4-bacd-98dfc2c19e4d.png" 
          alt="Y3 Logo" 
          className="h-8 w-8"
        />
        <span className="font-bold">Y3</span>
      </Link>
      <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
        <Link to="/categories" className="hover:text-gray-500 transition-colors">
          Categories
        </Link>
        <Link to="/favorites" className="hover:text-gray-500 transition-colors">
          Favorites
        </Link>
        <Link to="/accounts" className="hover:text-gray-500 transition-colors">
          Accounts
        </Link>
      </nav>
      <div className="flex items-center space-x-2">
        <UserProfileMenu />
      </div>
    </div>
  );
}
