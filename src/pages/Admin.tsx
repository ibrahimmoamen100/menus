import { useState, useMemo, useCallback, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Product } from "@/types/product";
import { Navbar } from "@/components/Navbar";
import { authService } from "@/services/authService";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EditProductModal } from "@/components/EditProductModal";
import { ProductSearch } from "@/components/ProductSearch";
import { ProductTable } from "@/components/ProductTable";
import { ProductForm } from "@/components/ProductForm";
import { AdminFilters } from "@/components/AdminFilters";
import { BranchProductsManager } from "@/components/BranchProductsManager";
import { RegionStreetsManager } from "@/components/RegionStreetsManager";
import StreetManager from "@/components/StreetManager";
import { toast } from "sonner";
import { exportStoreToFile } from "@/utils/exportStore";
import {
  Download,
  Package,
  Tag,
  Percent,
  Timer,
  Building2,
  Calendar as CalendarIcon,
  ChevronDown,
  Filter,
  Pencil,
  Trash2,
  ShoppingCart,
  BarChart3,
  Settings,
  MapPin,
  LogOut,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { DEFAULT_SUPPLIER } from "@/constants/supplier";
import { Card } from "@/components/ui/card";
import { updateProductArchiveStatus, getUnassignedProductsCount } from "@/utils/productUtils";
import { UnassignedProductsAlert } from "@/components/UnassignedProductsAlert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Region form state type
interface RegionForm {
  id?: string;
  name: string;
  notes: string;
  streets?: string[];
}

// Region interface for display
interface Region {
  id: string;
  name: string;
  notes: string;
  streets: string[];
  branches?: string[];
}

// Branch form state type
interface BranchForm {
  id?: string;
  name: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
  streetId?: string;
  products?: Array<{ id: string; name: string }>;
}

// Extended branch interface for display
interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
  streetId?: string;
  products?: Array<{ id: string; name: string }>;
}

const Admin = () => {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [filters, setFilters] = useState({
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    category: undefined as string | undefined,
    supplier: undefined as string | undefined,
    isArchived: false,
    archivedStatus: "active" as "all" | "archived" | "active",
    specialOffer: "all" as "all" | "with-offer" | "without-offer",
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // State for streets
  const [streets, setStreets] = useState<any[]>([]);

  const { products, addProduct, deleteProduct, updateProduct } = useStore();

  // Get unique suppliers from products
  const uniqueSuppliers = useMemo(() => {
    const suppliers = new Set<string>();
    products?.forEach((product) => {
      if (product.wholesaleInfo?.supplierName) {
        suppliers.add(product.wholesaleInfo.supplierName);
      }
    });
    return Array.from(suppliers);
  }, [products]);

  // State for statistics
  const [statistics, setStatistics] = useState({
    totalProducts: 0,
    totalRegions: 0,
    totalBranches: 0,
    activeOffers: 0,
    totalStreets: 0,
    archivedProducts: 0,
  });

  // التحقق من حالة تسجيل الدخول عند تحميل الصفحة
  useEffect(() => {
    const checkAuthStatus = async () => {
      const isAuth = authService.isAuthenticated();
      setIsAuthenticated(isAuth);
      
      // تحديث الجلسة إذا كانت صالحة
      if (isAuth) {
        await authService.refreshSession();
      }
    };
    
    checkAuthStatus();
    
    // تحديث الجلسة كل 30 دقيقة
    const interval = setInterval(async () => {
      if (authService.isAuthenticated()) {
        await authService.refreshSession();
      }
    }, 30 * 60 * 1000); // 30 minutes
    
    return () => clearInterval(interval);
  }, []);

  // Load statistics from store data and apply auto-archiving
  useEffect(() => {
    const loadStatistics = async () => {
      try {
        const storeData = await import('@/data/store.json');
        
        // تطبيق نظام الأرشفة التلقائي
        if (products && storeData.default.branches) {
          const updatedProducts = updateProductArchiveStatus(products, storeData.default.branches);
          
          // تحديث المنتجات في المتجر إذا كانت هناك تغييرات
          const hasChanges = updatedProducts.some((updatedProduct, index) => 
            updatedProduct.isArchived !== products[index]?.isArchived
          );
          
          if (hasChanges) {
            // تحديث المنتجات في المتجر
            updatedProducts.forEach(updatedProduct => {
              updateProduct(updatedProduct);
            });
            
            // إظهار إشعار بالتحديث
            const unassignedCount = getUnassignedProductsCount(products, storeData.default.branches);
            if (unassignedCount > 0) {
              toast.info(`تم أرشفة ${unassignedCount} منتج تلقائياً لعدم ربطها بأي فرع`);
            }
          }
        }
        
        setStatistics({
          totalProducts: products?.length || 0,
          totalRegions: storeData.default.regions?.length || 0,
          totalBranches: storeData.default.branches?.length || 0,
          activeOffers: products?.filter((p) => p.specialOffer).length || 0,
          totalStreets: storeData.default.streets?.length || 0,
          archivedProducts: products?.filter((p) => p.isArchived).length || 0,
        });
      } catch (error) {
        console.warn('Failed to load store data for statistics:', error);
        setStatistics({
          totalProducts: products?.length || 0,
          totalRegions: 0,
          totalBranches: 0,
          activeOffers: products?.filter((p) => p.specialOffer).length || 0,
          totalStreets: 0,
          archivedProducts: products?.filter((p) => p.isArchived).length || 0,
        });
      }
    };

    loadStatistics();
  }, [products, updateProduct]);

  const [selectedRegionId, setSelectedRegionId] = useState<string | undefined>(undefined);
  const [selectedStreetId, setSelectedStreetId] = useState<string | undefined>(undefined);
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(undefined);

  const filterProductsByDate = (products: Product[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      today.getDate()
    );
    const yearAgo = new Date(
      today.getFullYear() - 1,
      today.getMonth(),
      today.getDate()
    );

    return products.filter((product) => {
      const productDate = new Date(product.createdAt || new Date());
      let matchesDate = true;

      if (dateRange?.from && dateRange?.to) {
        const startDate = new Date(dateRange.from);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999);
        matchesDate = productDate >= startDate && productDate <= endDate;
      } else {
        switch (dateFilter) {
          case "today":
            matchesDate = productDate >= today;
            break;
          case "week":
            matchesDate = productDate >= weekAgo;
            break;
          case "month":
            matchesDate = productDate >= monthAgo;
            break;
          case "year":
            matchesDate = productDate >= yearAgo;
            break;
          default:
            matchesDate = true;
        }
      }

      const matchesPrice =
        (!filters.minPrice || product.price >= filters.minPrice) &&
        (!filters.maxPrice || product.price <= filters.maxPrice);

      const matchesCategory =
        !filters.category || product.category === filters.category;

      const matchesSupplier =
        !filters.supplier ||
        (filters.supplier === DEFAULT_SUPPLIER.name
          ? !product.wholesaleInfo?.supplierName
          : product.wholesaleInfo?.supplierName === filters.supplier);

      const matchesArchiveStatus =
        filters.archivedStatus === "all" ||
        (filters.archivedStatus === "archived" && product.isArchived) ||
        (filters.archivedStatus === "active" && !product.isArchived);

      const matchesSpecialOffer =
        filters.specialOffer === "all" ||
        (filters.specialOffer === "with-offer" && product.specialOffer) ||
        (filters.specialOffer === "without-offer" && !product.specialOffer);

      let matchesRegion = true;
      if (selectedRegionId) {
        const regionStreets = streets.filter((s) => s.regionId === selectedRegionId).map((s) => s.id);
        const regionBranches = branches.filter((b) => b.streetId && regionStreets.includes(b.streetId));
        const regionProductIds = new Set(regionBranches.flatMap((b) => b.products?.map((p) => p.id) || []));
        matchesRegion = regionProductIds.has(product.id);
      }

      let matchesStreet = true;
      if (selectedStreetId) {
        const streetBranches = branches.filter((b) => b.streetId === selectedStreetId);
        const streetProductIds = new Set(streetBranches.flatMap((b) => b.products?.map((p) => p.id) || []));
        matchesStreet = streetProductIds.has(product.id);
      }

      let matchesBranch = true;
      if (selectedBranchId) {
        const branch = branches.find((b) => b.id === selectedBranchId);
        matchesBranch = branch?.products?.some((p) => p.id === product.id) ?? false;
      }

      return (
        matchesDate &&
        matchesPrice &&
        matchesCategory &&
        matchesSupplier &&
        matchesArchiveStatus &&
        matchesSpecialOffer &&
        matchesRegion &&
        matchesStreet &&
        matchesBranch
      );
    });
  };

  const filteredProducts = filterProductsByDate(products);

  // Memoize handlers
  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
        const result = await authService.login(password);
        
        if (result.success) {
          setIsAuthenticated(true);
          setPassword("");
          toast.success(result.message);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("حدث خطأ أثناء تسجيل الدخول");
      }
    },
    [password]
  );

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      toast.success("تم تسجيل الخروج بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء تسجيل الخروج");
    }
  }, []);

  const handleExport = useCallback(() => {
    try {
      exportStoreToFile();
      toast.success("Store data exported successfully");
    } catch (error) {
      toast.error("Failed to export store data");
    }
  }, []);

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        try {
          const response = await fetch(
            `http://localhost:3001/api/products/${id}`,
            {
              method: "DELETE",
            }
          );

          if (response.ok) {
            console.log("Product deleted from store.json via API");
          } else {
            console.warn("API delete failed, using direct store update");
          }
        } catch (apiError) {
          console.log("API server not available, using direct store update");
        }

        deleteProduct(id);
        toast.success("Product deleted successfully");
      } catch (error) {
        toast.error("Failed to delete product");
      }
    },
    [deleteProduct]
  );

  const handleSaveEdit = useCallback(
    async (updatedProduct: Product) => {
      try {
        try {
          const response = await fetch(
            `http://localhost:3001/api/products/${updatedProduct.id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(updatedProduct),
            }
          );

          if (response.ok) {
            console.log("Product updated in store.json via API");
          } else {
            console.warn("API update failed, using direct store update");
          }
        } catch (apiError) {
          console.log("API server not available, using direct store update");
        }

        updateProduct(updatedProduct);
        setEditingProduct(null);
        toast.success("Product updated successfully");
      } catch (error) {
        toast.error("Failed to update product");
      }
    },
    [updateProduct]
  );

  // Region form state
  const [regions, setRegions] = useState<Region[]>([]);
  const [regionForm, setRegionForm] = useState<RegionForm>({
    id: "",
    name: "",
    notes: "",
    streets: [],
  });

  // Branch form state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [storeData, setStoreData] = useState<any>(null);
  const [showProductsManager, setShowProductsManager] = useState(false);
  const [selectedBranchForProducts, setSelectedBranchForProducts] = useState<Branch | null>(null);
  const [showStreetsManager, setShowStreetsManager] = useState(false);
  const [selectedRegionForStreets, setSelectedRegionForStreets] = useState<Region | null>(null);
  const [branchForm, setBranchForm] = useState<BranchForm>({
    id: "",
    name: "",
    address: "",
    phone: "",
    openTime: "",
    closeTime: "",
    streetId: "",
    products: [],
  });

  // Fetch regions, branches, streets and store data from API on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/store");
        if (!response.ok) throw new Error("فشل في تحميل البيانات");
        const data = await response.json();
        if (Array.isArray(data.regions)) {
          setRegions(data.regions);
        }
        if (Array.isArray(data.branches)) {
          setBranches(data.branches);
        }
        if (Array.isArray(data.streets)) {
          setStreets(data.streets);
        }
        setStoreData(data);
      } catch (error) {
        // يمكن عرض رسالة خطأ إذا رغبت
      }
    };
    fetchData();
  }, []);

  // Handle region form submit
  const handleRegionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regionForm.name || !regionForm.notes) {
      toast.error("يرجى ملء جميع الحقول للمنطقة");
      return;
    }
    try {
      // إنشاء منطقة جديدة مع ID فريد
      const newRegion: Region = {
        id: `region-${crypto.randomUUID()}`,
        name: regionForm.name,
        notes: regionForm.notes,
        streets: regionForm.streets || [],
      };

      const response = await fetch("http://localhost:3001/api/regions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRegion),
      });
      if (!response.ok) {
        throw new Error("فشل في حفظ المنطقة في قاعدة البيانات");
      }
      setRegions((prev) => [...prev, newRegion]);
      toast.success("تم إضافة المنطقة وحفظها في قاعدة البيانات");
      setRegionForm({
        id: "",
        name: "",
        notes: "",
        streets: [],
      });
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ المنطقة");
    }
  };

  // Handle branch form submit
  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !branchForm.name ||
      !branchForm.address ||
      !branchForm.phone ||
      !branchForm.openTime ||
      !branchForm.closeTime
    ) {
      toast.error("يرجى ملء جميع الحقول للفروع");
      return;
    }
    try {
      // إنشاء فرع جديد مع ID فريد
      const newBranch: Branch = {
        id: `branch-${crypto.randomUUID()}`,
        name: branchForm.name,
        address: branchForm.address,
        phone: branchForm.phone,
        openTime: branchForm.openTime,
        closeTime: branchForm.closeTime,
        products: [],
      };

      const response = await fetch("http://localhost:3001/api/branches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBranch),
      });
      if (!response.ok) {
        throw new Error("فشل في حفظ الفرع في قاعدة البيانات");
      }
      setBranches((prev) => [...prev, newBranch]);
      toast.success("تم إضافة الفرع وحفظه في قاعدة البيانات");
      setBranchForm({
        id: "",
        name: "",
        address: "",
        phone: "",
        openTime: "",
        closeTime: "",
        products: [],
      });
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ الفرع");
    }
  };

  const [editRegionIdx, setEditRegionIdx] = useState<number | null>(null);
  const [editRegionForm, setEditRegionForm] = useState<RegionForm | null>(null);
  const [deleteRegionIdx, setDeleteRegionIdx] = useState<number | null>(null);
  const [isEditRegionDialogOpen, setIsEditRegionDialogOpen] = useState(false);
  const [isDeleteRegionDialogOpen, setIsDeleteRegionDialogOpen] = useState(false);

  const [editBranchIdx, setEditBranchIdx] = useState<number | null>(null);
  const [editBranchForm, setEditBranchForm] = useState<BranchForm | null>(null);
  const [deleteBranchIdx, setDeleteBranchIdx] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Handle edit region
  const handleEditRegion = (idx: number) => {
    closeAllModals();
    setEditRegionIdx(idx);
    setEditRegionForm(regions[idx]);
    setIsEditRegionDialogOpen(true);
  };

  const handleEditRegionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRegionForm || !storeData) return;
    try {
      // تحديث المنطقة في store.json
      const response = await fetch("http://localhost:3001/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...storeData,
          regions: regions.map((r, i) =>
            i === editRegionIdx ? editRegionForm : r
          ),
        }),
      });
      if (!response.ok) throw new Error();
      // تحديث الحالة محلياً
      setRegions((prev) =>
        prev.map((r, i) => (i === editRegionIdx ? { ...editRegionForm, id: r.id, streets: editRegionForm.streets || [] } : r))
      );
      toast.success("تم تعديل بيانات المنطقة بنجاح");
      setIsEditRegionDialogOpen(false);
    } catch {
      toast.error("حدث خطأ أثناء تعديل بيانات المنطقة");
    }
  };

  // Handle delete region
  const handleDeleteRegion = (idx: number) => {
    closeAllModals();
    setDeleteRegionIdx(idx);
    setIsDeleteRegionDialogOpen(true);
  };

  const confirmDeleteRegion = async () => {
    try {
      if (!storeData) throw new Error();
      const newRegions = regions.filter((_, i) => i !== deleteRegionIdx);
      // تحديث store.json
      const response = await fetch("http://localhost:3001/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...storeData,
          regions: newRegions,
        }),
      });
      if (!response.ok) throw new Error();
      setRegions(newRegions);
      toast.success("تم حذف المنطقة بنجاح");
      setIsDeleteRegionDialogOpen(false);
    } catch {
      toast.error("حدث خطأ أثناء حذف المنطقة");
    }
  };

  // Handle edit branch
  const handleEditBranch = (idx: number) => {
    closeAllModals();
    setEditBranchIdx(idx);
    setEditBranchForm(branches[idx]);
    setIsEditDialogOpen(true);
  };

  const handleEditBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBranchForm || !storeData) return;
    try {
      // تحديث الفرع في store.json
      const response = await fetch("http://localhost:3001/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...storeData,
          branches: branches.map((b, i) =>
            i === editBranchIdx ? editBranchForm : b
          ),
        }),
      });
      if (!response.ok) throw new Error();
      // تحديث الحالة محلياً
      setBranches((prev) =>
        prev.map((b, i) => (i === editBranchIdx ? { ...editBranchForm, id: b.id } : b))
      );
      toast.success("تم تعديل بيانات الفرع بنجاح");
      setIsEditDialogOpen(false);
    } catch {
      toast.error("حدث خطأ أثناء تعديل بيانات الفرع");
    }
  };

  // Handle delete branch
  const handleDeleteBranch = (idx: number) => {
    closeAllModals();
    setDeleteBranchIdx(idx);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteBranch = async () => {
    try {
      if (!storeData) throw new Error();
      const newBranches = branches.filter((_, i) => i !== deleteBranchIdx);
      // تحديث store.json
      const response = await fetch("http://localhost:3001/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...storeData,
          branches: newBranches,
        }),
      });
      if (!response.ok) throw new Error();
      setBranches(newBranches);
      toast.success("تم حذف الفرع بنجاح");
      setIsDeleteDialogOpen(false);
    } catch {
      toast.error("حدث خطأ أثناء حذف الفرع");
    }
  };

  // Handle updating branch products
  const handleUpdateBranchProducts = async (branchId: string, products: Array<{ id: string; name: string }>) => {
    try {
      if (!storeData) throw new Error();
      
      const updatedBranches = branches.map((branch) => 
        branch.id === branchId ? { ...branch, products } : branch
      );

      const response = await fetch("http://localhost:3001/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...storeData,
          branches: updatedBranches,
        }),
      });

      if (!response.ok) throw new Error();
      
      setBranches(updatedBranches);
      
      // تطبيق نظام الأرشفة التلقائي بعد تحديث الفروع
      if (storeData.products) {
        const updatedProducts = updateProductArchiveStatus(storeData.products, updatedBranches);
        
        // تحديث المنتجات في المتجر إذا كانت هناك تغييرات
        updatedProducts.forEach(updatedProduct => {
          updateProduct(updatedProduct);
        });
        
        // إظهار إشعار بالتحديث
        const unassignedCount = getUnassignedProductsCount(storeData.products, updatedBranches);
        if (unassignedCount > 0) {
          toast.info(`تم أرشفة ${unassignedCount} منتج تلقائياً لعدم ربطها بأي فرع`);
        }
      }
      
      toast.success("تم تحديث منتجات الفرع بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث منتجات الفرع");
      throw error;
    }
  };

  // Handle updating region streets
  const handleUpdateRegionStreets = async (regionId: string, streets: string[]) => {
    try {
      if (!storeData) throw new Error();
      
      // Update regions with new streets
      const updatedRegions = regions.map((region) => 
        region.id === regionId ? { ...region, streets } : region
      );

      // Update streets with new regionId
      const updatedStreets = storeData.streets.map((street) => {
        if (streets.includes(street.id)) {
          // Assign to this region
          return { ...street, regionId };
        } else if (street.regionId === regionId) {
          // Remove from this region
          return { ...street, regionId: null };
        }
        return street;
      });

      const response = await fetch("http://localhost:3001/api/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...storeData,
          regions: updatedRegions,
          streets: updatedStreets,
        }),
      });

      if (!response.ok) throw new Error();
      
      setRegions(updatedRegions);
      setStreets(updatedStreets);
      toast.success("تم تحديث شوارع المنطقة بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث شوارع المنطقة");
      throw error;
    }
  };

  // Function to close all modals
  const closeAllModals = () => {
    setShowProductsManager(false);
    setShowStreetsManager(false);
    setSelectedBranchForProducts(null);
    setSelectedRegionForStreets(null);
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setIsEditRegionDialogOpen(false);
    setIsDeleteRegionDialogOpen(false);
    setEditRegionForm(null);
    setEditBranchForm(null);
  };

  // Handle closing products manager
  const handleCloseProductsManager = () => {
    closeAllModals();
  };

  // Handle closing streets manager
  const handleCloseStreetsManager = () => {
    closeAllModals();
  };

  const handleDataChange = () => {
    // Refresh data when streets are updated
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/store");
        if (!response.ok) throw new Error("فشل في تحميل البيانات");
        const data = await response.json();
        if (Array.isArray(data.regions)) {
          setRegions(data.regions);
        }
        if (Array.isArray(data.branches)) {
          setBranches(data.branches);
        }
        if (Array.isArray(data.streets)) {
          setStreets(data.streets);
        }
        setStoreData(data);
      } catch (error) {
        console.error("Error refreshing data:", error);
      }
    };
    fetchData();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Helmet>
          <title>Admin Login</title>
          <meta
            name="description"
            content="Admin login page for the store management system"
          />
        </Helmet>
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-4"
          role="form"
          aria-label="Admin login form"
        >
          <h1 className="text-2xl font-bold text-center">تسجيل دخول المسؤول</h1>
          <p className="text-sm text-gray-600 text-center">
            أدخل كلمة المرور للوصول إلى لوحة التحكم
          </p>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور"
            aria-label="Password"
            required
            className="text-center"
          />
          <Button type="submit" className="w-full" aria-label="Login button">
            تسجيل الدخول
          </Button>
          
          {/* معلومات الجلسة إذا كانت موجودة */}
          {authService.getSession() && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
              <p className="text-blue-800">
                <strong>آخر تسجيل دخول:</strong> {new Date(authService.getSession()?.loginTime || 0).toLocaleString('ar-EG')}
              </p>
              <p className="text-blue-600">
                <strong>ينتهي في:</strong> {new Date(authService.getSession()?.expiresAt || 0).toLocaleString('ar-EG')}
              </p>
            </div>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>لوحة التحكم</title>
        <meta
          name="description"
          content="لوحة تحكم المسؤول لإدارة منتجات المتجر والمخزون"
        />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <main className="max-w-[90%] mx-auto py-8">
        <div className="mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{t("admin.dashboard")}</h1>
              {/* معلومات الجلسة */}
              {authService.getSession() && (
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                  <span>
                    <strong>تسجيل الدخول:</strong> {new Date(authService.getSession()?.loginTime || 0).toLocaleString('ar-EG')}
                  </span>
                  <span>
                    <strong>ينتهي في:</strong> {new Date(authService.getSession()?.expiresAt || 0).toLocaleString('ar-EG')}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Link to="/admin/orders">
                <Button variant="outline" className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  {t("admin.orders")}
                </Button>
              </Link>
              <Link to="/admin/analytics">
                <Button variant="outline" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  {t("admin.analytics")}
                </Button>
              </Link>
              <Button
                onClick={handleExport}
                className="gap-2"
                aria-label={t("admin.exportStore")}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {t("admin.exportStore")}
              </Button>
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </Button>
            </div>
          </div>

          {/* Statistics Section */}
          <div
            className="grid gap-4 md:grid-cols-6 mb-8"
            role="region"
            aria-label={t("analytics.title")}
          >
            <div className="bg-card rounded-lg border p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Package
                  className="h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-medium">
                  {t("analytics.metrics.totalProducts")}
                </h3>
              </div>
              <p className="text-2xl font-bold mt-2">
                {statistics.totalProducts}
              </p>
            </div>
            <div className="bg-card rounded-lg border p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <MapPin
                  className="h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-medium">
                  إجمالي المناطق
                </h3>
              </div>
              <p className="text-2xl font-bold mt-2">
                {statistics.totalRegions}
              </p>
            </div>
            <div className="bg-card rounded-lg border p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Building2
                  className="h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-medium">
                  إجمالي الفروع
                </h3>
              </div>
              <p className="text-2xl font-bold mt-2">
                {statistics.totalBranches}
              </p>
            </div>
            <div className="bg-card rounded-lg border p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Percent
                  className="h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-medium">
                  العروض النشطة
                </h3>
              </div>
              <p className="text-2xl font-bold mt-2">
                {statistics.activeOffers}
              </p>
            </div>
            <div className="bg-card rounded-lg border p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <MapPin
                  className="h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-medium">
                  إجمالي الشوارع
                </h3>
              </div>
              <p className="text-2xl font-bold mt-2">
                {statistics.totalStreets}
              </p>
            </div>
            <div className="bg-card rounded-lg border p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Timer
                  className="h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-medium">
                  {t("analytics.metrics.archivedProducts")}
                </h3>
              </div>
              <p className="text-2xl font-bold mt-2">
                {statistics.archivedProducts}
              </p>
            </div>
          </div>

          {/* Unassigned Products Alert */}
          <UnassignedProductsAlert
            products={products || []}
            branches={branches}
            onManageProducts={() => {
              // يمكن إضافة منطق لفتح مدير المنتجات هنا
              toast.info("استخدم جدول المنتجات لإدارة ربط المنتجات بالفروع");
            }}
          />

          {/* Main Content with Tabs */}
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                المنتجات
              </TabsTrigger>
              <TabsTrigger value="branches" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                الفروع
              </TabsTrigger>
              <TabsTrigger value="streets" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                الشوارع
              </TabsTrigger>
              <TabsTrigger value="regions" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                المناطق
              </TabsTrigger>
            </TabsList>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6">
              <ProductForm onSubmit={addProduct} />
              
              <Card className="p-6 bg-card shadow-sm">
                <Collapsible
                  open={isFiltersOpen}
                  onOpenChange={setIsFiltersOpen}
                  className="w-full space-y-2"
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-bold">
                          {t("analytics.filters.title")}
                        </h3>
                      </div>
                      <Button variant="ghost" size="sm" className="w-9 p-0">
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            isFiltersOpen ? "rotate-180" : "rotate-0"
                          }`}
                        />
                        <span className="sr-only">Toggle filters</span>
                      </Button>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4">
                    <AdminFilters
                      filters={filters}
                      onFilterChange={setFilters}
                      uniqueSuppliers={uniqueSuppliers}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </Card>
              
              <div className="flex gap-4 mb-4 w-full flex-wrap">
                <ProductSearch value={searchQuery} onChange={setSearchQuery} />
                <Select value={selectedRegionId} onValueChange={setSelectedRegionId}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="المنطقة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={undefined}>الكل</SelectItem>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStreetId} onValueChange={setSelectedStreetId}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="الشارع" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={undefined}>الكل</SelectItem>
                    {streets
                      .filter((street) => !selectedRegionId || street.regionId === selectedRegionId)
                      .map((street) => (
                        <SelectItem key={street.id} value={street.id}>{street.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="الفرع" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={undefined}>الكل</SelectItem>
                    {branches
                      .filter((branch) => !selectedStreetId || branch.streetId === selectedStreetId)
                      .map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Select
                    value={dateFilter}
                    onValueChange={(value) => {
                      setDateFilter(value);
                      if (value !== "custom") {
                        setDateRange(undefined);
                      }
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue
                        placeholder={t("analytics.filters.dateFilter")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="today">اليوم</SelectItem>
                      <SelectItem value="week">الأسبوع</SelectItem>
                      <SelectItem value="month">الشهر</SelectItem>
                      <SelectItem value="year">السنة</SelectItem>
                      <SelectItem value="custom">
                        {t("analytics.filters.customRange")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {dateFilter === "custom" && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "PPP", { locale: ar })} -{" "}
                                {format(dateRange.to, "PPP", { locale: ar })}
                              </>
                            ) : (
                              format(dateRange.from, "PPP", { locale: ar })
                            )
                          ) : (
                            <span>{t("analytics.filters.selectDateRange")}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={dateRange}
                          onSelect={setDateRange}
                          initialFocus
                          locale={ar}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>

              <ProductTable
                products={filteredProducts}
                searchQuery={searchQuery}
                onEdit={handleEdit}
                onDelete={handleDelete}
                branches={branches}
                onUpdateBranchProducts={handleUpdateBranchProducts}
              />
            </TabsContent>

            {/* Branches Tab */}
            <TabsContent value="branches" className="space-y-6">
              <Card className="p-6 shadow-lg border border-primary/30 bg-white rounded-2xl">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-primary">
                  <Building2 className="inline-block w-6 h-6 text-primary" />
                  {t("admin.branches.title")}
                </h2>
                <form onSubmit={handleBranchSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-semibold text-gray-700">
                        {t("admin.branches.form.name")}
                      </label>
                      <Input
                        value={branchForm.name}
                        onChange={(e) =>
                          setBranchForm({ ...branchForm, name: e.target.value })
                        }
                        placeholder={t("admin.branches.form.name")}
                        required
                        className="rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold text-gray-700">
                        {t("admin.branches.form.address")}
                      </label>
                      <Input
                        value={branchForm.address}
                        onChange={(e) =>
                          setBranchForm({ ...branchForm, address: e.target.value })
                        }
                        placeholder={t("admin.branches.form.address")}
                        required
                        className="rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold text-gray-700">
                        {t("admin.branches.form.phone")}
                      </label>
                      <Input
                        value={branchForm.phone}
                        onChange={(e) =>
                          setBranchForm({ ...branchForm, phone: e.target.value })
                        }
                        placeholder={t("admin.branches.form.phone")}
                        required
                        className="rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block mb-1 font-semibold text-gray-700">
                          {t("admin.branches.form.openTime")}
                        </label>
                        <Input
                          type="time"
                          value={branchForm.openTime}
                          onChange={(e) =>
                            setBranchForm({ ...branchForm, openTime: e.target.value })
                          }
                          placeholder={t("admin.branches.form.openTime")}
                          required
                          step="60"
                          className="rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block mb-1 font-semibold text-gray-700">
                          {t("admin.branches.form.closeTime")}
                        </label>
                        <Input
                          type="time"
                          value={branchForm.closeTime}
                          onChange={(e) =>
                            setBranchForm({ ...branchForm, closeTime: e.target.value })
                          }
                          placeholder={t("admin.branches.form.closeTime")}
                          required
                          step="60"
                          className="rounded-lg border-gray-300 focus:border-primary focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block mb-1 font-semibold text-gray-700">
                        الشارع
                      </label>
                      <Select
                        value={branchForm.streetId}
                        onValueChange={(value) =>
                          setBranchForm((f) => ({ ...f, streetId: value }))
                        }
                      >
                        <SelectTrigger className="rounded-lg border-gray-300 focus:border-primary focus:ring-primary">
                          <SelectValue placeholder="اختر الشارع" />
                        </SelectTrigger>
                        <SelectContent>
                          {streets.map((street) => (
                            <SelectItem key={street.id} value={street.id}>
                              {street.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full py-3 text-lg font-bold rounded-xl bg-primary hover:bg-primary/90 transition"
                  >
                    <Building2 className="inline-block w-5 h-5 mr-2" />
                    {t("admin.branches.form.addBranch")}
                  </Button>
                </form>
              </Card>

              <div className="overflow-x-auto rounded-2xl shadow border border-primary/20 bg-white">
                <table className="min-w-full divide-y divide-gray-200 text-center">
                  <thead className="bg-primary/10">
                    <tr>
                      <th className="px-4 py-3 font-bold text-primary">
                        {t("admin.branches.table.name")}
                      </th>
                      <th className="px-4 py-3 font-bold text-primary">
                        {t("admin.branches.table.address")}
                      </th>
                      <th className="px-4 py-3 font-bold text-primary">
                        {t("admin.branches.table.phone")}
                      </th>
                      <th className="px-4 py-3 font-bold text-primary">
                        {t("admin.branches.table.openTime")}
                      </th>
                      <th className="px-4 py-3 font-bold text-primary">
                        {t("admin.branches.table.closeTime")}
                      </th>
                      <th className="px-4 py-3 font-bold text-primary">
                        الشارع
                      </th>
                      <th className="px-4 py-3 font-bold text-primary">
                        المنتجات
                      </th>
                      <th className="px-4 py-3 font-bold text-primary">
                        {t("admin.branches.table.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {branches.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-8 text-muted-foreground text-lg"
                        >
                          {t("admin.branches.noBranches")}
                        </td>
                      </tr>
                    ) : (
                      branches.map((branch, idx) => (
                        <tr key={idx} className="hover:bg-primary/5 transition">
                          <td className="px-4 py-2 font-medium">{branch.name}</td>
                          <td className="px-4 py-2">{branch.address}</td>
                          <td className="px-4 py-2">{branch.phone}</td>
                          <td className="px-4 py-2">{branch.openTime}</td>
                          <td className="px-4 py-2">{branch.closeTime}</td>
                          <td className="px-4 py-2">
                            {streets.find(s => s.id === branch.streetId)?.name || "غير محدد"}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {branch.products?.length || 0} منتج
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2 flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditBranch(idx)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                closeAllModals();
                                setSelectedBranchForProducts(branch);
                                setShowProductsManager(true);
                              }}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteBranch(idx)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Streets Tab */}
            <TabsContent value="streets" className="space-y-6">
              <StreetManager onDataChange={handleDataChange} />
            </TabsContent>

            {/* Regions Tab */}
            <TabsContent value="regions" className="space-y-6">
              <Card className="p-6 shadow-lg border border-primary/30 bg-white rounded-2xl">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-primary">
                  <MapPin className="inline-block w-6 h-6 text-primary" />
                  إدارة المناطق
                </h2>
                
                <form onSubmit={handleRegionSubmit} className="space-y-4 mb-6">
                  <h4 className="text-lg font-semibold mb-4 text-primary">إضافة منطقة جديدة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      value={regionForm.name}
                      onChange={(e) =>
                        setRegionForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="اسم المنطقة"
                      required
                    />
                    <div className="md:col-span-2">
                      <Textarea
                        value={regionForm.notes}
                        onChange={(e) =>
                          setRegionForm((f) => ({ ...f, notes: e.target.value }))
                        }
                        placeholder="ملاحظات عن المنطقة"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full md:w-auto">
                    إضافة منطقة
                  </Button>
                </form>
              </Card>

              <div className="overflow-x-auto rounded-2xl shadow border border-primary/20 bg-white">
                <table className="min-w-full divide-y divide-gray-200 text-center">
                  <thead className="bg-primary/10">
                    <tr>
                      <th className="px-4 py-3 font-bold text-primary">اسم المنطقة</th>
                      <th className="px-4 py-3 font-bold text-primary">الملاحظات</th>
                      <th className="px-4 py-3 font-bold text-primary">عدد الشوارع</th>
                      <th className="px-4 py-3 font-bold text-primary">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {regions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-muted-foreground text-lg">
                          لا توجد مناطق مضافة
                        </td>
                      </tr>
                    ) : (
                      regions.map((region, idx) => (
                        <tr key={idx} className="hover:bg-primary/5 transition">
                          <td className="px-4 py-2 font-medium">{region.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate">
                            {region.notes}
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-gray-600">
                              {region.streets.length} شارع
                            </span>
                            {region.streets.length > 0 && (
                              <div className="text-xs text-gray-400 mt-1">
                                {streets
                                  .filter(street => region.streets.includes(street.id))
                                  .map(street => street.name)
                                  .join(", ")}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2 flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditRegion(idx)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                closeAllModals();
                                setSelectedRegionForStreets(region);
                                setShowStreetsManager(true);
                              }}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteRegion(idx)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <EditProductModal
        product={editingProduct}
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
        onSave={handleSaveEdit}
      />

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => !open && closeAllModals()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.branches.actions.edit")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditBranchSubmit} className="space-y-4">
            <Input
              value={editBranchForm?.name || ""}
              onChange={(e) =>
                setEditBranchForm((f) =>
                  f ? { ...f, name: e.target.value } : f
                )
              }
              placeholder={t("admin.branches.form.name")}
              required
            />
            <Input
              value={editBranchForm?.address || ""}
              onChange={(e) =>
                setEditBranchForm((f) =>
                  f ? { ...f, address: e.target.value } : f
                )
              }
              placeholder={t("admin.branches.form.address")}
              required
            />
            <Input
              value={editBranchForm?.phone || ""}
              onChange={(e) =>
                setEditBranchForm((f) =>
                  f ? { ...f, phone: e.target.value } : f
                )
              }
              placeholder={t("admin.branches.form.phone")}
              required
            />
            <div className="flex gap-4">
              <Input
                type="time"
                value={editBranchForm?.openTime || ""}
                onChange={(e) =>
                  setEditBranchForm((f) =>
                    f ? { ...f, openTime: e.target.value } : f
                  )
                }
                required
              />
              <Input
                type="time"
                value={editBranchForm?.closeTime || ""}
                onChange={(e) =>
                  setEditBranchForm((f) =>
                    f ? { ...f, closeTime: e.target.value } : f
                  )
                }
                required
              />
            </div>
            <Select
              value={editBranchForm?.streetId || ""}
              onValueChange={(value) =>
                setEditBranchForm((f) =>
                  f ? { ...f, streetId: value } : f
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر الشارع" />
              </SelectTrigger>
              <SelectContent>
                {streets.map((street) => (
                  <SelectItem key={street.id} value={street.id}>
                    {street.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeAllModals}
              >
                {t("admin.branches.actions.cancel")}
              </Button>
              <Button type="submit">{t("admin.branches.actions.save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => !open && closeAllModals()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.branches.actions.delete")}</DialogTitle>
          </DialogHeader>
          <p>{t("admin.branches.actions.confirmDelete")}</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeAllModals}
            >
              {t("admin.branches.actions.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteBranch}>
              {t("admin.branches.actions.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Region Dialog */}
      <Dialog open={isEditRegionDialogOpen} onOpenChange={(open) => !open && closeAllModals()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المنطقة</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditRegionSubmit} className="space-y-4">
            <Input
              value={editRegionForm?.name || ""}
              onChange={(e) =>
                setEditRegionForm((f) =>
                  f ? { ...f, name: e.target.value } : f
                )
              }
              placeholder="اسم المنطقة"
              required
            />
            <Textarea
              value={editRegionForm?.notes || ""}
              onChange={(e) =>
                setEditRegionForm((f) =>
                  f ? { ...f, notes: e.target.value } : f
                )
              }
              placeholder="ملاحظات عن المنطقة"
              required
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeAllModals}
              >
                إلغاء
              </Button>
              <Button type="submit">حفظ</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Region Dialog */}
      <Dialog open={isDeleteRegionDialogOpen} onOpenChange={(open) => !open && closeAllModals()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف المنطقة</DialogTitle>
          </DialogHeader>
          <p>هل أنت متأكد من حذف هذه المنطقة؟</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeAllModals}
            >
              إلغاء
            </Button>
            <Button variant="destructive" onClick={confirmDeleteRegion}>
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Branch Products Manager */}
      {showProductsManager && selectedBranchForProducts && (
        <BranchProductsManager
          branches={[selectedBranchForProducts]}
          onUpdateBranch={handleUpdateBranchProducts}
          selectedBranchId={selectedBranchForProducts.id}
          onClose={handleCloseProductsManager}
        />
      )}

      {/* Region Streets Manager */}
      {showStreetsManager && selectedRegionForStreets && (
        <RegionStreetsManager
          regions={[selectedRegionForStreets]}
          streets={streets}
          onUpdateRegion={handleUpdateRegionStreets}
          selectedRegionId={selectedRegionForStreets.id}
          onClose={handleCloseStreetsManager}
        />
      )}
    </div>
  );
};

export default Admin;
