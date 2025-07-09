import { useStore } from "@/store/useStore";
import { ProductModal } from "@/components/ProductModal";
import { useState, useEffect, useRef } from "react";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Trash2,
  Eye,
  Plus,
  Minus,
  AlertCircle,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Navbar } from "@/components/Navbar";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { DEFAULT_SUPPLIER } from "@/constants/supplier";
import { formatPrice } from "@/utils/format";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import storeData from "@/data/store.json";
import { orderService } from "@/services/firebase";
import { OrderFormData } from "@/types/order";

interface DeliveryFormData {
  fullName: string;
  phoneNumber: string;
  address: string;
  city: string;
  notes?: string;
}

interface SupplierGroup {
  supplierName: string;
  supplierPhone: string;
  items: { product: Product; quantity: number }[];
  total: number;
}

const Cart = () => {
  const products = useStore((state) => state.products);
  const cart = useStore((state) => state.cart);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const addToCart = useStore((state) => state.addToCart);
  const clearCart = useStore((state) => state.clearCart);
  const updateCartItemQuantity = useStore((state) => state.updateCartItemQuantity);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { t } = useTranslation();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [showClearCartAlert, setShowClearCartAlert] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryFormData>({
    fullName: "",
    phoneNumber: "",
    address: "",
    city: "",
    notes: "",
  });
  const [branches, setBranches] = useState<{ name: string; phone: string }[]>(
    storeData.branches || []
  );
  const [selectedBranch, setSelectedBranch] = useState<{
    name: string;
    phone: string;
  } | null>(null);


  // refs for focus and scroll
  const fullNameRef = useRef<HTMLInputElement>(null);
  const deliveryFormRef = useRef<HTMLFormElement>(null);

  const {
    register,
    watch,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<DeliveryFormData>({
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      address: "",
      city: "",
      notes: "",
    },
  });

  // Watch form fields for validation
  const fullName = watch("fullName");
  const phoneNumber = watch("phoneNumber");
  const address = watch("address");
  const city = watch("city");

  // Check if all required fields are filled
  const isFormValid = fullName && phoneNumber && address && city;

  // Update delivery info when form fields change
  useEffect(() => {
    setDeliveryInfo({
      fullName: fullName || "",
      phoneNumber: phoneNumber || "",
      address: address || "",
      city: city || "",
      notes: watch("notes") || "",
    });
  }, [fullName, phoneNumber, address, city, watch]);

  // اربط cart مع المنتجات
  const cartWithProducts = cart
    .map((item) => ({
      ...item,
      product: products.find((p) => p.id === item.productId),
    }))
    .filter((item) => item.product); // تجاهل العناصر التي لم يعد لها منتج

  // Debug: طباعة محتوى السلة والمنتجات والربط بينهم
  useEffect(() => {
    
  }, [cart, products, cartWithProducts]);

  // Group cart items by branch
  const branchGroups = cartWithProducts.reduce((groups: any[], item) => {
    // ابحث عن الفرع الذي يحتوي المنتج
    const branch = (storeData.branches || []).find((b) => (b.products || []).some((p: any) => (typeof p === "string" ? p : p.id) === item.product.id));
    // حساب السعر الأساسي مع الخصم
    const basePrice = item.product.specialOffer && item.product.discountPercentage
      ? item.product.price - (item.product.price * item.product.discountPercentage) / 100
      : item.product.price;
    
    // حساب سعر الحجم
    let sizePrice = 0;
    if (item.selectedSize && item.product.sizesWithPrices) {
      const foundSize = item.product.sizesWithPrices.find(
        (s: any) => s.size === item.selectedSize
      );
      if (foundSize) sizePrice = Number(foundSize.price || 0);
    }
    
    // حساب سعر الإضافة
    let extraPrice = 0;
    if (item.selectedExtra && item.product.extras) {
      const foundExtra = item.product.extras.find(
        (e: any) => e.name === item.selectedExtra
      );
      if (foundExtra) extraPrice = Number(foundExtra.price || 0);
    }
    
    // السعر الإجمالي للمنتج الواحد (يشمل الحجم والإضافة)
    const totalItemPrice = basePrice + sizePrice + extraPrice;

    if (!branch) {
      // إذا لم يكن للمنتج فرع، أضفه إلى مجموعة "منتجات عامة"
      const generalGroup = groups.find((g) => g.branch?.id === "general");
      if (generalGroup) {
        generalGroup.items.push(item);
        generalGroup.total += totalItemPrice * item.quantity;
      } else {
        groups.push({
          branch: { id: "general", name: "منتجات عامة", phone: "01024911062" },
          street: null,
          region: null,
          items: [item],
          total: totalItemPrice * item.quantity,
        });
      }
      return groups;
    }

    const street = (storeData.streets || []).find((s) => s.id === branch.streetId);
    const region = street ? (storeData.regions || []).find((r) => (r.streets || []).includes(street.id)) : null;
    const existingGroup = groups.find((g) => g.branch.id === branch.id);
    if (existingGroup) {
      existingGroup.items.push(item);
      existingGroup.total += totalItemPrice * item.quantity;
    } else {
      groups.push({
        branch,
        street,
        region,
        items: [item],
        total: totalItemPrice * item.quantity,
      });
    }
    return groups;
  }, []);

  // Debug: طباعة مجموعات الفروع
  useEffect(() => {
  
  }, [branchGroups]);

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setShowDeleteAlert(true);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      removeFromCart(productToDelete);
      setShowDeleteAlert(false);
      setProductToDelete(null);
    }
  };

  const handleClearCart = () => {
    clearCart();
    toast.success(t("cart.cartCleared"));
  };



  const navigate = useNavigate();

  const updateCartItemOptions = (
    productId: string,
    selectedSize?: string,
    selectedExtra?: string
  ) => {
    // إزالة العنصر القديم بنفس المنتج والحجم/الإضافة القديمة
    const item = cartWithProducts.find((i) => i.product.id === productId);
    if (!item) return;
    removeFromCart(productId);
    // أضف العنصر الجديد بنفس الكمية ولكن بالحجم/الإضافة الجديدة
    addToCart(item.product, item.quantity, selectedSize, selectedExtra);
  };

  // دالة التحقق عند الضغط على زر شراء من هذا الفرع
  const handleBuyFromBranch = async (group: any) => {

    
    const valid = await trigger(["fullName", "phoneNumber", "address", "city"]);
    if (!valid) {
      // عمل focus على أول حقل غير مكتمل
      if (errors.fullName && fullNameRef.current) {
        fullNameRef.current.focus();
      } else if (errors.phoneNumber) {
        const el = document.getElementById("phoneNumber");
        if (el) el.focus();
      } else if (errors.address) {
        const el = document.getElementById("address");
        if (el) el.focus();
      } else if (errors.city) {
        const el = document.getElementById("city");
        if (el) el.focus();
      }
      // إذا كانت الشاشة صغيرة (موبايل)
      if (window.innerWidth < 768 && deliveryFormRef.current) {
        deliveryFormRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      toast.error("يرجى ملء جميع معلومات التوصيل أولاً");
      return;
    }

    // إذا كانت الحقول مكتملة، احفظ الطلب في Firebase أولاً
    const values = getValues();

    
    try {
      const orderData = {
        customerName: values.fullName,
        customerPhone: values.phoneNumber,
        customerAddress: `${values.address}, ${values.city}`,
        selectedBranch: group.branch.name,
        items: group.items.map((item: any) => {
          // حساب السعر الأساسي مع مراعاة الخصم
          const basePrice = item.product.specialOffer && item.product.discountPercentage
            ? item.product.price - (item.product.price * item.product.discountPercentage) / 100
            : item.product.price;
          
          // حساب سعر الحجم
          let sizePrice = 0;
          if (item.selectedSize && item.product.sizesWithPrices) {
            const foundSize = item.product.sizesWithPrices.find(
              (s: any) => s.size === item.selectedSize
            );
            if (foundSize) sizePrice = Number(foundSize.price || 0);
          }
          
          // حساب سعر الإضافة
          let extraPrice = 0;
          if (item.selectedExtra && item.product.extras) {
            const foundExtra = item.product.extras.find(
              (e: any) => e.name === item.selectedExtra
            );
            if (foundExtra) extraPrice = Number(foundExtra.price || 0);
          }
          
          // السعر الإجمالي للمنتج الواحد
          const totalItemPrice = basePrice + sizePrice + extraPrice;
          
          return {
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            price: totalItemPrice,
            basePrice: basePrice,
            sizePrice: sizePrice,
            extraPrice: extraPrice,
            selectedSize: item.selectedSize,
            selectedExtra: item.selectedExtra,
            originalPrice: item.product.price,
            discountPercentage: item.product.discountPercentage || 0,
          };
        }),
        totalAmount: group.items.reduce((sum, item) => {
          const basePrice = item.product.specialOffer && item.product.discountPercentage
            ? item.product.price - (item.product.price * item.product.discountPercentage) / 100
            : item.product.price;
          
          let sizePrice = 0;
          if (item.selectedSize && item.product.sizesWithPrices) {
            const foundSize = item.product.sizesWithPrices.find(
              (s: any) => s.size === item.selectedSize
            );
            if (foundSize) sizePrice = Number(foundSize.price || 0);
          }
          
          let extraPrice = 0;
          if (item.selectedExtra && item.product.extras) {
            const foundExtra = item.product.extras.find(
              (e: any) => e.name === item.selectedExtra
            );
            if (foundExtra) extraPrice = Number(foundExtra.price || 0);
          }
          
          return sum + (basePrice + sizePrice + extraPrice) * item.quantity;
        }, 0),
        status: "pending" as const,
        notes: values.notes,
      };

      console.log("[DEBUG] Order data with current timestamp:", {
        ...orderData,
        createdAt: new Date().toISOString(),
        currentTime: new Date().toLocaleString("ar-EG")
      });

      const orderId = await orderService.createOrder(orderData);
      toast.success("تم حفظ الطلب بنجاح! جاري فتح الواتساب...");
      
      // إزالة المنتجات من هذا الفرع من السلة
      group.items.forEach((item: any) => {
        removeFromCart(item.product.id);
      });
      
    } catch (e) {
      toast.error("تعذر حفظ الطلب على السحابة");
      return;
    }

    // إرسال رسالة الواتساب
    const deliveryInfoMsg =
      `📋 *معلومات التوصيل:*\n` +
      `👤 الاسم: ${values.fullName}\n` +
      `📞 رقم الهاتف: ${values.phoneNumber}\n` +
      `📍 العنوان: ${values.address}\n` +
      `🏘️ المنطقة: ${values.city}` +
      (values.notes ? `\n📝 ملاحظات: ${values.notes}` : "");
    
    const separator = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
    
    // إضافة التاريخ والوقت الحاليين بالميلادي وبالعربية وصيغة مخصصة
    const now = new Date();
    const days = [
      "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"
    ];
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const formattedDate = `${dayName} ${day}-${month}-${year}`;
    
    // إضافة الوقت بصيغة 12 ساعة وبالأرقام العربية
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const isAM = hours < 12;
    let displayHours = hours % 12;
    if (displayHours === 0) displayHours = 12;
    // تحويل الأرقام إلى العربية
    const toArabicDigits = (num) => num.toString().replace(/[0-9]/g, d => String.fromCharCode(0x0660 + Number(d)));
    const formattedTime = `${toArabicDigits(displayHours)}:${toArabicDigits(minutes.toString().padStart(2, '0'))} ${isAM ? 'ص' : 'م'}`;
    
    const msg =
      `🛒 *طلب جديد*\n` +
      `🏪 من: ${group.branch.name}` +
      (group.street ? `\n🛣️ شارع: ${group.street.name}` : "") +
      (group.region ? `\n🏘️ منطقة: ${group.region.name}` : "") +
      `\n\n${separator}\n\n` +
      deliveryInfoMsg +
      `\n\n${separator}\n\n` +
      `🍽️ *المنتجات المطلوبة:*\n` +
      group.items
        .map(
          (item: any) => {
            const itemPrice = (item.product.price +
              (item.selectedSize && item.product.sizesWithPrices
                ? Number(
                  item.product.sizesWithPrices.find(
                    (s: any) => s.size === item.selectedSize
                  )?.price || 0
                )
                : 0
              ) +
              (item.selectedExtra && item.product.extras
                ? Number(
                  item.product.extras.find(
                    (e: any) => e.name === item.selectedExtra
                  )?.price || 0
                )
                : 0
              )
            ) * item.quantity;
            
            let itemDetails = `• ${item.product.name} × ${item.quantity}`;
            if (item.selectedSize) {
              itemDetails += ` (${item.selectedSize})`;
            }
            if (item.selectedExtra) {
              itemDetails += ` + ${item.selectedExtra}`;
            }
            itemDetails += ` = ${formatPrice(itemPrice)}`;
            
            return itemDetails;
          }
        )
        .join("\n") +
      `\n\n${separator}\n\n` +
      `💰 *الإجمالي: ${formatPrice(group.total)} جنيه*` +
      `\n\n${separator}\n\n` +
      `📅 تاريخ الطلب: ${formattedDate}` +
      `\n⏰ الوقت: ${formattedTime}` +
      `\n\n${separator}\n\n` +
      `🌐 *أرسل من خلال موقع Menus*`;
    
    // فتح الواتساب بعد ثانية واحدة لإعطاء الوقت لرسالة النجاح
    setTimeout(() => {
      window.open(
        `https://wa.me/${group.branch.phone.replace(/^0/, "20")}?text=${encodeURIComponent(msg)}`
      );
    }, 1000);
  };

  return (
    <div className="min-h-screen">
      <main className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{t("cart.title")}</h1>
          {cart.length > 0 && (
            <AlertDialog
              open={showClearCartAlert}
              onOpenChange={setShowClearCartAlert}
            >
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("cart.clearCart")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("cart.clearCart")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("cart.clearCartConfirm")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearCart}>
                    {t("cart.confirmClear")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {cart.length > 0 && (
          <div className="bg-blue-50 border-r-4 border-blue-400 p-4 mb-8 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-blue-800 font-semibold mb-1">تنبيه هام</h3>
                <p className="text-blue-700">
                  يرجى ملء معلومات التوصيل أولاً قبل الضغط على زر "شراء من هذا الفرع".
                  هذه المعلومات ضرورية لتوصيل طلبك بشكل صحيح.
                </p>
              </div>
            </div>
          </div>
        )}

        {cart.length === 0 ? (
          <p className="text-center text-muted-foreground">{t("cart.empty")}</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-3 space-y-8">
              {branchGroups.map((group, index) => (
                <div
                  key={group.branch.id}
                  className="bg-white rounded-lg border shadow-sm overflow-hidden"
                >
                  {/* عنوان الفرع */}
                  <div className="flex flex-wrap gap-2 items-center px-4 py-3 border-b bg-gray-50">
                    <span className="font-bold text-primary text-lg flex items-center gap-1">
                      {group.branch.name}
                    </span>
                    {group.branch.id !== "general" && group.street && (
                      <span className="text-blue-700 font-semibold flex items-center gap-1">
                        شارع {group.street.name}
                      </span>
                    )}
                    {group.branch.id !== "general" && group.region && (
                      <span className="text-green-700 font-semibold flex items-center gap-1">
                        منطقة {group.region.name}
                      </span>
                    )}
                  </div>
                  {/* قائمة المنتجات */}
                  <div className="divide-y">
                    {group.items.map((item, idx) => {
                      let sizePrice = 0;
                      let extraPrice = 0;
                      if (item.selectedSize && item.product?.sizesWithPrices) {
                        const foundSize = item.product.sizesWithPrices.find(
                          (s) => s.size === item.selectedSize
                        );
                        if (foundSize) sizePrice = Number(foundSize.price || 0);
                      }
                      if (item.selectedExtra && item.product?.extras) {
                        const foundExtra = item.product.extras.find(
                          (e) => e.name === item.selectedExtra
                        );
                        if (foundExtra) extraPrice = Number(foundExtra.price || 0);
                      }
                      const basePrice =
                        item.product?.specialOffer && item.product?.discountPercentage
                          ? item.product.price -
                          (item.product.price * item.product.discountPercentage) / 100
                          : item.product.price;
                      const totalPrice =
                        (basePrice + sizePrice + extraPrice) * item.quantity;
                      return (
                        <div
                          key={item.product.id + "-" + idx}
                          className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                        >
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-20 w-20 rounded-md object-cover"
                          />
                          <div className="flex-1 h-full">
                            <div className="flex flex-col justify-around items-start gap-4 h-full">
                              <h3 className="font-medium">{item.product.name}</h3>
                              <div className="border-b border-gray-200 w-20 mb-2"></div>
                              <div className="font-bold text-base">
                                السعر: {formatPrice(totalPrice)}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                              {item.product.sizesWithPrices &&
                                item.product.sizesWithPrices.length > 0 && (
                                  <Select
                                    value={item.selectedSize || undefined}
                                    onValueChange={(value) =>
                                      updateCartItemOptions(
                                        item.product.id,
                                        value,
                                        item.selectedExtra
                                      )
                                    }
                                  >
                                    <SelectTrigger className="w-auto min-w-[100px]">
                                      <SelectValue placeholder="اختر الحجم" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {item.product.sizesWithPrices.map(
                                        (sizeObj, i) => (
                                          <SelectItem
                                            key={sizeObj.size + i}
                                            value={sizeObj.size}
                                          >
                                            {sizeObj.size}
                                            {sizeObj.price &&
                                              ` (+${formatPrice(sizeObj.price)})`}
                                          </SelectItem>
                                        )
                                      )}
                                    </SelectContent>
                                  </Select>
                                )}
                              {item.product.extras &&
                                item.product.extras.length > 0 && (
                                  <Select
                                    value={item.selectedExtra || undefined}
                                    onValueChange={(value) =>
                                      updateCartItemOptions(
                                        item.product.id,
                                        item.selectedSize,
                                        value
                                      )
                                    }
                                  >
                                    <SelectTrigger className="w-auto min-w-[100px]">
                                      <SelectValue placeholder="اختر الإضافة" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {item.product.extras.map((extra, i) => (
                                        <SelectItem
                                          key={extra.name + i}
                                          value={extra.name}
                                        >
                                          {extra.name}
                                          {extra.price &&
                                            ` (+${formatPrice(extra.price)})`}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">

                            <div className="flex flex-col items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>

                              <span className="font-bold text-base w-6 text-center">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                            </div>



                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(item.product.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>

                        </div>
                      );
                    })}
                  </div>
                  {/* نهاية المنتجات */}
                  <div className="flex justify-between items-center bg-gray-50 px-4 py-3 border-t">
                    <div className="font-bold text-primary">
                      الإجمالي: {formatPrice(group.total)}
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white"
                      onClick={() => handleBuyFromBranch(group)}
                    >
                      <FaWhatsapp className="w-5 h-5" />
                      شراء من هذا الفرع
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="md:col-span-2">
              <div className="rounded-lg border bg-card p-6 sticky top-20">
                <div className="mb-6 p-4 bg-[#36fc7f]/10 rounded-lg border border-[#25D366]/20">
                  <div className="flex items-center gap-3 text-[#146130]">
                    <FaWhatsapp className="h-7 w-7" />
                    <div className="space-y-1">
                      <p className="text-sm">
                        عند النقر على زر "شراء من هذا الفرع"، سيتم حفظ الطلب في النظام
                        وفتح واتساب لإرسال تفاصيل طلبك إلى الفرع
                      </p>
                      <p className="text-sm font-medium">
                        سيتم إزالة المنتجات من هذا الفرع من السلة تلقائياً
                      </p>
                    </div>
                  </div>
                </div>
                <h2 className="text-xl font-semibold mb-4">
                  {t("cart.deliveryInfo")}
                </h2>
                <form
                  ref={deliveryFormRef}
                  className="space-y-4 bg-white rounded-lg border p-6 mb-8"
                >
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-medium mb-1"
                    >
                      {t("cart.fullName")}*
                    </label>
                    <Input
                      id="fullName"
                      {...register("fullName", { required: true })}
                      className={errors.fullName ? "border-destructive" : ""}
                      ref={e => {
                        register("fullName").ref(e);
                        fullNameRef.current = e;
                      }}
                      placeholder="محمد علي..."
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive mt-1">
                        {t("cart.fieldRequired")}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="phoneNumber"
                      className="block text-sm font-medium mb-1"
                    >
                      {t("cart.phoneNumber")}*
                    </label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      {...register("phoneNumber", { required: true })}
                      className={errors.phoneNumber ? "border-destructive" : ""}
                      placeholder="01010101010"
                    />
                    {errors.phoneNumber && (
                      <p className="text-sm text-destructive mt-1">
                        {t("cart.fieldRequired")}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium mb-1"
                    >
                      {t("cart.address")}*
                    </label>
                    <Textarea
                      id="address"
                      {...register("address", { required: true })}
                      className={errors.address ? "border-destructive" : ""}
                      placeholder="الشارع , المنزل , الشقه"
                    />
                    {errors.address && (
                      <p className="text-sm text-destructive mt-1">
                        {t("cart.fieldRequired")}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="area"
                      className="block text-sm font-medium mb-1"
                    >
                     المنطقه*
                    </label>
                    <Input
                      id="area"
                      {...register("city", { required: true })}
                      className={errors.city ? "border-destructive" : ""}
                      placeholder="المرج , عزبه النخل"
                    />
                    {errors.city && (
                      <p className="text-sm text-destructive mt-1">
                        {t("cart.fieldRequired")}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="notes"
                      className="block text-sm font-medium mb-1"
                    >
                      {t("cart.notes")}
                    </label>
                    <Textarea id="notes" {...register("notes")} placeholder="يجب ان يكون الاكل ساخن... " />
                  </div>

                </form>
              </div>
            </div>
          </div>
        )}
        <ProductModal
          product={selectedProduct}
          open={modalOpen}
          onOpenChange={setModalOpen}
          hideAddToCart={true}
        />
      </main>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cart.confirmRemove")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("cart.confirmRemoveDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Cart;
