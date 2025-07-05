
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

export function MobileNav() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
  };

  return (
    <div className="flex flex-col space-y-3 p-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 font-medium">Navigation</h2>
        <div className="space-y-1">
          <Link to="/" className="block py-2 pl-1 text-muted-foreground hover:text-foreground">Home</Link>
          <Link to="/categories" className="block py-2 pl-1 text-muted-foreground hover:text-foreground">Categories</Link>
          <Link to="/favorites" className="block py-2 pl-1 text-muted-foreground hover:text-foreground">Saved Products</Link>
          <Link to="/accounts" className="block py-2 pl-1 text-muted-foreground hover:text-foreground">Accounts</Link>
          <Link to="/settings" className="block py-2 pl-1 text-muted-foreground hover:text-foreground">Settings</Link>
        </div>
      </div>
      <div className="px-3 py-2">
        <h2 className="mb-2 font-medium">Account</h2>
        <div className="space-y-1">
          {user ? (
            <>
              <div className="block py-2 pl-1 text-muted-foreground">{user.email}</div>
              <button
                onClick={handleSignOut}
                className="block py-2 pl-1 text-muted-foreground hover:text-foreground w-full text-left"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/auth" className="block py-2 pl-1 text-muted-foreground hover:text-foreground">Sign in</Link>
          )}
        </div>
      </div>
    </div>
  );
}
