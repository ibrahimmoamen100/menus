import { useStore } from "@/store/useStore";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useState, useMemo } from "react";
import { DEFAULT_SUPPLIER } from "@/constants/supplier";
import { formatPrice } from "@/utils/format";
import storeData from "@/data/store.json";
import { createProductsUrl } from "@/utils/urlUtils";
import {
  MapPin,
  Route,
  Store,
  Tag,
  Layers,
  List,
  SortAsc,
  XCircle,
} from "lucide-react";

export function ProductFilters({ categories: propCategories }: { categories: string[] }) {
  const filters = useStore((state) => state.filters) || {};
  const setFilters = useStore((state) => state.setFilters);
  const products = useStore((state) => state.products) || [];
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    category: true,
    color: false,
    size: false,
  });

  // فلاتر المنطقة والشارع والفرع
  const regions = useMemo(() => storeData.regions || [], []);
  const streets = useMemo(() => storeData.streets || [], []);
  const branches = useMemo(() => storeData.branches || [], []);

  // تصفية الشوارع حسب المنطقة المختارة
  const filteredStreets = useMemo(() => {
    if (!filters.regionId) return streets;
    return streets.filter((street) => street.regionId === filters.regionId);
  }, [filters.regionId, streets]);

  // تصفية الفروع حسب الشارع أو المنطقة
  const filteredBranches = useMemo(() => {
    if (filters.streetId) {
      return branches.filter((branch) => branch.streetId === filters.streetId);
    }
    if (filters.regionId) {
      // جميع الفروع في شوارع هذه المنطقة
      const regionStreetIds = streets.filter((s) => s.regionId === filters.regionId).map((s) => s.id);
      return branches.filter((branch) => regionStreetIds.includes(branch.streetId));
    }
    return branches;
  }, [filters.regionId, filters.streetId, branches, streets]);

  // دوال تغيير الفلاتر
  const handleRegionChange = (value: string) => {
    const newRegionId = value === "all" ? undefined : value;
    const newFilters = {
      ...filters,
      regionId: newRegionId,
      streetId: undefined,
      branchId: undefined,
    };
    setFilters(newFilters);
    
    // تحديث الرابط باستخدام النظام الجديد
    const newUrl = createProductsUrl(newFilters, regions, streets, branches);
    navigate(newUrl);
  };
  const handleStreetChange = (value: string) => {
    const newStreetId = value === "all" ? undefined : value;
    // إذا لم تكن المنطقة محددة، حددها تلقائيًا بناءً على الشارع
    let newRegionId = filters.regionId;
    if (newStreetId && !filters.regionId) {
      const streetObj = streets.find(s => s.id === newStreetId);
      if (streetObj && streetObj.regionId) {
        newRegionId = streetObj.regionId;
      }
    }
    const newFilters = {
      ...filters,
      streetId: newStreetId,
      branchId: undefined,
      regionId: newRegionId,
    };
    setFilters(newFilters);
    
    // تحديث الرابط باستخدام النظام الجديد
    const newUrl = createProductsUrl(newFilters, regions, streets, branches);
    navigate(newUrl);
  };
  const handleBranchChange = (value: string) => {
    const newBranchId = value === "all" ? undefined : value;
    // إذا لم يكن الشارع أو المنطقة محددين، حددهم تلقائيًا بناءً على الفرع
    let newStreetId = filters.streetId;
    let newRegionId = filters.regionId;
    if (newBranchId) {
      const branchObj = branches.find(b => b.id === newBranchId);
      if (branchObj) {
        if (!filters.streetId && branchObj.streetId) {
          newStreetId = branchObj.streetId;
        }
        if (!filters.regionId && branchObj.streetId) {
          const streetObj = streets.find(s => s.id === branchObj.streetId);
          if (streetObj && streetObj.regionId) {
            newRegionId = streetObj.regionId;
          }
        }
      }
    }
    const newFilters = {
      ...filters,
      branchId: newBranchId,
      streetId: newStreetId,
      regionId: newRegionId,
    };
    setFilters(newFilters);
    
    // تحديث الرابط باستخدام النظام الجديد
    const newUrl = createProductsUrl(newFilters, regions, streets, branches);
    navigate(newUrl);
  };

  // تحديث منطق تصفية المنتجات ليأخذ جميع الفلاتر المختارة معًا (AND)
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
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
      // فلترة حسب الفئة
      if (filters.category && product.category !== filters.category) {
        return false;
      }
      // فلترة حسب التصنيف الفرعي
      if (filters.subcategory && product.subcategory !== filters.subcategory) {
        return false;
      }
      // ... يمكنك إضافة شروط فلاتر أخرى هنا ...
      return true;
    });
  }, [products, filters, branches, streets]);

  // Get unique subcategories for the selected category
  const subcategories = useMemo(() => {
    if (!filters.category) return [];

    return Array.from(
      new Set(
        products
          ?.filter((p) => p.category === filters.category)
          .map((p) => p.subcategory)
          .filter(Boolean) || []
      )
    );
  }, [products, filters.category]);

  const suppliers = useMemo(() => {
    const supplierCounts = products.reduce((acc, product) => {
      const supplierName =
        product.wholesaleInfo?.supplierName || DEFAULT_SUPPLIER.name;
      if (supplierName) {
        acc[supplierName] = (acc[supplierName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Add default supplier if not exists
    if (!supplierCounts[DEFAULT_SUPPLIER.name]) {
      supplierCounts[DEFAULT_SUPPLIER.name] = 0;
    }

    return Object.entries(supplierCounts).map(([name, count]) => ({
      name,
      count,
    }));
  }, [products]);

  const colors = useMemo(() => {
    return Array.from(
      new Set(
        filteredProducts
          ?.map((p) => p.color)
          .filter(Boolean)
          .flatMap((color) => color.split(","))
      ) || []
    ).map((color) => {
      // Map color codes to color names
      const colorMap: { [key: string]: string } = {
        "#000000": "Black",
        "#FFFFFF": "White",
        "#FF0000": "Red",
        "#008000": "Green",
        "#0000FF": "Blue",
        "#FFFF00": "Yellow",
        "#800080": "Purple",
        "#FFA500": "Orange",
        "#FFC0CB": "Pink",
        "#808080": "Gray",
        "#A52A2A": "Brown",
        "#F5F5DC": "Beige",
        "#000080": "Navy",
        "#800000": "Maroon",
        "#008080": "Teal",
        "#FFD700": "Gold",
        "#C0C0C0": "Silver",
      };
      return {
        code: color,
        name: colorMap[color] || color,
      };
    });
  }, [filteredProducts]);

  const sizes = useMemo(() => {
    return Array.from(
      new Set(
        filteredProducts
          ?.map((p) => p.size)
          .filter(Boolean)
          .flatMap((size) => size.split(","))
      ) || []
    );
  }, [filteredProducts]);

  // Get min and max prices for the price range slider based on filtered products
  const prices = useMemo(() => {
    return filteredProducts?.map((p) => p.price) || [];
  }, [filteredProducts]);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Reset dependent filters when category changes
  const handleCategoryChange = (value: string) => {
    const newCategory = value === "all" ? undefined : value;
    const newFilters = {
      ...filters,
      category: newCategory,
      subcategory: undefined, // Reset subcategory only
    };
    setFilters(newFilters);

    // تحديث الرابط باستخدام النظام الجديد
    const newUrl = createProductsUrl(newFilters, regions, streets, branches);
    navigate(newUrl);
  };

  // Reset dependent filters when subcategory changes
  const handleSubcategoryChange = (value: string) => {
    setFilters({
      ...filters,
      subcategory: value === "all" ? undefined : value,
    });
  };

  const clearAllFilters = () => {
    const newFilters = {
      category: undefined,
      subcategory: undefined,
      supplier: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: undefined,
      regionId: undefined,
      streetId: undefined,
      branchId: undefined,
    };
    setFilters(newFilters);
    // Reset URL parameters
    navigate("/products");
  };

  return (
    <div className="w-full space-y-4">
      <Accordion
        type="multiple"
        className="w-full"
        defaultValue={["price", "region", "street", "branch", "category"]}
      >
        {/* Price Range Filter */}
        <AccordionItem value="price">
          <AccordionTrigger>
            <Tag className="inline-block mr-2 text-primary" size={18} />
            {t("filters.priceRange")}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {formatPrice(filters.minPrice || minPrice)}{" "}
                  {t("common.currency")}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatPrice(filters.maxPrice || maxPrice)}{" "}
                  {t("common.currency")}
                </span>
              </div>
              <Slider
                defaultValue={[minPrice, maxPrice]}
                min={minPrice}
                max={maxPrice}
                step={1}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    minPrice: value[0],
                    maxPrice: value[1],
                  })
                }
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Sort Filter */}
        <AccordionItem value="sort">
          <AccordionTrigger className="text-sm font-medium">
            <SortAsc className="inline-block mr-2 text-primary" size={18} />
            {t("filters.sortBy")}
          </AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={filters.sortBy || "branch-asc"}
              onValueChange={(
                value:
                  | "default"
                  | "price-asc"
                  | "price-desc"
                  | "name-asc"
                  | "name-desc"
                  | "branch-asc"
                  | "branch-desc"
              ) =>
                setFilters({
                  ...filters,
                  sortBy: value === "default" ? undefined : value,
                })
              }
              className="space-y-2 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="branch-asc" id="branch-asc" />
                <Label htmlFor="branch-asc">{t("filters.branchAsc")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="branch-desc" id="branch-desc" />
                <Label htmlFor="branch-desc">{t("filters.branchDesc")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="price-asc" id="price-asc" />
                <Label htmlFor="price-asc">{t("filters.priceAsc")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="price-desc" id="price-desc" />
                <Label htmlFor="price-desc">{t("filters.priceDesc")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="name-asc" id="name-asc" />
                <Label htmlFor="name-asc">{t("filters.nameAsc")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="name-desc" id="name-desc" />
                <Label htmlFor="name-desc">{t("filters.nameDesc")}</Label>
              </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        {/* Region Filter */}
        <AccordionItem value="region">
          <AccordionTrigger>
            <MapPin className="inline-block mr-2 text-primary" size={18} />
            {"المنطقة"}
          </AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={filters.regionId || "all"}
              onValueChange={handleRegionChange}
              className="space-y-2 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all-regions" />
                <Label htmlFor="all-regions">كل المناطق</Label>
              </div>
              {regions.map((region) => (
                <div key={region.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={region.id} id={region.id} />
                  <Label htmlFor={region.id}>{region.name}</Label>
                </div>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        {/* Street Filter */}
        <AccordionItem value="street">
          <AccordionTrigger>
            <Route className="inline-block mr-2 text-primary" size={18} />
            {"الشارع"}
          </AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={filters.streetId || "all"}
              onValueChange={handleStreetChange}
              className="space-y-2 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all-streets" />
                <Label htmlFor="all-streets">كل الشوارع</Label>
              </div>
              {filteredStreets.map((street) => (
                <div key={street.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={street.id} id={street.id} />
                  <Label htmlFor={street.id}>{street.name}</Label>
                </div>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        {/* Branch Filter */}
        <AccordionItem value="branch">
          <AccordionTrigger>
            <Store className="inline-block mr-2 text-primary" size={18} />
            {"الفرع"}
          </AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={filters.branchId || "all"}
              onValueChange={handleBranchChange}
              className="space-y-2 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all-branches" />
                <Label htmlFor="all-branches">كل الفروع</Label>
              </div>
              {filteredBranches.map((branch) => (
                <div key={branch.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={branch.id} id={branch.id} />
                  <Label htmlFor={branch.id}>{branch.name}</Label>
                </div>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        {/* Category Filter */}
        <AccordionItem value="category">
          <AccordionTrigger>
            <Layers className="inline-block mr-2 text-primary" size={18} />
            {t("filters.category")}
          </AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={filters.category === undefined ? "all" : filters.category}
              onValueChange={handleCategoryChange}
              className="space-y-2 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all-categories" />
                <Label htmlFor="all-categories">
                  {t("filters.allCategories")}
                </Label>
              </div>
              {propCategories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <RadioGroupItem value={category} id={category} />
                  <Label htmlFor={category}>{category}</Label>
                </div>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        {/* Subcategory Filter - Always show but disable when no category is selected */}
        <AccordionItem value="subcategory">
          <AccordionTrigger
            className={!filters.category ? "text-muted-foreground" : ""}
            disabled={!filters.category}
          >
            <List className="inline-block mr-2 text-primary" size={18} />
            {t("filters.subcategory")}
            {!filters.category && (
              <span className="text-xs text-muted-foreground ml-2">
                ({t("filters.selectCategoryFirst")})
              </span>
            )}
          </AccordionTrigger>
          <AccordionContent>
            {filters.category ? (
              <RadioGroup
                value={filters.subcategory || "all"}
                onValueChange={handleSubcategoryChange}
                className="space-y-2 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all-subcategories" />
                  <Label htmlFor="all-subcategories">
                    {t("filters.allSubcategories")}
                  </Label>
                </div>
                {subcategories.map((subcategory) => (
                  <div
                    key={subcategory}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem value={subcategory} id={subcategory} />
                    <Label htmlFor={subcategory}>{subcategory}</Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="text-sm text-muted-foreground py-2">
                {t("filters.selectCategoryFirst")}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Color Filter */}
        {/* <AccordionItem value="color">
          <AccordionTrigger className="text-sm font-medium">
            {t("filters.color")} {filters.category && `(${filters.category})`}{" "}
          </AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={filters.color || "all"}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  color: value === "all" ? undefined : value,
                })
              }
              className="space-y-2 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all-colors" />
                <Label htmlFor="all-colors">{t("filters.allColors")}</Label>
              </div>
              {colors.map((color) => (
                <div key={color.code} className="flex items-center space-x-2">
                  <RadioGroupItem value={color.code} id={color.code} />
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: color.code }}
                    />
                    <Label htmlFor={color.code}>
                      {t(`colors.${color.name}`)}
                    </Label>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem> */}

        {/* Size Filter */}
        {/* <AccordionItem value="size">
          <AccordionTrigger className="text-sm font-medium">
            {t("filters.size")} {filters.category && `(${filters.category})`}{" "}
          </AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={filters.size || "all"}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  size: value === "all" ? undefined : value,
                })
              }
              className="space-y-2 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all-sizes" />
                <Label htmlFor="all-sizes">{t("filters.allSizes")}</Label>
              </div>
              {sizes.map((size) => (
                <div key={size} className="flex items-center space-x-2">
                  <RadioGroupItem value={size} id={size} />
                  <Label htmlFor={size}>{size}</Label>
                </div>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem> */}

        {/* Sort Filter */}
        {/* <AccordionItem value="sort">
          <AccordionTrigger className="text-sm font-medium">
            <SortAsc className="inline-block mr-2 text-primary" size={18} />
            {t("filters.sortBy")}
          </AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={filters.sortBy || "default"}
              onValueChange={(
                value:
                  | "default"
                  | "price-asc"
                  | "price-desc"
                  | "name-asc"
                  | "name-desc"
                  | "branch-asc"
                  | "branch-desc"
              ) =>
                setFilters({
                  ...filters,
                  sortBy: value === "default" ? undefined : value,
                })
              }
              className="space-y-2 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="default" id="default-sort" />
                <Label htmlFor="default-sort">{t("filters.default")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="price-asc" id="price-asc" />
                <Label htmlFor="price-asc">{t("filters.priceAsc")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="price-desc" id="price-desc" />
                <Label htmlFor="price-desc">{t("filters.priceDesc")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="name-asc" id="name-asc" />
                <Label htmlFor="name-asc">{t("filters.nameAsc")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="name-desc" id="name-desc" />
                <Label htmlFor="name-desc">{t("filters.nameDesc")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="branch-asc" id="branch-asc" />
                <Label htmlFor="branch-asc">{t("filters.branchAsc")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="branch-desc" id="branch-desc" />
                <Label htmlFor="branch-desc">{t("filters.branchDesc")}</Label>
              </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem> */}
      </Accordion>

      {/* Clear Filters Button */}
      <Button variant="outline" className="w-full" onClick={clearAllFilters}>
        <XCircle className="inline-block mr-2 text-destructive" size={18} />
        {t("filters.clearAll")}
      </Button>
    </div>
  );
}
