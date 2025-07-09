import React from "react";
import { useTranslation } from "react-i18next";
import {
  FaHandshake,
  FaUsers,
  FaBalanceScale,
  FaStore,
  FaTruck,
  FaWhatsapp,
  FaLaptop,
  FaHeadphones,
  FaMobile,
  FaTools,
  FaPhone,
  FaUtensils,
  FaGlobe,
  FaCode,
} from "react-icons/fa";
import { Navbar } from "@/components/Navbar";

import Footer from "@/components/Footer";
import { CONTACT_PHONES, DEFAULT_SUPPLIER } from "@/constants/supplier";
import { Topbar } from "@/components/Topbar";

const storeOwner = {
  name: "الشيف محمد أحمد",
  image: "chef.jpg",
};

const appDeveloper = {
  name: "Ibrahim Mohammed",
  title: "مطور التطبيق",
  image: "/placeholder.svg",
};

const features = [
  {
    icon: FaUtensils,
    title: "جميع المطاعم في مكان واحد",
    description: "نوفر لك قائمة شاملة بجميع المطاعم المحلية مع قوائم الطعام الكاملة",
  },
  {
    icon: FaGlobe,
    title: "سهولة الطلب",
    description: "اطلب من أي مطعم بضغطة واحدة بدون الحاجة للذهاب للمطعم لمعرفة القائمة",
  },
  {
    icon: FaTruck,
    title: "توصيل سريع",
    description: "نضمن لك وصول طلبك ساخنًا وطازجًا في أسرع وقت ممكن",
  },
];

export default function About() {
  const { t } = useTranslation();

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("مرحباً، أريد معلومات أكثر عن خدماتكم");
    const phoneWithCountryCode = `20${DEFAULT_SUPPLIER.phone.replace(
      /^0+/,
      ""
    )}`;
    window.open(
      `https://wa.me/${phoneWithCountryCode}?text=${message}`,
      "_blank"
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative bg-primary/5 py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
          <div className="container relative">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6">من نحن</h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                نحن منصة رائدة تجمع جميع المطاعم المحلية في مكان واحد لتسهيل عملية الطلب عليكم.
                بدلاً من الذهاب إلى كل مطعم لمعرفة قائمة الطعام، يمكنكم الآن تصفح جميع المطاعم وقوائمها من منزلكم المريح.
              </p>
              <button
                onClick={handleWhatsAppClick}
                className="bg-primary text-white py-3 px-8 rounded-full hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <FaWhatsapp className="text-xl" />
                تواصل معنا
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container py-16">
          <h2 className="text-3xl font-bold text-center mb-12">مميزاتنا</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow text-center"
              >
                <feature.icon className="text-5xl text-primary mb-6 mx-auto" />
                <h3 className="text-xl font-semibold mb-4">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Our Story */}
        <div className="bg-primary/5 py-16">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold">فكرتنا</h2>
                <div className="space-y-4">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    جاءت فكرة هذا المشروع من حاجة الناس للراحة والسهولة في طلب الطعام.
                    بدلاً من الذهاب إلى كل مطعم لمعرفة قائمة الطعام والأسعار، قررنا إنشاء منصة تجمع جميع المطاعم المحلية في مكان واحد.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    هدفنا هو تسهيل عملية الطلب عليكم وتوفير الوقت والجهد، مع ضمان جودة الطعام وسرعة التوصيل.
                  </p>
                </div>
              </div>
              <div className="relative h-[500px] rounded-2xl overflow-hidden">
                <img
                  src="logo.png"
                  alt="شعار الموقع"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="container py-16">
          <h2 className="text-3xl font-bold text-center mb-12">قيمنا</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <FaUsers className="text-4xl text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-4">خدمة العملاء</h3>
              <p className="text-muted-foreground">
                نضع رضاكم في المقام الأول ونوفر لكم أفضل خدمة عملاء على مدار الساعة
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <FaBalanceScale className="text-4xl text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-4">الجودة</h3>
              <p className="text-muted-foreground">
                نتعامل فقط مع أفضل المطاعم لضمان جودة الطعام المقدم لكم
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <FaHandshake className="text-4xl text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-4">الموثوقية</h3>
              <p className="text-muted-foreground">
                نلتزم بمواعيد التوصيل ونضمن لكم تجربة طلب موثوقة وآمنة
              </p>
            </div>
          </div>
        </div>

        {/* Store Owner Section */}


        {/* App Developer Section */}
        <div className="bg-gray-50 py-20">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-center gap-16 border-gray-200 border p-4 rounded-lg bg-white">
                {/* Profile Image Container */}
                <div className="relative">
                  <div className="w-48 h-48 rounded-2xl overflow-hidden border-4 border-primary/10 shadow-lg transform hover:scale-105 transition-transform duration-300">
                    <img
                      src={appDeveloper.image}
                      alt={appDeveloper.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                    <FaCode className="w-7 h-7 text-primary" />
                  </div>
                </div>

                {/* Content Container */}
                <div className="text-center md:text-right flex-1 space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      {appDeveloper.name}
                    </h3>
                    <p className="text-primary font-medium text-xl">
                      {appDeveloper.title}
                    </p>
                  </div>

                  <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto md:mx-0">
                    مطور التطبيق المسؤول عن تصميم وتطوير هذه المنصة الرقمية.
                    عمل على تحويل فكرة صاحب المشروع إلى تطبيق عملي وسهل الاستخدام،
                    مع التركيز على تجربة المستخدم والواجهة الجذابة.
                  </p>

                  {/* Contact Information */}
                  <div className="flex flex-col sm:flex-row items-center justify-center md:justify-end gap-6 pt-6">
                    <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                      <FaCode className="w-6 h-6 text-primary" />
                      <span className="font-medium text-xl">
                        React Developer
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
