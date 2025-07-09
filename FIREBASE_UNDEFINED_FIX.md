# إصلاح مشكلة القيم undefined في Firebase

## المشكلة
كان يظهر خطأ في Firebase:
```
FirebaseError: Function addDoc() called with invalid data. Unsupported field value: undefined
```

## السبب
Firestore لا يقبل القيم `undefined` في البيانات. يجب أن تكون جميع القيم إما:
- `null` (للحقول الاختيارية)
- قيم صحيحة (للحقول المطلوبة)

## الحل المطبق

### 1. دالة تنظيف البيانات
تم إضافة دالة `cleanOrderData` لتنظيف البيانات من القيم `undefined`:

```typescript
const cleanOrderData = (orderData: Omit<Order, "id" | "createdAt" | "updatedAt">) => {
  return {
    customerName: orderData.customerName || "",
    customerPhone: orderData.customerPhone || "",
    customerAddress: orderData.customerAddress || "",
    selectedBranch: orderData.selectedBranch || "",
    items: orderData.items.map(item => ({
      productId: item.productId || "",
      productName: item.productName || "",
      quantity: item.quantity || 0,
      price: item.price || 0,
      selectedSize: item.selectedSize || null,
      selectedExtra: item.selectedExtra || null,
    })),
    totalAmount: orderData.totalAmount || 0,
    status: orderData.status || "pending",
    notes: orderData.notes || null,
  };
};
```

### 2. تطبيق التنظيف في جميع الدوال
- `createOrder`: تنظيف البيانات قبل إرسالها إلى Firebase
- `createOrderLocal`: تنظيف البيانات قبل حفظها في LocalStorage
- `testConnection`: تنظيف بيانات الاختبار

### 3. قواعد التنظيف
- **الحقول المطلوبة**: استخدام `|| ""` للنصوص، `|| 0` للأرقام
- **الحقول الاختيارية**: استخدام `|| null` للقيم الاختيارية
- **المصفوفات**: تنظيف كل عنصر في المصفوفة

## النتيجة
- ✅ لا توجد قيم `undefined` في البيانات المرسلة إلى Firebase
- ✅ الطلبات تُحفظ بنجاح في Firebase
- ✅ LocalStorage يعمل كنسخة احتياطية
- ✅ النظام يعمل بشكل مستقر

## اختبار الحل
1. أنشئ طلب جديد من صفحة السلة
2. تحقق من Console لرؤية رسائل DEBUG
3. تحقق من Firebase Console لرؤية الطلب الجديد
4. تحقق من صفحة Admin/Orders لرؤية الطلب

## رسائل DEBUG المتوقعة
```
[DEBUG] Cleaned order data: {customerName: "...", ...}
[DEBUG] Firebase document created with ID: [معرف الطلب]
```

## ملاحظات مهمة
- النظام يحاول Firebase أولاً
- إذا فشل Firebase، يستخدم LocalStorage
- جميع البيانات تُنظف قبل الحفظ
- لا توجد قيم `undefined` في أي مكان 