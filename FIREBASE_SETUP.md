# إعداد Firebase (نسخة آمنة)

التطبيق دلوقتي بيسجّل دخول مجهول (Anonymous) تلقائيًا، عشان نقدر نقفل قاعدة البيانات
بحيث **أي حد معاه رابط القاعدة من غير ما يفتح التطبيق مش هيقدر يقرا أو يعدّل**.

## 1) فعّل تسجيل الدخول المجهول
من [Firebase Console](https://console.firebase.google.com) → مشروعك `project1-61c69`:

1. افتح **Build → Authentication**.
2. اضغط **Get started** (لو أول مرة).
3. تبويب **Sign-in method** → اختَر **Anonymous** → **Enable** → **Save**.

> لو نسيت الخطوة دي، التطبيق هيشتغل من localStorage بس ومش هيقرأ/يكتب في Firebase.

## 2) اضبط قواعد قاعدة البيانات (Realtime Database → Rules)
انسخ القواعد دي بدل القديمة، واضغط **Publish**:

```json
{
  "rules": {
    "students":      { ".read": "auth != null", ".write": "auth != null" },
    "attendance":    { ".read": "auth != null", ".write": "auth != null" },
    "schedules":     { ".read": "auth != null", ".write": "auth != null" },
    "paymentStatus": { ".read": "auth != null", ".write": "auth != null" },
    "metadata":      { ".read": "auth != null", ".write": "auth != null" }
  }
}
```

## ملاحظات أمان مهمة (اقرأها)
- القواعد دي بتمنع الوصول المباشر لرابط القاعدة من المتصفح أو من محركات البحث — وده تحسّن كبير عن `read/write: true`.
- بس لأن التطبيق بيدخل **مجهول**، أي حد يفتح صفحة التطبيق بيقدر يحصل على صلاحية. يعني ده بيقفل الفضول العابر، لكنه **مش حماية كاملة** ضد حد خبير يقرا كود الصفحة.
- للأمان الكامل لازم: تسجيل دخول حقيقي لكل مستخدم (Firebase Auth) + عدم تخزين كلمات السر كنص صريح + تفعيل **App Check**. ده تعديل أكبر، أنا جاهز أعمله لو حبيت.
- كلمة سر المعلم لسه مكتوبة في `script.js` — أي حد يفتح كود الصفحة يشوفها. يُفضّل نقلها لنظام Auth حقيقي.

## إعدادات الاتصال (Firebase config)
موجودة في `firebase-config.js` وفي أول `script.js`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD22y5x1w8AqSmN614G_McwEvr2vULGDz8",
  authDomain: "project1-61c69.firebaseapp.com",
  databaseURL: "https://project1-61c69-default-rtdb.firebaseio.com",
  projectId: "project1-61c69",
  storageBucket: "project1-61c69.firebasestorage.app",
  messagingSenderId: "993840544380",
  appId: "1:993840544380:web:28cd5a348ef1c7f5b167f9",
  measurementId: "G-82RRGQFHV1"
};
```
