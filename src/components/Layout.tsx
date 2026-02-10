import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, LayoutDashboard, Bookmark, BookOpen, User, Menu, X, Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/history", label: "Saved Analyses", icon: Bookmark },
  { path: "/methodology", label: "Methodology", icon: BookOpen },
  { path: "/about", label: "About", icon: User },
];

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                {/* Outer glow */}
                <div className="absolute inset-0 w-11 h-11 rounded-xl bg-gradient-to-br from-primary via-accent to-primary opacity-60 blur-md group-hover:opacity-80 transition-opacity" />
                {/* Main logo container */}
                <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center transition-transform group-hover:scale-105 shadow-lg shadow-primary/20">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="font-display font-bold text-xl text-foreground">
                  Insight<span className="text-primary">Gen</span>
                </span>
                <p className="text-[10px] text-muted-foreground -mt-1">Perspective-Driven Analysis</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            Built with precision by <span className="text-primary font-medium">Varun K</span>
          </p>
        </div>
      </footer>
    </div>
  );
};