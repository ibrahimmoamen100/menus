import { ShoppingCart, Search, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/store/useStore";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ProductFilters } from "@/components/ProductFilters";
import { ProductSearch } from "@/components/ProductSearch";
import { Facebook, Instagram, Twitter, Globe, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTACT_PHONES } from "@/constants/supplier";

const navigation = [
  { name: "navigation.products", href: "/products" },
  { name: "navigation.about", href: "/about" },
  { name: "navigation.locations", href: "/locations" },
  // { name: "navigation.careers", href: "/careers" },
  // { name: "navigation.faq", href: "/faq" },
  // { name: "navigation.delivery", href: "/delivery" },
];

export function Navbar() {
  const cart = useStore((state) => state.cart);
  const setFilters = useStore((state) => state.setFilters);
  const filters = useStore((state) => state.filters);
  const { t, i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
    // Update document direction based on language
    document.documentElement.dir = value === "ar" ? "rtl" : "ltr";
  };

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
      
      // تحديث class للـ body
      if (scrollTop > 10) {
        document.body.classList.add('scrolled');
      } else {
        document.body.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.classList.remove('scrolled');
    };
  }, []);

  if (!mounted) {
    return null;
  }
  return (
    <div className="sticky top-0 left-0 right-0 z-40">
      <nav className={`border-b transition-all duration-100 ${
        isScrolled 
          ? 'bg-background/80 backdrop-blur-md shadow-lg border-gray-200/50' 
          : 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
      }`}>
        <div className="container flex h-auto items-center justify-between py-1 px-4 md:px-8">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-4xl font-bold transition-all duration-300">
              <img 
                src="/logo.png" 
                alt="this logo" 
                className={`transition-all duration-100 ${
                  isScrolled ? 'w-16' : 'w-20'
                }`} 
              />
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-sm font-medium relative group transition-all duration-300 hover:text-primary"
              >
                {t(item.name)}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Link to="/cart">
                <Button variant="outline" size="icon" className="relative">
                  <ShoppingCart className="h-4 w-4" />
                  {cart.length > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      {cart.length}
                    </span>
                  )}
                </Button>
              </Link>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden">
                    <Menu className="h-4 w-4" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                  <div className="py-6">
                    <div className="space-y-4">
                      {navigation.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          className="block text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300"
                        >
                          {t(item.name)}
                        </Link>
                      ))}
                      <Link
                        to="/cart"
                        className="block text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300"
                      >
                        {t("navigation.cart")}
                      </Link>
                    </div>

                    <div className="mt-8 pt-8 border-t">
                      <p className="mb-4 text-sm font-medium">
                        {t("navigation.followUs")}
                      </p>
                      <div className="flex space-x-4">
                        <a
                          href="https://facebook.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary"
                        >
                          <Facebook className="h-5 w-5" />
                        </a>
                        <a
                          href="https://instagram.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary"
                        >
                          <Instagram className="h-5 w-5" />
                        </a>
                        <a
                          href="https://twitter.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary"
                        >
                          <Twitter className="h-5 w-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
