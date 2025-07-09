/**
 * تحويل النص إلى slug مناسب للـ URL
 * @param text النص المراد تحويله
 * @returns slug مناسب للـ URL
 */
export function textToSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // إزالة الأحرف الخاصة والرموز
    .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-zA-Z0-9\s-]/g, '')
    // استبدال المسافات بشرطة
    .replace(/\s+/g, '-')
    // إزالة الشرطات المتكررة
    .replace(/-+/g, '-')
    // إزالة الشرطات من البداية والنهاية
    .replace(/^-+|-+$/g, '');
}

/**
 * تحويل slug إلى نص مقروء
 * @param slug الـ slug المراد تحويله
 * @returns نص مقروء
 */
export function slugToText(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * إنشاء URL-friendly للفلاتر
 * @param filters الفلاتر الحالية
 * @returns URL-friendly string
 */
export function createFilterUrl(filters: {
  regionId?: string;
  streetId?: string;
  branchId?: string;
  category?: string;
}, regions: any[], streets: any[], branches: any[]): string {
  const params = new URLSearchParams();
  
  if (filters.regionId) {
    const region = regions.find(r => r.id === filters.regionId);
    if (region) {
      params.set('region', textToSlug(region.name));
    }
  }
  
  if (filters.streetId) {
    const street = streets.find(s => s.id === filters.streetId);
    if (street) {
      params.set('street', textToSlug(street.name));
    }
  }
  
  if (filters.branchId) {
    const branch = branches.find(b => b.id === filters.branchId);
    if (branch) {
      params.set('branch', textToSlug(branch.name));
    }
  }
  
  if (filters.category) {
    params.set('category', textToSlug(filters.category));
  }
  
  return params.toString();
}

/**
 * تحليل URL-friendly إلى فلاتر
 * @param searchParams معاملات البحث من URL
 * @param regions قائمة المناطق
 * @param streets قائمة الشوارع
 * @param branches قائمة الفروع
 * @returns الفلاتر المحللة
 */
export function parseFilterUrl(
  searchParams: URLSearchParams,
  regions: any[],
  streets: any[],
  branches: any[]
): {
  regionId?: string;
  streetId?: string;
  branchId?: string;
  category?: string;
} {
  const filters: any = {};
  
  const regionSlug = searchParams.get('region');
  if (regionSlug) {
    const region = regions.find(r => textToSlug(r.name) === regionSlug);
    if (region) {
      filters.regionId = region.id;
    }
  }
  
  const streetSlug = searchParams.get('street');
  if (streetSlug) {
    const street = streets.find(s => textToSlug(s.name) === streetSlug);
    if (street) {
      filters.streetId = street.id;
    }
  }
  
  const branchSlug = searchParams.get('branch');
  if (branchSlug) {
    const branch = branches.find(b => textToSlug(b.name) === branchSlug);
    if (branch) {
      filters.branchId = branch.id;
    }
  }
  
  const categorySlug = searchParams.get('category');
  if (categorySlug) {
    // تحويل slug الفئة إلى النص الأصلي
    filters.category = slugToText(categorySlug);
  }
  
  return filters;
}

/**
 * إنشاء URL للمنتج مع الفلاتر
 * @param productId معرف المنتج
 * @param filters الفلاتر الحالية
 * @param regions قائمة المناطق
 * @param streets قائمة الشوارع
 * @param branches قائمة الفروع
 * @returns URL للمنتج
 */
export function createProductUrl(
  productId: string,
  filters: {
    regionId?: string;
    streetId?: string;
    branchId?: string;
    category?: string;
  },
  regions: any[],
  streets: any[],
  branches: any[]
): string {
  const baseUrl = `/products/${productId}`;
  const filterParams = createFilterUrl(filters, regions, streets, branches);
  
  if (filterParams) {
    return `${baseUrl}?${filterParams}`;
  }
  
  return baseUrl;
}

/**
 * إنشاء URL للصفحة الرئيسية للمنتجات مع الفلاتر
 * @param filters الفلاتر الحالية
 * @param regions قائمة المناطق
 * @param streets قائمة الشوارع
 * @param branches قائمة الفروع
 * @returns URL للصفحة الرئيسية للمنتجات
 */
export function createProductsUrl(
  filters: {
    regionId?: string;
    streetId?: string;
    branchId?: string;
    category?: string;
  },
  regions: any[],
  streets: any[],
  branches: any[]
): string {
  const baseUrl = '/products';
  const filterParams = createFilterUrl(filters, regions, streets, branches);
  
  if (filterParams) {
    return `${baseUrl}?${filterParams}`;
  }
  
  return baseUrl;
} 