import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { MobileNav } from "./MobileNav";
import { MainNav } from "./MainNav";
import { UserProfileMenu } from "@/components/UserProfileMenu";

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <MainNav />
        <div className="hidden md:flex md:flex-1 md:items-center md:justify-between">
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
              v4.0
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <nav className="flex items-center space-x-2">
              <UserProfileMenu />
            </nav>
          </div>
        </div>
        
        <div className="flex md:hidden flex-1 justify-end space-x-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="pr-0">
              <MobileNav />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
