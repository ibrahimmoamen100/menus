import { Globe, Facebook, Instagram, Twitter, Phone } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { CONTACT_PHONES } from "@/constants/supplier";

export function Topbar() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
    // Update document direction based on language
    document.documentElement.dir = value === "ar" ? "rtl" : "ltr";
  };

  return (
    <div className="bg-primary text-primary-foreground">
      <div className="container flex h-12 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <a
            href={`tel:${CONTACT_PHONES.main}`}
            className="flex items-center gap-2 hover:text-primary-foreground/80"
          >
            <span>

             للأستفسارات و الشكاوي       
            </span>
            {CONTACT_PHONES.main}
            <Phone className="h-4 w-4" />
          </a>

        </div>
        <div className="flex items-center gap-3">
            <a
              href="https://www.facebook.com/groups/elmargstore"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-foreground/80"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-foreground/80"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
      </div>
    </div>
  );
}
