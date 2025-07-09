import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { orderService } from "@/services/firebase";
import { Order } from "@/types/order";
import { Navbar } from "@/components/Navbar";
import initialData from "@/data/store.json";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/utils/format";
import { toast } from "sonner";
import {
  DollarSign,
  ShoppingCart,
  Package,
  BarChart3,
  Calendar,
  MapPin,
} from "lucide-react";

const Orders = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [isUsingLocalStorage, setIsUsingLocalStorage] = useState(false);

  // الحصول على بيانات المناطق والشوارع
  const regions = initialData?.regions || [];
  const streets = initialData?.streets || [];

  // دالة للحصول على معلومات المنطقة والشارع للفرع
  const getBranchLocationInfo = (branchName: string) => {
    // البحث عن الفرع في بيانات الفروع
    const branch = initialData?.branches?.find(b => b.name === branchName);
    if (!branch) return { region: "غير محدد", street: "غير محدد" };

    // البحث عن الشارع
    const street = streets.find(s => s.id === branch.streetId);
    if (!street) return { region: "غير محدد", street: "غير محدد" };

    // البحث عن المنطقة
    const region = regions.find(r => r.id === street.regionId);
    
    return {
      region: region?.name || "غير محدد",
      street: street.name || "غير محدد"
    };
  };

  // دالة لتنسيق التاريخ
  const formatOrderDate = (date: Date) => {
    try {
      // التحقق من صحة التاريخ
      if (!date) {
        console.log("[DEBUG] Date is null or undefined:", date);
        return "تاريخ غير محدد";
      }
      
      // تحويل التاريخ إلى Date object إذا كان string
      const orderDate = date instanceof Date ? date : new Date(date);
      
      // التحقق من صحة التاريخ بعد التحويل
      if (isNaN(orderDate.getTime())) {
        console.log("[DEBUG] Invalid date after conversion:", date, orderDate);
        return "تاريخ غير محدد";
      }
      
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      console.log("[DEBUG] Formatting date:", {
        original: date,
        converted: orderDate,
        diffDays: diffDays,
        isValid: !isNaN(orderDate.getTime())
      });
      
      if (diffDays === 1) {
        return "اليوم " + orderDate.toLocaleTimeString("ar-EG", { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else if (diffDays === 2) {
        return "أمس " + orderDate.toLocaleTimeString("ar-EG", { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else {
        return orderDate.toLocaleDateString("ar-EG", {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.error("[DEBUG] Error formatting date:", error, date);
      return "تاريخ غير محدد";
    }
  };

  useEffect(() => {
    console.log("[DEBUG] Setting up orders subscription...");
    
    // الاشتراك في التحديثات المباشرة من firebase
    const unsubscribe = orderService.subscribeToOrders((newOrders) => {
      console.log("[DEBUG] Received orders update:", newOrders);
      
      // التحقق من وجود طلبات جديدة
      if (newOrders.length > orders.length) {
        const newOrderCount = newOrders.length - orders.length;
        toast.success(`تم إضافة ${newOrderCount} طلب جديد!`);
      }
      
      setOrders(newOrders);
      setLoading(false);
    });

    // التحقق من نوع الاشتراك لتحديد مصدر البيانات
    if (typeof unsubscribe !== 'function') {
      console.log("[DEBUG] Using localStorage fallback");
      setIsUsingLocalStorage(true);
      toast.info("يتم استخدام البيانات المحلية. تحقق من إعدادات Firebase.");
    } else {
      console.log("[DEBUG] Using Firebase real-time subscription");
    }

    // إضافة معالج الأخطاء
    if (typeof unsubscribe === 'function') {
      return () => {
        console.log("[DEBUG] Cleaning up Firebase subscription");
        unsubscribe();
      };
    } else {
      // إذا كان unsubscribe ليس دالة، فهذا يعني أننا نستخدم localStorage
      return () => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          console.log("[DEBUG] Cleaning up localStorage subscription");
          unsubscribe();
        }
      };
    }
  }, []);

  // تحليل البيانات
  const analytics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      today.getDate()
    );

    // تصفية الطلبات حسب الوقت
    const filteredByTime = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      switch (timeFilter) {
        case "today":
          return orderDate >= today;
        case "week":
          return orderDate >= weekAgo;
        case "month":
          return orderDate >= monthAgo;
        default:
          return true;
      }
    });

    // تصفية حسب الفرع
    const filteredOrders =
      branchFilter === "all"
        ? filteredByTime
        : filteredByTime.filter((order) => order.selectedBranch === branchFilter);

    // إحصائيات عامة
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // إحصائيات الحالات
    const statusStats = {
      pending: filteredOrders.filter((o) => o.status === "pending").length,
      confirmed: filteredOrders.filter((o) => o.status === "confirmed").length,
      preparing: filteredOrders.filter((o) => o.status === "preparing").length,
      ready: filteredOrders.filter((o) => o.status === "ready").length,
      delivered: filteredOrders.filter((o) => o.status === "delivered").length,
      cancelled: filteredOrders.filter((o) => o.status === "cancelled").length,
    };

    // أكثر المنتجات طلباً
    const productStats = filteredOrders.reduce((acc, order) => {
      order.items.forEach((item) => {
        if (acc[item.productName]) {
          acc[item.productName].count += item.quantity;
          acc[item.productName].revenue += item.price * item.quantity;
        } else {
          acc[item.productName] = {
            count: item.quantity,
            revenue: item.price * item.quantity,
            name: item.productName,
          };
        }
      });
      return acc;
    }, {} as Record<string, { count: number; revenue: number; name: string }>);

    const topProducts = Object.values(productStats)
      .sort((a, b) => b.count - a.count);

    // أكثر الفروع نشاطاً
    const branchStats = filteredOrders.reduce((acc, order) => {
      if (acc[order.selectedBranch]) {
        acc[order.selectedBranch].count += 1;
        acc[order.selectedBranch].revenue += order.totalAmount;
      } else {
        acc[order.selectedBranch] = {
          count: 1,
          revenue: order.totalAmount,
          name: order.selectedBranch,
        };
      }
      return acc;
    }, {} as Record<string, { count: number; revenue: number; name: string }>);

    const topBranches = Object.values(branchStats)
      .sort((a, b) => b.count - a.count);

    // إحصائيات زمنية
    const hourlyStats = new Array(24).fill(0);
    const dailyStats = new Array(7).fill(0);

    filteredOrders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const hour = orderDate.getHours();
      const day = orderDate.getDay();
      hourlyStats[hour]++;
      dailyStats[day]++;
    });

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      statusStats,
      topProducts,
      topBranches,
      hourlyStats,
      dailyStats,
      filteredOrders,
    };
  }, [orders, branchFilter, timeFilter]);



  const getDayName = (dayIndex: number) => {
    const days = [
      "الأحد",
      "الإثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ];
    return days[dayIndex];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="container py-8">
          <div className="text-center">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">

      <div className="container py-8">
        {/* تنبيه حالة الاتصال */}
        {isUsingLocalStorage && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-yellow-800">
                يتم استخدام البيانات المحلية. تحقق من إعدادات Firebase للحصول على التحديثات المباشرة.
              </span>
            </div>
          </div>
        )}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">إدارة الطلبات</h1>
          <div className="flex gap-2">
            <Button 
              onClick={async () => {
                try {
                  const result = await orderService.testConnection();
                  if (result.success) {
                    toast.success("تم إنشاء طلب اختبار في Firebase!");
                  } else if (result.blocked) {
                    toast.error("Firebase محظور بواسطة إضافة في المتصفح. استخدم LocalStorage.");
                  } else {
                    toast.error(`فشل الاتصال: ${result.error}`);
                  }
                } catch (error) {
                  console.error("[DEBUG] Connection test failed:", error);
                  toast.error("فشل في اختبار الاتصال");
                }
              }}
              variant="outline"
              size="sm"
            >
              إنشاء طلب اختبار
            </Button>
            <Button 
              onClick={async () => {
                try {
                  const status = await orderService.checkNetworkStatus();
                  console.log("[DEBUG] Network status:", status);
                  
                  if (status.online && status.firebaseAccessible) {
                    toast.success("الاتصال بالإنترنت و Firebase يعملان بشكل صحيح");
                  } else if (!status.online) {
                    toast.error("لا يوجد اتصال بالإنترنت");
                  } else if (!status.firebaseAccessible) {
                    toast.error("Firebase غير متاح - استخدم LocalStorage");
                  }
                } catch (error) {
                  console.error("[DEBUG] Network check failed:", error);
                  toast.error("فشل في فحص حالة الشبكة");
                }
              }}
              variant="outline"
              size="sm"
            >
              فحص الشبكة
            </Button>
            <Button 
              onClick={async () => {
                try {
                  console.log("[DEBUG] Manually refreshing orders...");
                  const orders = await orderService.getOrders();
                  console.log("[DEBUG] Manually fetched orders:", orders);
                  setOrders(orders);
                  toast.success(`تم تحديث الطلبات: ${orders.length} طلب`);
                } catch (error) {
                  console.error("[DEBUG] Manual refresh failed:", error);
                  toast.error("فشل في تحديث الطلبات");
                }
              }}
              variant="outline"
              size="sm"
            >
              تحديث الطلبات
            </Button>
            <Button 
              onClick={() => {
                try {
                  const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
                  console.log("[DEBUG] Local orders:", localOrders);
                  toast.success(`الطلبات المحلية: ${localOrders.length} طلب`);
                } catch (error) {
                  console.error("[DEBUG] Local orders check failed:", error);
                  toast.error("فشل في فحص الطلبات المحلية");
                }
              }}
              variant="outline"
              size="sm"
            >
              فحص المحلي
            </Button>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="الفترة الزمنية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفترات</SelectItem>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="week">آخر أسبوع</SelectItem>
                <SelectItem value="month">آخر شهر</SelectItem>
              </SelectContent>
            </Select>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="تصفية حسب الفرع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفروع</SelectItem>
                {Array.from(new Set(orders.map(order => order.selectedBranch))).sort().map(branch => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                إجمالي الطلبات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {timeFilter !== "all"
                  ? `في ${
                      timeFilter === "today"
                        ? "اليوم"
                        : timeFilter === "week"
                        ? "الأسبوع"
                        : "الشهر"
                    }`
                  : "جميع الفترات"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                إجمالي المبيعات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(analytics.totalRevenue)} جنيه
              </div>
              <p className="text-xs text-muted-foreground">
                متوسط الطلب: {formatPrice(analytics.averageOrderValue)} جنيه
              </p>
            </CardContent>
          </Card>


        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="products">أفضل المنتجات</TabsTrigger>
            <TabsTrigger value="branches">أفضل الفروع</TabsTrigger>
            <TabsTrigger value="orders">قائمة الطلبات</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">

            {/* إحصائيات زمنية */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    الطلبات حسب الساعة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.hourlyStats.map((count, hour) => {
                      // تحويل إلى تنسيق 12 ساعة
                      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                      const period = hour < 12 ? 'ص' : 'م';
                      
                      return (
                        <div key={hour} className="flex items-center gap-2">
                          <span className="text-xs w-12">{displayHour}:00 {period}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  (count / Math.max(...analytics.hourlyStats)) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-xs w-8">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    الطلبات حسب اليوم
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.dailyStats.map((count, day) => (
                      <div key={day} className="flex items-center gap-2">
                        <span className="text-xs w-16">{getDayName(day)}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${
                                (count / Math.max(...analytics.dailyStats)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-xs w-8">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            {/* إحصائيات سريعة للمنتجات */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي المنتجات المطلوبة</p>
                      <p className="text-2xl font-bold text-blue-600">{analytics.topProducts.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي الكميات المباعة</p>
                      <p className="text-2xl font-bold text-green-600">
                        {analytics.topProducts.reduce((sum, product) => sum + product.count, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي مبيعات المنتجات</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatPrice(analytics.topProducts.reduce((sum, product) => sum + product.revenue, 0))} جنيه
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  جميع المنتجات مرتبة حسب الطلب ({analytics.topProducts.length} منتج)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المرتبة</TableHead>
                      <TableHead>اسم المنتج</TableHead>
                      <TableHead>عدد الطلبات</TableHead>
                      <TableHead>النسبة المئوية</TableHead>
                      <TableHead>إجمالي المبيعات</TableHead>
                      <TableHead>متوسط سعر الوحدة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.topProducts.map((product, index) => {
                      const totalQuantity = analytics.topProducts.reduce((sum, p) => sum + p.count, 0);
                      const percentage = totalQuantity > 0 ? ((product.count / totalQuantity) * 100).toFixed(1) : '0';
                      const averagePrice = product.count > 0 ? product.revenue / product.count : 0;
                      
                      return (
                        <TableRow key={product.name}>
                          <TableCell className="font-bold">
                            #{index + 1}
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="font-bold text-primary">{product.count}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {percentage}%
                          </TableCell>
                          <TableCell className="font-bold text-green-600">
                            {formatPrice(product.revenue)} جنيه
                          </TableCell>
                          <TableCell className="text-sm text-blue-600">
                            {formatPrice(averagePrice)} جنيه
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                
                {analytics.topProducts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد منتجات مطلوبة في الفترة المحددة
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branches" className="space-y-6">
            {/* إحصائيات سريعة للفروع */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي الفروع النشطة</p>
                      <p className="text-2xl font-bold text-blue-600">{analytics.topBranches.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                      <p className="text-2xl font-bold text-green-600">
                        {analytics.topBranches.reduce((sum, branch) => sum + branch.count, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatPrice(analytics.topBranches.reduce((sum, branch) => sum + branch.revenue, 0))} جنيه
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  جميع الفروع مرتبة حسب النشاط ({analytics.topBranches.length} فرع)
                </CardTitle>
              </CardHeader>
              <CardContent>
                                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المرتبة</TableHead>
                        <TableHead>اسم الفرع</TableHead>
                        <TableHead>عدد الطلبات</TableHead>
                        <TableHead>النسبة المئوية</TableHead>
                        <TableHead>إجمالي المبيعات</TableHead>
                        <TableHead>متوسط قيمة الطلب</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.topBranches.map((branch, index) => {
                        const totalOrders = analytics.topBranches.reduce((sum, b) => sum + b.count, 0);
                        const percentage = totalOrders > 0 ? ((branch.count / totalOrders) * 100).toFixed(1) : '0';
                        const averageOrderValue = branch.count > 0 ? branch.revenue / branch.count : 0;
                        
                        return (
                          <TableRow key={branch.name}>
                            <TableCell className="font-bold">
                              #{index + 1}
                            </TableCell>
                            <TableCell className="font-medium">{branch.name}</TableCell>
                            <TableCell className="font-bold text-primary">{branch.count}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {percentage}%
                            </TableCell>
                            <TableCell className="font-bold text-green-600">
                              {formatPrice(branch.revenue)} جنيه
                            </TableCell>
                            <TableCell className="text-sm text-blue-600">
                              {formatPrice(averageOrderValue)} جنيه
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  
                  {analytics.topBranches.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      لا توجد فروع نشطة في الفترة المحددة
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            {/* جدول الطلبات */}
            <Card>
              <CardHeader>
                <CardTitle>
                  الطلبات ({analytics.filteredOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[100px]">رقم الطلب</TableHead>
                        <TableHead className="min-w-[120px]">التاريخ</TableHead>
                        <TableHead className="min-w-[100px]">المبلغ</TableHead>
                        <TableHead className="min-w-[120px]">الفرع</TableHead>
                        <TableHead className="min-w-[100px]">المنطقة</TableHead>
                        <TableHead className="min-w-[100px]">الشارع</TableHead>
                        <TableHead className="min-w-[150px]">المنتجات</TableHead>
                        <TableHead className="min-w-[180px]">بيانات العميل</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.filteredOrders.map((order) => {
                        const locationInfo = getBranchLocationInfo(order.selectedBranch);
                        return (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-sm font-bold">
                              #{order.id.slice(-8)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatOrderDate(order.createdAt)}
                            </TableCell>
                            <TableCell className="font-bold text-primary">
                              {formatPrice(order.totalAmount)} جنيه
                            </TableCell>
                            <TableCell className="font-medium">
                              {order.selectedBranch}
                            </TableCell>
                            <TableCell className="text-sm text-blue-600">
                              {locationInfo.region}
                            </TableCell>
                            <TableCell className="text-sm text-green-600">
                              {locationInfo.street}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 max-w-[200px]">
                                {order.items.map((item, index) => (
                                  <div key={index} className="text-xs bg-gray-50 p-1 rounded">
                                    {item.quantity}x {item.productName}
                                    {item.selectedSize && (
                                      <span className="text-blue-600"> ({item.selectedSize})</span>
                                    )}
                                    {item.selectedExtra && (
                                      <span className="text-green-600"> + {item.selectedExtra}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium text-sm">
                                  {order.customerName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {order.customerPhone}
                                </div>
                                {order.notes && (
                                  <div className="text-xs text-blue-600 bg-blue-50 p-1 rounded">
                                    ملاحظات: {order.notes}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Orders;
