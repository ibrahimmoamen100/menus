نظام إدارة منتجات متكامل مع حفظ تلقائي للبيانات في ملف JSON.

## المميزات الجديدة

✅ **حفظ تلقائي للمنتجات**: عند إضافة منتج جديد في صفحة المسؤول، يتم حفظه تلقائياً في ملف `src/data/store.json`
✅ **تحديث تلقائي**: عند تعديل أو حذف منتج، يتم تحديث الملف تلقائياً
✅ **نسخ احتياطي**: البيانات محفوظة في localStorage كنسخة احتياطية
✅ **API متكامل**: خادم Express.js لإدارة العمليات

## كيفية التشغيل

### 1. تثبيت التبعيات

```bash
npm install
```

### 2. تشغيل النظام الكامل (الخادم + التطبيق)

```bash
npm run dev:full
```

أو يمكنك تشغيلهما منفصلين:

### تشغيل الخادم فقط

```bash
npm run server
```

### تشغيل التطبيق فقط

```bash
npm run dev
```

## كيفية الاستخدام

1. **الدخول لصفحة المسؤول**: اذهب إلى `/admin`
2. **كلمة المرور**: `45086932`
3. **إضافة منتج جديد**: املأ النموذج واضغط "Add Product"
4. **التحقق من الحفظ**: ستجد المنتج محفوظ في `src/data/store.json`

## البنية التقنية

### الخادم (Server)

- **المنفذ**: 3001
- **المسارات**:
  - `POST /api/products` - إضافة منتج جديد
  - `PUT /api/products/:id` - تحديث منتج
  - `DELETE /api/products/:id` - حذف منتج
  - `POST /api/save-store` - حفظ جميع البيانات
  - `GET /api/store` - جلب جميع البيانات

### التطبيق (Frontend)

- **المنفذ**: 5173 (افتراضي لـ Vite)
- **إدارة الحالة**: Zustand
- **التخزين**: localStorage + ملف JSON

## الملفات المهمة

- `src/data/store.json` - ملف البيانات الرئيسي
- `src/server/index.ts` - خادم API
- `src/store/useStore.ts` - إدارة الحالة
- `src/pages/Admin.tsx` - صفحة المسؤول
- `src/components/ProductForm.tsx` - نموذج إضافة المنتجات

## ملاحظات مهمة

- يجب تشغيل الخادم على المنفذ 3001 لضمان عمل الحفظ التلقائي
- في حالة عدم توفر الخادم، ستُحفظ البيانات في localStorage فقط
- يتم إنشاء ملف `store.json` تلقائياً إذا لم يكن موجوداً
- جميع العمليات (إضافة، تعديل، حذف) تحدث في الوقت الفعلي

## استكشاف الأخطاء

### إذا لم يتم حفظ البيانات في الملف:

1. تأكد من تشغيل الخادم على المنفذ 3001
2. تحقق من console المتصفح للرسائل
3. تأكد من وجود صلاحيات الكتابة في مجلد المشروع

### إذا ظهرت أخطاء CORS:

- تأكد من تشغيل الخادم والتطبيق على المنافذ الصحيحة
- الخادم يدعم CORS تلقائياً

## التطوير

لإضافة مميزات جديدة:

1. أضف endpoint جديد في `src/server/index.ts`
2. حدث `useStore.ts` لاستخدام API الجديد
3. اختبر العملية في صفحة المسؤول

# Food Ordering System

A modern food ordering system built with React, TypeScript, and Tailwind CSS.

## Features

### Admin Dashboard
- **Product Management**: Add, edit, and delete products with rich text descriptions
- **Branch Management**: Manage store branches with detailed information
- **Branch Products Management**: Assign products to specific branches using multi-select interface
- **Order Management**: View and manage customer orders
- **Analytics**: Track sales and performance metrics
- **Export Functionality**: Export store data to JSON files

### Customer Features
- **Product Browsing**: Browse products by categories with search functionality
- **Shopping Cart**: Add products to cart with quantity management
- **Order Placement**: Place orders with delivery information
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Branch Products Management

The system now includes a comprehensive branch products management feature with two approaches:

### Method 1: From Product Table (Recommended)
**Direct product-to-branch assignment from the product table:**

1. **Access Admin Panel**: Navigate to the admin dashboard
2. **View Products Table**: See all products in the products table
3. **Manage Branch Assignment**: Click the "إدارة" (Manage) button in the "الفروع" (Branches) column
4. **Select Branches**: Choose which branches should carry this product using checkboxes
5. **Save Changes**: Click "حفظ التغييرات" to update the product's branch assignment

**Features:**
- **Visual Branch Display**: See which branches currently carry each product
- **Quick Management**: Manage branch assignment directly from the product table
- **Bulk Operations**: Select/deselect multiple branches at once
- **Real-time Updates**: Changes are saved immediately to the database
- **Responsive Design**: Works on all screen sizes

### Method 2: From Branch Table (Improved)
**Direct branch-to-product assignment with enhanced UX:**

1. **Access Admin Panel**: Navigate to the admin dashboard
2. **View Branches**: See all branches in the branches table
3. **Manage Products**: Click the settings icon (⚙️) next to any branch
4. **Direct Product Selection**: The product selection dialog opens immediately for the selected branch
5. **Multi-Select Interface**: 
   - Search products by name
   - Filter by category
   - Select/deselect products using checkboxes
   - Use "Select All" for bulk operations
6. **Save Changes**: Click "Save Changes" to update the branch's product list

**Enhanced Features:**
- **Direct Access**: No need to select the branch again - opens directly for the chosen branch
- **Focused Interface**: Shows only the relevant branch information in the dialog header
- **Search & Filter**: Find products quickly with search and category filters
- **Bulk Selection**: Select all filtered products with one click
- **Visual Feedback**: See selected product count and preview
- **Real-time Updates**: Changes are saved immediately to the database

## Installation

```bash
npm install
npm run dev
```

## Technologies Used

- React 18
- TypeScript
- Tailwind CSS
- Vite
- Radix UI Components
- Sonner (Toast notifications)
- React Router
- React Helmet Async

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (shadcn/ui)
│   └── ...             # Custom components
├── pages/              # Page components
├── store/              # State management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── i18n/               # Internationalization
```

## API Endpoints

- `GET /api/store` - Get store data
- `POST /api/store` - Update store data
- `POST /api/branches` - Add new branch
- `POST /api/products` - Add new product

## Region Management System

### Comprehensive Region Management
The system now includes a complete region management feature that allows organizing branches by geographical areas:

**Features:**
- **Region Creation**: Add new regions with name and detailed notes
- **Unique Region IDs**: Each region gets a unique identifier using `crypto.randomUUID()`
- **Branch Association**: Link branches to specific regions
- **One-to-Many Relationship**: One region can contain multiple branches, but each branch belongs to only one region
- **Visual Organization**: Clear display of region-branch relationships in the admin interface

**Implementation Details:**
- **Data Structure**: 
  - Regions stored in `store.json` with `id`, `name`, `notes`, and `branches` array
  - Branches include `regionId` field to establish the relationship
- **Admin Interface**: 
  - Dedicated region management section with add/edit/delete functionality
  - Region selection dropdown in branch creation form
  - Region column in branches table showing assigned region
- **Type Safety**: Full TypeScript support with proper interfaces for regions and branches

**Example Region Structure:**
```json
{
  "id": "region-001",
  "name": "المنطقة الشمالية",
  "notes": "تضم المناطق الشمالية من المدينة وتشمل عدة فروع",
  "branches": ["branch-001", "branch-002"]
}
```

**Benefits:**
- **Geographical Organization**: Organize branches by location for better management
- **Scalability**: Easy to add new regions as the business grows
- **Data Relationships**: Clear one-to-many relationship between regions and branches
- **User Experience**: Intuitive interface for managing regional operations

## Branch Management with Unique IDs

### Unique Branch Identification
Each branch now has a unique identifier (ID) that is automatically generated when adding new branches:

**Features:**
- **Automatic ID Generation**: Uses `crypto.randomUUID()` to generate unique IDs for each branch
- **Persistent Storage**: Branch IDs are saved in `store.json` and persist across sessions
- **Unique Identification**: Each branch has a guaranteed unique identifier
- **Backward Compatibility**: Existing branches have been updated with unique IDs

**Implementation Details:**
- **New Branches**: Automatically receive a unique UUID when created
- **Existing Branches**: Updated with sequential IDs (branch-001, branch-002, etc.)
- **Data Structure**: Branch objects now include an `id` field as a required property
- **Type Safety**: Updated TypeScript interfaces to ensure ID is always present

**Example Branch Structure:**
```json
{
  "id": "branch-001",
  "name": "فرع المؤسسه",
  "address": "شارع المؤسسه بعد ابو عمار",
  "phone": "01024911062",
  "openTime": "20:12",
  "closeTime": "12:12",
  "products": [...]
}
```

**Benefits:**
- **Unique Identification**: No two branches can have the same ID
- **Data Integrity**: Ensures reliable branch identification across the system
- **Future Scalability**: Supports advanced features like branch-specific analytics
- **API Compatibility**: Maintains compatibility with existing API endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
