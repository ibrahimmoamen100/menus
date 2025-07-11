import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "@/store/useStore";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";

import { ProductCard } from "@/components/ProductCard";
import { ProductFilters } from "@/components/ProductFilters";
import { ProductModal } from "@/components/ProductModal";
import { Product } from "@/types/product";
import Footer from "@/components/Footer";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Filter, MapPin, Store, Route, Menu, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { ProductSearch } from "@/components/ProductSearch";
import { DEFAULT_SUPPLIER } from "@/constants/supplier";
import storeData from "@/data/store.json";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { updateProductArchiveStatus } from "@/utils/productUtils";
import { parseFilterUrl, createProductsUrl } from "@/utils/urlUtils";

export default function Products() {
  const { t } = useTranslation();
  const products = useStore((state) => state.products);
  const filters = useStore((state) => state.filters);
  const setFilters = useStore((state) => state.setFilters);
  const refreshProducts = useStore((state) => state.refreshProducts);
  const applyAutoArchiving = useStore((state) => state.applyAutoArchiving);
  const [searchParams] = useSearchParams();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openDrawer, setOpenDrawer] = useState(false);
  const productsPerPage = 12;

  const branches = useMemo(() => storeData.branches || [], []);
  const streets = useMemo(() => storeData.streets || [], []);
  const regions = useMemo(() => storeData.regions || [], []);

  // دوال جلب اسم الفلتر المختار
  const selectedRegion = filters.regionId ? regions.find(r => r.id === filters.regionId) : null;
  const selectedStreet = filters.streetId ? streets.find(s => s.id === filters.streetId) : null;
  const selectedBranch = filters.branchId ? branches.find(b => b.id === filters.branchId) : null;
  const selectedCategory = filters.category || null;
  const selectedSubcategory = filters.subcategory || null;

  // جلب نطاق السعر المطبق
  const minPrice = filters.minPrice;
  const maxPrice = filters.maxPrice;

  // Refresh products from store.json when component mounts
  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  // تطبيق نظام الأرشفة التلقائي عند تغيير المنتجات أو الفروع
  useEffect(() => {
    if (products && branches.length > 0) {
      applyAutoArchiving(branches);
    }
  }, [products, branches, applyAutoArchiving]);

  // Handle URL parameters on page load
  useEffect(() => {
    // استخدام النظام الجديد لتحليل معاملات URL
    const parsedFilters = parseFilterUrl(searchParams, regions, streets, branches);
    
    setFilters({
      ...filters,
      category: parsedFilters.category || undefined,
      regionId: parsedFilters.regionId || undefined,
      streetId: parsedFilters.streetId || undefined,
      branchId: parsedFilters.branchId || undefined,
      // reset subcategory/color/size إذا لم يوجد category
      subcategory: parsedFilters.category ? filters.subcategory : undefined,
      color: parsedFilters.category ? filters.color : undefined,
      size: parsedFilters.category ? filters.size : undefined,
    });
  }, [searchParams, setFilters, regions, streets, branches]);

  // Get active products (non-archived)
  const activeProducts = useMemo(() => {
    return products?.filter((product) => !product.isArchived) || [];
  }, [products]);

  // Apply all filters
  const filteredProducts = useMemo(() => {
    return activeProducts.filter((product) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!product.name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Category filter
      if (filters.category && product.category !== filters.category) {
        return false;
      }

      // Subcategory filter
      if (filters.subcategory && product.subcategory !== filters.subcategory) {
        return false;
      }

      // Price range filter
      if (filters.minPrice && product.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice && product.price > filters.maxPrice) {
        return false;
      }

      // Color filter
      if (filters.color) {
        const productColors =
          product.color?.split(",").map((c) => c.trim()) || [];
        if (!productColors.includes(filters.color)) {
          return false;
        }
      }

      // Size filter
      if (filters.size) {
        const productSizes =
          product.size?.split(",").map((s) => s.trim()) || [];
        if (!productSizes.includes(filters.size)) {
          return false;
        }
      }

      // Filter by branch - المنتج يجب أن يكون موجود في الفرع المحدد
      if (filters.branchId) {
        const branch = branches.find((b) => b.id === filters.branchId);
        if (!branch || !(branch.products || []).map((p) => typeof p === "string" ? p : p.id).includes(product.id)) return false;
      }

      // Filter by street - المنتج يجب أن يكون موجود في أحد فروع الشارع المحدد
      if (filters.streetId) {
        const streetBranches = branches.filter((b) => b.streetId === filters.streetId);
        const branchProductIds = streetBranches.flatMap((b) => (b.products || []).map((p) => typeof p === "string" ? p : p.id));
        if (!branchProductIds.includes(product.id)) return false;
      }

      // Filter by region - المنتج يجب أن يكون موجود في أحد فروع المنطقة المحددة
      if (filters.regionId) {
        const regionStreetIds = streets.filter((s) => s.regionId === filters.regionId).map((s) => s.id);
        const regionBranches = branches.filter((b) => regionStreetIds.includes(b.streetId));
        const branchProductIds = regionBranches.flatMap((b) => (b.products || []).map((p) => typeof p === "string" ? p : p.id));
        if (!branchProductIds.includes(product.id)) return false;
      }

      return true;
    });
  }, [activeProducts, filters]);

  // إنشاء قائمة المنتجات مع تكرارها لكل فرع تحتوي عليه
  const productsWithBranches = useMemo(() => {
    const result: Array<{
      product: Product;
      branch: typeof branches[0];
      street: typeof streets[0] | null;
      region: typeof regions[0] | null;
    }> = [];

    filteredProducts.forEach(product => {
      // تحديد الفروع التي تحتوي على هذا المنتج
      let relevantBranches: typeof branches = [];

      if (filters.branchId) {
        // إذا كان هناك فلتر فرع، أضف فقط هذا الفرع
        const branch = branches.find(b => b.id === filters.branchId && (b.products || []).some(p => (typeof p === "string" ? p : p.id) === product.id));
        if (branch) relevantBranches.push(branch);
      } else if (filters.streetId) {
        // إذا كان هناك فلتر شارع، أضف جميع الفروع في هذا الشارع التي تحتوي على المنتج
        const streetBranches = branches.filter(b => b.streetId === filters.streetId);
        relevantBranches = streetBranches.filter(b => (b.products || []).some(p => (typeof p === "string" ? p : p.id) === product.id));
      } else if (filters.regionId) {
        // إذا كان هناك فلتر منطقة، أضف جميع الفروع في هذه المنطقة التي تحتوي على المنتج
        const regionStreetIds = streets.filter(s => s.regionId === filters.regionId).map(s => s.id);
        const regionBranches = branches.filter(b => regionStreetIds.includes(b.streetId));
        relevantBranches = regionBranches.filter(b => (b.products || []).some(p => (typeof p === "string" ? p : p.id) === product.id));
      } else {
        // إذا لم يكن هناك فلتر، أضف جميع الفروع التي تحتوي على المنتج
        relevantBranches = branches.filter(b => (b.products || []).some(p => (typeof p === "string" ? p : p.id) === product.id));
      }

      // إضافة المنتج لكل فرع يحتوي عليه
      relevantBranches.forEach(branch => {
        const street = streets.find(s => s.id === branch.streetId) || null;
        const region = street ? regions.find(r => r.id === street.regionId) || null : null;
        
        result.push({
          product,
          branch,
          street,
          region
        });
      });
    });

    return result;
  }, [filteredProducts, filters.branchId, filters.streetId, filters.regionId, branches, streets, regions]);

  // القيم الافتراضية لنطاق السعر
  const defaultMinPrice = useMemo(() => {
    if (!filteredProducts.length) return 0;
    return Math.min(...filteredProducts.map((p) => p.price));
  }, [filteredProducts]);
  const defaultMaxPrice = useMemo(() => {
    if (!filteredProducts.length) return 0;
    return Math.max(...filteredProducts.map((p) => p.price));
  }, [filteredProducts]);

  // Apply sorting
  const sortedProducts = useMemo(() => {
    if (filters.sortBy === "branch-asc" || filters.sortBy === "branch-desc") {
      // تجميع المنتجات حسب الفروع أولاً
      const productsByBranch: { [branchName: string]: Array<{
        product: Product;
        branch: typeof branches[0];
        street: typeof streets[0] | null;
        region: typeof regions[0] | null;
      }> } = {};
      
      // إضافة المنتجات إلى مجموعات الفروع
      productsWithBranches.forEach(item => {
        const branchName = item.branch?.name || "بدون فرع";
        
        if (!productsByBranch[branchName]) {
          productsByBranch[branchName] = [];
        }
        productsByBranch[branchName].push(item);
      });
      
      // ترتيب أسماء الفروع
      const sortedBranchNames = Object.keys(productsByBranch).sort((a, b) => {
        if (filters.sortBy === "branch-asc") {
          return a.localeCompare(b);
        } else {
          return b.localeCompare(a);
        }
      });
      
      // تجميع المنتجات مرتبة حسب الفروع
      const result: Array<{
        product: Product;
        branch: typeof branches[0];
        street: typeof streets[0] | null;
        region: typeof regions[0] | null;
      }> = [];
      sortedBranchNames.forEach(branchName => {
        result.push(...productsByBranch[branchName]);
      });
      
      return result;
    } else {
      // الترتيب العادي للمنتجات
      return [...productsWithBranches].sort((a, b) => {
        if (filters.sortBy === "price-asc") {
          return a.product.price - b.product.price;
        } else if (filters.sortBy === "price-desc") {
          return b.product.price - a.product.price;
        } else if (filters.sortBy === "name-asc") {
          return a.product.name.localeCompare(b.product.name);
        } else if (filters.sortBy === "name-desc") {
          return b.product.name.localeCompare(a.product.name);
        }
        return 0;
      });
    }
  }, [productsWithBranches, filters.sortBy, branches]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = sortedProducts.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleViewProduct = (product: Product, branch?: any, street?: any, region?: any) => {
    // إضافة معلومات الفرع والشارع والمنطقة إلى المنتج
    const productWithBranch = {
      ...product,
      branch: branch ? { id: branch.id, name: branch.name } : undefined,
      street: street ? { id: street.id, name: street.name } : undefined,
      region: region ? { id: region.id, name: region.name } : undefined,
    };
    setSelectedProduct(productWithBranch);
    setIsModalOpen(true);
  };

  // حساب الفئات المتاحة فقط من المنتجات المفلترة حسب الفروع/الشوارع/المناطق (دون تصفية category)
  const availableCategories = useMemo(() => {
    // المنتجات المفلترة بدون شرط الفئة
    const productsForCategories = activeProducts.filter((product) => {
      // فلترة حسب الفرع
      if (filters.branchId) {
        const branch = branches.find((b) => b.id === filters.branchId);
        if (!branch || !(branch.products || []).map((p) => typeof p === "string" ? p : p.id).includes(product.id)) return false;
      }
      // فلترة حسب الشارع
      if (filters.streetId) {
        const streetBranches = branches.filter((b) => b.streetId === filters.streetId);
        const branchProductIds = streetBranches.flatMap((b) => (b.products || []).map((p) => typeof p === "string" ? p : p.id));
        if (!branchProductIds.includes(product.id)) return false;
      }
      // فلترة حسب المنطقة
      if (filters.regionId) {
        const regionStreetIds = streets.filter((s) => s.regionId === filters.regionId).map((s) => s.id);
        const regionBranches = branches.filter((b) => regionStreetIds.includes(b.streetId));
        const branchProductIds = regionBranches.flatMap((b) => (b.products || []).map((p) => typeof p === "string" ? p : p.id));
        if (!branchProductIds.includes(product.id)) return false;
      }
      return true;
    });
    return Array.from(
      new Set(productsForCategories.map((p) => p.category).filter(Boolean))
    );
  }, [activeProducts, filters.branchId, filters.streetId, filters.regionId, branches, streets]);

  return (
    <div className="min-h-screen flex flex-col">


      <div className="container py-8">

        <div className="w-full mb-6">
          <ProductSearch
            value={filters.search || ""}
            onChange={(value) => setFilters({ ...filters, search: value })}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Mobile Filter Button */}
          <div className="md:hidden mb-4">
            <Drawer open={openDrawer} onOpenChange={setOpenDrawer}>
              <DrawerTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  {t("filters.title")}
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                  <DrawerHeader>
                    <DrawerTitle>{t("filters.title")}</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-4 overflow-y-auto max-h-[80vh]">
                    <ProductFilters categories={availableCategories} />
                  </div>
                  <DrawerFooter className="border-t">
                    <Button
                      variant="outline"
                      onClick={() => setOpenDrawer(false)}
                    >
                      {t("common.close")}
                    </Button>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          {/* Desktop Filters */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <ProductFilters categories={availableCategories} />
          </div>

          {/* Products Grid */}
          <div className="flex-1">

                    {/* مجموعة الفلاتر المختارة */}
        <Card className="mb-4 p-2 md:p-2 bg-white/80 flex flex-row items-start gap-2 shadow-sm border border-gray-200">
          <div className="font-semibold text-gray-700 mb-2 text-base md:text-lg flex flex-row items-center gap-2">
            التصفية حسب :
          </div>
          <div className="flex flex-wrap sm:flex-row flex-col gap-2 items-start md:items-center min-h-[32px]">
            {!(selectedRegion || selectedStreet || selectedBranch || selectedCategory || selectedSubcategory || (typeof minPrice === "number" && typeof maxPrice === "number" && (minPrice !== defaultMinPrice || maxPrice !== defaultMaxPrice))) ? (
              <span className="text-gray-400 text-sm py-2">لم يتم اختيار أي تصفية بعد</span>
            ) : (
              <>
                {selectedRegion && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 w-full md:w-auto text-center">
                    المنطقة: {selectedRegion.name}
                  </Badge>
                )}
                {selectedStreet && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 w-full md:w-auto text-center">
                    الشارع: {selectedStreet.name}
                  </Badge>
                )}
                {selectedBranch && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 w-full md:w-auto text-center">
                    الفرع: {selectedBranch.name}
                  </Badge>
                )}
                {selectedCategory && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 w-full md:w-auto text-center">
                    الفئة: {selectedCategory}
                  </Badge>
                )}
                {selectedSubcategory && (
                  <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200 w-full md:w-auto text-center">
                    التصنيف الفرعي: {selectedSubcategory}
                  </Badge>
                )}
                {typeof minPrice === "number" && typeof maxPrice === "number" &&
                  (minPrice !== defaultMinPrice || maxPrice !== defaultMaxPrice) && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 w-full md:w-auto text-center">
                    السعر: من {minPrice} إلى {maxPrice}
                  </Badge>
                )}
              </>
            )}
          </div>
        </Card>
            <div className="mb-6">
              <p className="text-muted-foreground">
                {t("products.showing")} {startIndex + 1}-
                {Math.min(endIndex, sortedProducts.length)} {t("products.of")}{" "}
                {sortedProducts.length} {t("products.products")}
              </p>
            </div>

            {currentProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {t("products.noProductsFound")}
                </p>
              </div>
            ) : (
              <>
                {/* عرض مع العناوين عندما يكون الترتيب حسب الفروع أو عند التصفية حسب الشارع أو الفرع أو عندما تكون المنتجات مجمعة حسب الفروع */}
                {(filters.sortBy === "branch-asc" || filters.sortBy === "branch-desc" || filters.streetId || filters.branchId || (currentProducts.length > 0 && currentProducts.some(item => item?.branch))) ? (
                  <div className="space-y-8">
                    {(() => {
                      // تجميع المنتجات حسب الفروع للعرض مع العناوين
                      const productsByBranch: { [branchName: string]: Array<{
                        product: Product;
                        branch: typeof branches[0];
                        street: typeof streets[0] | null;
                        region: typeof regions[0] | null;
                      }> } = {};
                      
                      currentProducts.forEach(item => {
                        if (!item || !item.branch) return;
                        const branchName = item.branch.name || "بدون فرع";
                        
                        if (!productsByBranch[branchName]) {
                          productsByBranch[branchName] = [];
                        }
                        productsByBranch[branchName].push(item);
                      });
                      
                      // ترتيب أسماء الفروع حسب الترتيب المختار
                      const sortedBranchNames = Object.keys(productsByBranch).sort((a, b) => {
                        if (filters.sortBy === "branch-asc") {
                          return a.localeCompare(b);
                        } else if (filters.sortBy === "branch-desc") {
                          return b.localeCompare(a);
                        }
                        return 0;
                      });
                      
                      return sortedBranchNames.map((branchName, index) => {
                        // البحث عن معلومات الفرع والشارع والمنطقة
                        const firstItem = productsByBranch[branchName][0];
                        if (!firstItem) return null;
                        
                        const branch = firstItem.branch;
                        const street = firstItem.street;
                        const region = firstItem.region;
                        
                        return (
                          <div key={branchName} className="space-y-4">
                            {/* عنوان الفرع */}
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                              <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 rounded-xl border-2 border-primary/30 shadow-lg">
                                <div className="flex items-center gap-2">
                                  <ChefHat className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex flex-col items-center">
                                  <h2 className="md:text-xl text-lg font-bold text-primary">
                                    قائمة {branchName}
                                  </h2>
                                  <div className="flex items-center gap-2 mt-1">
                                    {region && (
                                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200 flex items-center gap-1">
                                        <MapPin className="w-3 h-3 inline mr-1" />
                                        {region.name}
                                      </span>
                                    )}
                                    {street && (
                                      <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200 flex items-center gap-1">
                                        <Route className="w-3 h-3 inline mr-1" />
                                        {street.name}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-sm text-muted-foreground font-medium mt-1">
                                    {productsByBranch[branchName].length} منتج متوفر
                                  </span>
                                </div>
                              </div>
                              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                            </div>
                            
                            {/* منتجات الفرع */}
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                              {productsByBranch[branchName].map((item) => {
                                if (!item || !item.product || !item.branch) return null;
                                return (
                                  <ProductCard
                                    key={`${item.product.id}-${item.branch.id}`}
                                    product={{
                                      ...item.product,
                                      branch: item.branch ? { id: item.branch.id, name: item.branch.name } : undefined,
                                      street: item.street ? { id: item.street.id, name: item.street.name } : undefined,
                                      region: item.region ? { id: item.region.id, name: item.region.name } : undefined,
                                    }}
                                    onView={() => handleViewProduct(item.product, item.branch, item.street, item.region)}
                                  />
                                );
                              })}
                            </div>
                            
                            {/* فاصل بين الفروع (إلا إذا كان آخر فرع) */}
                            {/* {index < sortedBranchNames.length - 1 && (
                              <div className="my-12 flex items-center justify-center">
                                <div className="flex items-center gap-4 w-full max-w-md">
                                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
                                    <Store className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-500 font-medium">الفرع التالي</span>
                                  </div>
                                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                                </div>
                              </div>
                            )} */}
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  /* العرض العادي للمنتجات بدون عناوين الفروع */
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {currentProducts.map((item) => {
                      if (!item || !item.product || !item.branch) return null;
                      return (
                        <ProductCard
                          key={`${item.product.id}-${item.branch.id}`}
                          product={{
                            ...item.product,
                            branch: item.branch ? { id: item.branch.id, name: item.branch.name } : undefined,
                            street: item.street ? { id: item.street.id, name: item.street.name } : undefined,
                            region: item.region ? { id: item.region.id, name: item.region.name } : undefined,
                          }}
                          onView={() => handleViewProduct(item.product, item.branch, item.street, item.region)}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />

      <ProductModal
        product={selectedProduct}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}
