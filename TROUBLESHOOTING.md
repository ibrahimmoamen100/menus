# استكشاف مشكلة عدم ظهور الطلبات

## المشكلة
المستخدم أضاف طلب ولكن لم يظهر في صفحة admin/orders ولم يتم تسجيله في Firebase.

## خطوات التشخيص

### 1. فتح Developer Tools
1. اضغط `F12` أو `Ctrl+Shift+I`
2. انتقل إلى تبويب `Console`
3. ابحث عن رسائل `[DEBUG]`

### 2. اختبار الاتصال
1. اذهب إلى صفحة `/admin/orders`
2. اضغط على زر "اختبار الاتصال"
3. تحقق من الرسائل في Console

### 3. فحص قواعد Firebase
تأكد من تطبيق قواعد الأمان الصحيحة في Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{orderId} {
      allow read, write: if true;
    }
    match /test/{testId} {
      allow read, write: if true;
    }
  }
}
```

### 4. فحص البيانات المحلية
افتح Console واكتب:
```javascript
// فحص الطلبات المحلية
console.log(JSON.parse(localStorage.getItem('orders') || '[]'));

// فحص حالة Firebase
console.log('Firebase config:', {
  apiKey: "AIzaSyCTXR6dPpPM_9qLp2Pxws_lzwhENHMNFFE",
  projectId: "menus-f4aa3"
});
```

## الحلول المحتملة

### الحل 1: إعادة تعيين قواعد Firebase
1. اذهب إلى Firebase Console
2. Firestore Database → Rules
3. استبدل القواعد بالقواعد المذكورة أعلاه
4. انقر Publish

### الحل 2: فحص إعدادات المشروع
تأكد من أن `projectId` في `firebase.ts` صحيح:
```typescript
projectId: "menus-f4aa3"
```

### الحل 3: إنشاء مجموعة orders
1. في Firebase Console
2. Firestore Database
3. Start collection
4. Collection ID: `orders`

### الحل 4: فحص الشبكة
- تأكد من عدم وجود حظر للشبكة
- جرب استخدام VPN
- تحقق من إعدادات الجدار الناري

## رسائل الخطأ الشائعة

### "Missing or insufficient permissions"
- **الحل**: تطبيق قواعد الأمان الصحيحة

### "Could not establish connection"
- **الحل**: فحص إعدادات الشبكة

### "Collection doesn't exist"
- **الحل**: إنشاء مجموعة `orders` في Firebase

## اختبار شامل

### 1. إنشاء طلب تجريبي
1. اذهب إلى صفحة Cart
2. أضف منتج للسلة
3. املأ معلومات التوصيل
4. اضغط "شراء من هذا الفرع"
5. تحقق من Console للحصول على رسائل DEBUG

### 2. فحص Firebase Console
1. اذهب إلى Firebase Console
2. Firestore Database
3. تحقق من وجود مستندات في مجموعة `orders`

### 3. فحص LocalStorage
```javascript
// في Console
localStorage.getItem('orders')
```

## إذا استمرت المشكلة

1. **إعادة تشغيل التطبيق**
2. **مسح Cache المتصفح**
3. **فحص إعدادات Firebase في Console**
4. **التأكد من تفعيل Firestore في المشروع**

## معلومات إضافية

- **Firebase Project ID**: menus-f4aa3
- **Collection Name**: orders
- **Fallback**: LocalStorage
- **Debug Mode**: مفعل (رسائل [DEBUG] في Console) 