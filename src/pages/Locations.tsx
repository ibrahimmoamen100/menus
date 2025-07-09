import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";

import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building,
  Phone,
  Clock,
  AlertCircle,
  Truck,
  Store,
  ShoppingBag,
  Book,
  Shirt,
  Footprints,
  Laptop,
  AlertTriangle,
  MessageCircle,
  MapPin,
  User,
  Search,
  Filter,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/store/useStore";
import { Helmet } from "react-helmet-async";
import initialData from "@/data/store.json";

// دالة لتحويل الوقت من 24 إلى 12 ساعة مع AM/PM
function formatTime12Hour(time: string) {
  if (!time) return "";
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr || "00";
  const ampm = hour >= 12 ? "م" : "ص";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
}

export default function Locations() {
  const products = useStore((state) => state.products);

  // حالة لتخزين الفروع الحقيقية
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [branchesError, setBranchesError] = useState("");

  // حالات البحث والتصفية
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedStreet, setSelectedStreet] = useState("all");

  // جلب الفروع من backend
  useEffect(() => {
    setLoadingBranches(true);
    fetch("http://localhost:3001/api/store")
      .then((res) => {
        if (!res.ok) throw new Error("فشل في جلب الفروع");
        return res.json();
      })
      .then((data) => {
        setBranches(Array.isArray(data.branches) ? data.branches : []);
        setLoadingBranches(false);
      })
      .catch((err) => {
        setBranchesError("تعذر تحميل الفروع. حاول لاحقاً.");
        setLoadingBranches(false);
      });
  }, []);

  // الحصول على المناطق والشوارع من البيانات
  const regions = initialData?.regions || [];
  const streets = initialData?.streets || [];

  // تصفية الفروع بناءً على البحث والتصفية
  const filteredBranches = branches.filter((branch) => {
    // تصفية حسب البحث
    const matchesSearch = searchTerm === "" || 
      branch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.phone?.includes(searchTerm);

    // تصفية حسب المنطقة - نربط الفرع بالمنطقة من خلال الشارع
    let matchesRegion = selectedRegion === "all";
    if (selectedRegion !== "all" && branch.streetId) {
      // نجد الشارع الذي ينتمي إليه الفرع
      const branchStreet = streets.find(street => street.id === branch.streetId);
      // نتحقق إذا كان الشارع ينتمي للمنطقة المختارة
      matchesRegion = branchStreet && branchStreet.regionId === selectedRegion;
    }

    // تصفية حسب الشارع
    const matchesStreet = selectedStreet === "all" || 
      branch.streetId === selectedStreet;

    return matchesSearch && matchesRegion && matchesStreet;
  });

  // الحصول على الشوارع المتاحة حسب المنطقة المختارة
  const availableStreets = selectedRegion === "all"
    ? streets
    : streets.filter(street => street.regionId === selectedRegion);

  const handleWhatsApp = (phone: string) => {
    const message = "مرحباً، أنا مهتم بالتواصل معكم";
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  // إعادة تعيين الشارع عند تغيير المنطقة
  const handleRegionChange = (regionId: string) => {
    setSelectedRegion(regionId);
    setSelectedStreet("all"); // إعادة تعيين الشارع
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>مواقع الشركاء - متجرنا</title>
        <meta
          name="description"
          content="تعرف على مواقع شركائنا وكيفية التواصل معهم"
        />
      </Helmet>

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative bg-primary/5 py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6">مواقع الفروع</h1>
              <p className="text-xl text-muted-foreground mb-8">
              نتعامل فقط مع أفضل المطاعم لضمان جودة الطعام المقدم لكم
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="container py-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-6 text-primary flex items-center gap-2">
              <Filter className="w-5 h-5" />
              البحث والتصفية
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث عن فرع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Region Filter */}
              <Select value={selectedRegion} onValueChange={handleRegionChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر المنطقة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المناطق</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Street Filter */}
              <Select value={selectedStreet} onValueChange={setSelectedStreet}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر الشارع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الشوارع</SelectItem>
                  {availableStreets.map((street) => (
                    <SelectItem key={street.id} value={street.id}>
                      {street.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear Filters Button */}
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedRegion("all");
                  setSelectedStreet("all");
                }}
                className="w-full"
              >
                مسح الفلاتر
              </Button>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-600">
              تم العثور على {filteredBranches.length} فرع
              {(searchTerm || selectedRegion !== "all" || selectedStreet !== "all") && (
                <span className="text-primary font-medium">
                  {" "}من أصل {branches.length} فرع
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Branches Section */}
        <div className="container py-10">
          <h2 className="text-3xl font-bold mb-8 text-primary text-center flex items-center justify-center gap-2">
            <Store className="w-7 h-7 text-primary" /> فروعنا
          </h2>
          {loadingBranches ? (
            <div className="text-center text-lg text-gray-500 py-10">
              جاري تحميل الفروع...
            </div>
          ) : branchesError ? (
            <div className="text-center text-red-500 py-10">
              {branchesError}
            </div>
          ) : filteredBranches.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              {searchTerm || selectedRegion !== "all" || selectedStreet !== "all"
                ? "لا توجد نتائج تطابق معايير البحث المحددة."
                : "لا يوجد فروع مضافة حالياً."
              }
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBranches.map((branch, idx) => (
                <Card
                  key={branch.id || idx}
                  className="rounded-2xl shadow-md border border-primary/20 hover:shadow-xl transition-all bg-white"
                >
                  <CardHeader className="flex flex-row items-center gap-3 pb-2">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Store className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-primary mb-1">
                        {branch.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {branch.description}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span>{branch.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-5 h-5 text-primary" />
                      <span>{branch.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-5 h-5 text-primary" />
                      {branch.openingTime || branch.closingTime ? (
                        <span>
                          {branch.openingTime && branch.closingTime
                            ? `من ${formatTime12Hour(
                                branch.openingTime
                              )} حتى ${formatTime12Hour(branch.closingTime)}`
                            : branch.openingTime
                            ? `يفتح: ${formatTime12Hour(branch.openingTime)}`
                            : branch.closingTime
                            ? `يغلق: ${formatTime12Hour(branch.closingTime)}`
                            : null}
                        </span>
                      ) : (
                        <span>{branch.workingHours}</span>
                      )}
                    </div>
                    <Button
                      variant="default"
                      className="w-full flex gap-2 items-center mt-4 bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold text-lg"
                      onClick={() => handleWhatsApp(branch.whatsapp)}
                    >
                      <FaWhatsapp className="w-5 h-5" /> تواصل عبر واتساب
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
