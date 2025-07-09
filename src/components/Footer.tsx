import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { CONTACT_PHONES } from "@/constants/supplier";
import initialData from "@/data/store.json";

export default function Footer() {
  const { t } = useTranslation();
  
  // Get regions from store data
  const regions = initialData?.regions || [];
  
  // Get streets for المرج region
  const marjRegion = regions.find(region => region.name === "المرج");
  // بدل الاعتماد فقط على region.streets، استخرج كل الشوارع التي regionId لها يساوي المرج
  const marjStreets = marjRegion && initialData.streets
    ? initialData.streets.filter(street => street.regionId === marjRegion.id)
    : [];

  return (
    <footer className="bg-secondary/10 border-t">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section with Store Name/Logo */}
          <div>
            <h3 className="font-bold text-lg mb-2">{t("footer.aboutUs")}</h3>
            <p className="text-muted-foreground">
            نحن منصة رائدة تجمع جميع المطاعم المحلية في مكان واحد لتسهيل عملية الطلب عليكم. بدلاً من الذهاب إلى كل مطعم لمعرفة قائمة الطعام، يمكنكم الآن تصفح جميع المطاعم وقوائمها من منزلكم المريح            </p>
            <div className="flex gap-4 mt-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("footer.quickLinks")}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-primary">
                  {t("footer.home")}
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-primary">
                  {t("footer.products")}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary">
                  {t("footer.about")}
                </Link>
              </li>
              <li>
                <Link to="/locations" className="hover:text-primary">
                  {t("footer.locations")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Regions - Dynamically generated from store data */}
          <div>
            <h3 className="font-bold text-lg mb-4">المناطق</h3>
            <ul className="space-y-2">
              {regions.length > 0 ? (
                regions.slice(0, 5).map((region, index) => (
                  <li key={index}>
                    <Link
                      to={`/locations?region=${region.id}`}
                      className="text-muted-foreground hover:text-primary"
                    >
                      {region.name}
                    </Link>
                  </li>
                ))
              ) : (
                // Fallback regions
                <>
                  <li>
                    <Link
                      to="/locations"
                      className="text-muted-foreground hover:text-primary"
                    >
                      المرج
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/locations"
                      className="text-muted-foreground hover:text-primary"
                    >
                      عزبة النخل
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/locations"
                      className="text-muted-foreground hover:text-primary"
                    >
                      المطرية
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Streets in المرج Region */}
          <div>
            <h3 className="font-bold text-lg mb-4">شوارع المرج</h3>
            <ul className="space-y-2">
              {marjStreets.length > 0 ? (
                marjStreets.slice(0, 5).map((street, index) => (
                  <li key={index}>
                    <Link
                      to={`/locations?street=${street.id}`}
                      className="text-muted-foreground hover:text-primary"
                    >
                      {street.name}
                    </Link>
                  </li>
                ))
              ) : (
                // Fallback streets
                <>
                  <li>
                    <Link
                      to="/locations"
                      className="text-muted-foreground hover:text-primary"
                    >
                      مؤسسة الزكاة
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/locations"
                      className="text-muted-foreground hover:text-primary"
                    >
                      أبو طالب
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/locations"
                      className="text-muted-foreground hover:text-primary"
                    >
                      قسم المرج
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} - جميع الحقوق محفوظة لدى موقع Menus
          </p>
        </div>
      </div>
    </footer>
  );
}
