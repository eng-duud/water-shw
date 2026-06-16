# دليل مشروع نظام إدارة مياه غيل الضياء

تم إنشاء وتجهيز كامل الهيكل البرمجي لمشروع **"نظام إدارة فواتير وتحصيل مياه غيل الضياء - قدس المواسط"** بنجاح.

## مكونات المشروع والملفات التي تم إنشاؤها

تم تنظيم المشروع بالكامل ليكون جاهزاً للعمل على **Next.js 15 (App Router)** وقاعدة بيانات **Neon Serverless Postgres** مع **Prisma ORM** وتوزيع التحصيل بآلية **FIFO**:

1. **إعدادات المشروع وحزم العمل**:
   - [package.json](file:///c:/Users/hp/Desktop/projects/my-water/package.json): يحتوي على الحزم المطلوبة مثل `decimal.js` لمعادلات دقيقة و`zod` للتحقق وسرعة Tailwind CSS v4.
   - [tsconfig.json](file:///c:/Users/hp/Desktop/projects/my-water/tsconfig.json): إعدادات TypeScript للواجهات البرمجية.
   - [next.config.ts](file:///c:/Users/hp/Desktop/projects/my-water/next.config.ts): إعدادات الصور لدعم روابط Cloudinary.
   - [.env.example](file:///c:/Users/hp/Desktop/projects/my-water/.env.example) و[.env](file:///c:/Users/hp/Desktop/projects/my-water/.env): ملف إعدادات الاتصال وقيم السحابة.

2. **قواعد البيانات والـ ORM**:
   - [prisma/schema.prisma](file:///c:/Users/hp/Desktop/projects/my-water/prisma/schema.prisma): مخطط الجداول وتحديد علاقات المستأجرين (`tenantId`) لضمان جاهزية النظام للعمل كمنصة SaaS في المستقبل.
   - [src/lib/prisma.ts](file:///c:/Users/hp/Desktop/projects/my-water/src/lib/prisma.ts): العميل البرمجي المفرد (Singleton) لقاعدة البيانات لمنع استهلاك الاتصالات.
   - [src/lib/tenant.ts](file:///c:/Users/hp/Desktop/projects/my-water/src/lib/tenant.ts): استراتيجية المعالجة الذاتية (Self-healing) لضمان تواجد سجل المستأجر وإعدادات الأسعار الافتراضية بمجرد أول طلب.

3. **منطق الحساب وتوزيع التحصيل**:
   - [src/lib/billing.ts](file:///c:/Users/hp/Desktop/projects/my-water/src/lib/billing.ts): محرك حساب فواتير المياه التصاعدي للشرائح باستخدام دقة الحساب العشري.
   - [src/lib/payment-distribution.ts](file:///c:/Users/hp/Desktop/projects/my-water/src/lib/payment-distribution.ts): محرك توزيع المقبوضات حسب الأقدمية (FIFO) وكشف الفوائض والتعامل مع الأرصدة المعلقة الزائدة.
   - [src/lib/cloudinary.ts](file:///c:/Users/hp/Desktop/projects/my-water/src/lib/cloudinary.ts): أداة رفع الصور المباشرة (Unsigned presets) للواجهة الأمامية.
   - [src/lib/constants.ts](file:///c:/Users/hp/Desktop/projects/my-water/src/lib/constants.ts): ثوابت الأسعار الافتراضية.

4. **مسارات الخلفية (API Routes)**:
   - [src/app/api/customers/route.ts] و[[id]/route.ts](file:///c:/Users/hp/Desktop/projects/my-water/src/app/api/customers): عمليات الإضافة، التعديل، والبحث للمشتركين.
   - [src/app/api/billing/route.ts] و[[cycleId]/route.ts](file:///c:/Users/hp/Desktop/projects/my-water/src/app/api/billing): إعداد دورات الفوترة، سحب قراءات العداد السابقة وإصدار الفواتير.
   - [src/app/api/billing/[cycleId]/entries/route.ts](file:///c:/Users/hp/Desktop/projects/my-water/src/app/api/billing/[cycleId]/entries/route.ts): استلام القراءات جماعياً وتخزينها في معاملة واحدة بقاعدة البيانات.
   - [src/app/api/payments/route.ts] و[bill/route.ts](file:///c:/Users/hp/Desktop/projects/my-water/src/app/api/payments): تحصيل الدفعات وتسوية الأرصدة المعلقة وفواتير الطباعة.
   - [src/app/api/dashboard/route.ts](file:///c:/Users/hp/Desktop/projects/my-water/src/app/api/dashboard/route.ts): جلب إحصائيات الاستهلاك، المبالغ المفوترة، المديونيات المتأخرة، وتوجهات التحصيل.

5. **الواجهات الرسومية (UI Panels)**:
   - [src/app/page.tsx](file:///c:/Users/hp/Desktop/projects/my-water/src/app/page.tsx): لوحة تحكم عصرية ببطاقات KPI ومؤشرات بيانية للتحصيل وبدء دورة فوترة جديدة.
   - [src/app/customers/page.tsx](file:///c:/Users/hp/Desktop/projects/my-water/src/app/customers/page.tsx): إدارة المشتركين بالكامل وتصوير العدادات ورفعها عبر Cloudinary.
   - [src/app/billing/page.tsx](file:///c:/Users/hp/Desktop/projects/my-water/src/app/billing/page.tsx): واجهة تعبئة قراءات العداد الجماعية والحساب اللحظي المباشر بمجرد الكتابة.
   - [src/app/payments/page.tsx](file:///c:/Users/hp/Desktop/projects/my-water/src/app/payments/page.tsx): تسجيل المقبوضات وتوزيعها مع معاينة حية للتوزيع وعلاج فائض السداد يدوياً.

6. **نظام الطباعة المتكامل**:
   - [src/app/globals.css](file:///c:/Users/hp/Desktop/projects/my-water/src/app/globals.css): يحتوي على خط **IBM Plex Sans Arabic** وتنسيقات الطباعة المتكاملة `@media print` لإزالة العناوين وأشرطة التصفح وتقسيم الصفحات تلقائياً.
   - [src/app/print/bill/[id]/page.tsx](file:///c:/Users/hp/Desktop/projects/my-water/src/app/print/bill/[id]/page.tsx): طباعة فاتورة مفردة بحجم ورق A5.
   - [src/app/print/batch/[cycleId]/page.tsx](file:///c:/Users/hp/Desktop/projects/my-water/src/app/print/batch/[cycleId]/page.tsx): طباعة جماعية متتالية لكافة فواتير المشتركين للدورة المحددة بفاصل صفحة تلقائي.

---

## كيفية تشغيل وتجربة المشروع محلياً

اتبع الخطوات البسيطة التالية في محطة العمل الخاصة بك (Terminal) لتشغيل النظام:

### 1. تثبيت الحزم والمكونات
افتح مجلد المشروع في الـ Terminal وقم بتثبيت كافة الاعتماديات:
```bash
npm install
```

### 2. إعداد قاعدة بيانات Neon
قم بنسخ ملف المتغيرات وتعبئة بيانات الاتصال لشبكة Neon الخاصة بك وسحابة Cloudinary:
* قم بتحرير ملف `.env` وقم بوضع روابط اتصال قاعدة بيانات Neon:
  - `DATABASE_URL` (مع إضافة `-pooler` للربط المتصل للتطبيق).
  - `DIRECT_URL` (الاتصال المباشر لإجراء الهجرات).
* قم بوضع بيانات الرفع لـ Cloudinary:
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
  - `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

### 3. تطبيق تهجير جداول الجيل الأول (Migrations)
قم بتشغيل الأمر التالي لتهيئة الجداول وعلاقات الفوترة في قاعدة بيانات Neon:
```bash
npx prisma migrate dev --name init
```

### 4. تشغيل النظام على بيئة التطوير المحلية
قم بتشغيل خادم التطوير لتشغيل الواجهة الرسومية:
```bash
npm run dev
```
افتح الرابط التالي في متصفحك: [http://localhost:3000](http://localhost:3000) لتجد النظام يعمل باللغة العربية بالكامل وبالمؤشرات الجمالية المطلوبة.

### 5. التحقق من منطق حساب الفاتورة (Test Case Verification)
قمنا بكتابة ملف فحص سريع للتحقق من أن منطق الحساب يطابق حالة الاختبار الواردة في المواصفات تماماً:
* المشترك لديه: 1 وحدة عمل.
* القراءة السابقة: 34.4
* القراءة الحالية: 47.1
* الاستهلاك: 12.7
* النتيجة المتوقعة: 13,500 ريال.

قم بتشغيل ملف الفحص للتحقق:
```bash
node scratch_test-calculations.js
```
سيعرض لك النتائج بالتفصيل ويؤكد مطابقتها بنجاح!
