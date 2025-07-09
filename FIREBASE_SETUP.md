# إعداد Firebase لحل مشكلة الصلاحيات

## المشكلة
تظهر رسالة خطأ: `FirebaseError: [code=permission-denied]: Missing or insufficient permissions.`

## الحل

### 1. إعداد قواعد الأمان في Firebase Console

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. اختر مشروعك
3. اذهب إلى **Firestore Database** من القائمة الجانبية
4. انقر على تبويب **Rules**
5. استبدل القواعد الموجودة بالقواعد التالية:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // السماح بالقراءة والكتابة على مجموعة orders
    match /orders/{orderId} {
      allow read, write: if true;
    }
    
    // السماح بالقراءة والكتابة على جميع المجموعات الأخرى
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

6. انقر على **Publish** لحفظ القواعد

### 2. التحقق من إعدادات المشروع

تأكد من أن ملف `src/services/firebase.ts` يحتوي على إعدادات صحيحة:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 3. إنشاء مجموعة orders

1. في Firebase Console، اذهب إلى **Firestore Database**
2. انقر على **Start collection**
3. أدخل اسم المجموعة: `orders`
4. أضف مستند تجريبي (اختياري) للاختبار

### 4. اختبار الاتصال

بعد تطبيق القواعد، يجب أن تعمل التطبيق بدون أخطاء. إذا استمرت المشكلة:

1. تحقق من إعدادات الشبكة
2. تأكد من أن المشروع مفعل في Firebase Console
3. تحقق من أن API Key صحيح

## ملاحظات الأمان

⚠️ **تحذير**: القواعد المذكورة أعلاه تسمح بالوصول الكامل للجميع. للإنتاج، يجب تطبيق قواعد أمان أكثر صرامة.

### مثال لقواعد أمان أكثر أماناً:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{orderId} {
      // السماح بالقراءة والكتابة للمستخدمين المصرح لهم فقط
      allow read, write: if request.auth != null;
    }
  }
}
```

## الدعم

إذا استمرت المشكلة، تحقق من:
- [Firebase Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Security Rules](https://firebase.google.com/docs/rules) 