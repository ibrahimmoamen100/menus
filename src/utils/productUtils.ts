import { Product } from "@/types/product";

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
  products?: Array<{ id: string; name: string }>;
  streetId?: string;
}

/**
 * تحقق من المنتجات التي لم يتم ربطها بأي فرع
 * @param products قائمة المنتجات
 * @param branches قائمة الفروع
 * @returns قائمة معرفات المنتجات التي لم يتم ربطها بأي فرع
 */
export function getUnassignedProductIds(products: Product[], branches: Branch[]): string[] {
  // جمع جميع معرفات المنتجات المربوطة بالفروع
  const assignedProductIds = new Set<string>();
  
  branches.forEach(branch => {
    if (branch.products) {
      branch.products.forEach(product => {
        assignedProductIds.add(typeof product === 'string' ? product : product.id);
      });
    }
  });
  
  // إرجاع معرفات المنتجات التي لم يتم ربطها
  return products
    .filter(product => !assignedProductIds.has(product.id))
    .map(product => product.id);
}

/**
 * أرشفة المنتجات التي لم يتم ربطها بأي فرع
 * @param products قائمة المنتجات
 * @param branches قائمة الفروع
 * @returns قائمة المنتجات المحدثة مع أرشفة المنتجات غير المربوطة
 */
export function archiveUnassignedProducts(products: Product[], branches: Branch[]): Product[] {
  const unassignedIds = getUnassignedProductIds(products, branches);
  
  return products.map(product => {
    if (unassignedIds.includes(product.id) && !product.isArchived) {
      return { ...product, isArchived: true };
    }
    return product;
  });
}

/**
 * إزالة الأرشفة من المنتجات التي تم ربطها بفرع
 * @param products قائمة المنتجات
 * @param branches قائمة الفروع
 * @returns قائمة المنتجات المحدثة مع إزالة الأرشفة من المنتجات المربوطة
 */
export function unarchiveAssignedProducts(products: Product[], branches: Branch[]): Product[] {
  // جمع جميع معرفات المنتجات المربوطة بالفروع
  const assignedProductIds = new Set<string>();
  
  branches.forEach(branch => {
    if (branch.products) {
      branch.products.forEach(product => {
        assignedProductIds.add(typeof product === 'string' ? product : product.id);
      });
    }
  });
  
  return products.map(product => {
    if (assignedProductIds.has(product.id) && product.isArchived) {
      return { ...product, isArchived: false };
    }
    return product;
  });
}

/**
 * تحديث حالة الأرشفة للمنتجات بناءً على ربطها بالفروع
 * @param products قائمة المنتجات
 * @param branches قائمة الفروع
 * @returns قائمة المنتجات المحدثة
 */
export function updateProductArchiveStatus(products: Product[], branches: Branch[]): Product[] {
  // أولاً، أرشفة المنتجات غير المربوطة
  let updatedProducts = archiveUnassignedProducts(products, branches);
  
  // ثم إزالة الأرشفة من المنتجات المربوطة
  updatedProducts = unarchiveAssignedProducts(updatedProducts, branches);
  
  return updatedProducts;
}

/**
 * تحقق من عدد المنتجات غير المربوطة
 * @param products قائمة المنتجات
 * @param branches قائمة الفروع
 * @returns عدد المنتجات غير المربوطة
 */
export function getUnassignedProductsCount(products: Product[], branches: Branch[]): number {
  return getUnassignedProductIds(products, branches).length;
}

/**
 * تحقق من عدد المنتجات المؤرشفة
 * @param products قائمة المنتجات
 * @returns عدد المنتجات المؤرشفة
 */
export function getArchivedProductsCount(products: Product[]): number {
  return products.filter(product => product.isArchived).length;
} 