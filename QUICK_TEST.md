# اختبار سريع لنظام الطلبات

## الخطوة 1: اختبار الاتصال
1. اذهب إلى `/admin/orders`
2. اضغط "اختبار الاتصال"
3. يجب أن تظهر رسالة: "اتصال Firebase يعمل بشكل صحيح!"

## الخطوة 2: اختبار إنشاء طلب من السلة
1. اذهب إلى `/cart`
2. اضغط "اختبار إنشاء طلب"
3. تحقق من Console للحصول على رسائل DEBUG

## الخطوة 3: اختبار التحديث التلقائي
1. في صفحة `/admin/orders`
2. اضغط "تحديث الطلبات"
3. تحقق من عدد الطلبات المعروض

## الخطوة 4: فحص Console
ابحث عن هذه الرسائل في Console:

### رسائل النجاح:
```
[DEBUG] Testing Firebase connection...
[DEBUG] Test document created: [ID]
[DEBUG] Creating test order from Cart...
[DEBUG] Test order from Cart created: [ID]
[DEBUG] Setting up orders subscription...
[DEBUG] Firebase subscription set up successfully
[DEBUG] Firebase snapshot received: X documents
[DEBUG] Processed orders: [array]
```

### رسائل الخطأ:
```
[DEBUG] Error creating order: [error]
[DEBUG] Firebase subscription error: [error]
[DEBUG] Falling back to localStorage polling...
```

## الخطوة 5: فحص Firebase Console
1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. اختر مشروع `menus-f4aa3`
3. اذهب إلى Firestore Database
4. تحقق من مجموعة `orders`
5. يجب أن ترى المستندات الجديدة

## الخطوة 6: فحص LocalStorage
افتح Console واكتب:
```javascript
// فحص الطلبات المحلية
const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
console.log('Local orders:', localOrders);
console.log('Number of local orders:', localOrders.length);
```

## إذا لم تظهر الطلبات:

### المشكلة 1: لا توجد رسائل DEBUG
- تأكد من فتح Developer Tools (F12)
- تحقق من تبويب Console

### المشكلة 2: رسائل خطأ في Firebase
- تحقق من قواعد الأمان في Firebase Console
- تأكد من إنشاء مجموعة `orders`

### المشكلة 3: الطلبات في LocalStorage فقط
- المشكلة في الاتصال بـ Firebase
- النظام يعمل بالنسخة الاحتياطية

### المشكلة 4: لا توجد طلبات في أي مكان
- مشكلة في عملية إنشاء الطلبات
- تحقق من رسائل الخطأ في Console

## معلومات مفيدة:
- **Firebase Project**: menus-f4aa3
- **Collection**: orders
- **Fallback**: LocalStorage
- **Debug Mode**: مفعل 