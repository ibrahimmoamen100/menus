import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  Check,
  X,
  Building2,
  Package,
  Save,
  RefreshCw,
  Filter,
} from "lucide-react";

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
  products?: Array<{ id: string; name: string }>;
}

interface BranchProductsManagerProps {
  branches: Branch[];
  onUpdateBranch: (branchId: string, products: Array<{ id: string; name: string }>) => void;
  selectedBranchId?: string;
  onClose?: () => void;
}

export const BranchProductsManager: React.FC<BranchProductsManagerProps> = ({
  branches,
  onUpdateBranch,
  selectedBranchId,
  onClose,
}) => {
  const { products } = useStore();
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products?.forEach((product) => {
      if (product.category) {
        cats.add(product.category);
      }
    });
    return Array.from(cats).sort();
  }, [products]);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products?.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    }) || [];
  }, [products, searchQuery, categoryFilter]);

  // Initialize selected products when branch changes
  useEffect(() => {
    if (selectedBranch) {
      const branchProductIds = new Set(
        selectedBranch.products?.map((p) => p.id) || []
      );
      setSelectedProducts(branchProductIds);
    }
  }, [selectedBranch]);

  // If selectedBranchId is provided, use that branch directly
  useEffect(() => {
    if (selectedBranchId !== undefined) {
      const branch = branches.find(b => b.id === selectedBranchId);
      if (branch) {
        setSelectedBranch(branch);
        // Open dialog after a short delay to ensure proper initialization
        setTimeout(() => {
          setIsDialogOpen(true);
        }, 100);
      }
    }
  }, [selectedBranchId, branches]);

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      const allIds = new Set(filteredProducts.map((p) => p.id));
      setSelectedProducts(allIds);
    }
  };

  const handleProductToggle = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSave = async () => {
    if (!selectedBranch) return;

    setIsLoading(true);
    try {
      const selectedProductObjects = filteredProducts
        .filter((product) => selectedProducts.has(product.id))
        .map((product) => ({
          id: product.id,
          name: product.name,
        }));

      // Use selectedBranchId if provided, otherwise use selectedBranch id
      const branchId = selectedBranchId !== undefined 
        ? selectedBranchId 
        : selectedBranch?.id;
        
      if (!branchId) {
        throw new Error("Branch not found");
      }

      await onUpdateBranch(branchId, selectedProductObjects);
      
      toast.success("تم حفظ منتجات الفرع بنجاح");
      setIsDialogOpen(false);
      
      // Reset state when using selectedBranchId
      if (selectedBranchId !== undefined) {
        setSelectedBranch(null);
        setSelectedProducts(new Set());
        setSearchQuery("");
        setCategoryFilter("all");
        
        // Call onClose callback if provided
        if (onClose) {
          onClose();
        }
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ منتجات الفرع");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setSelectedProducts(new Set());
    setSearchQuery("");
    setCategoryFilter("all");
    setSelectedBranch(null);
    
    // Call onClose callback if provided
    if (onClose) {
      onClose();
    }
  };

  const openBranchDialog = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsDialogOpen(true);
  };

  const getSelectedProductsCount = (branch: Branch) => {
    return branch.products?.length || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header - Only show if no specific branch is selected */}
      {selectedBranchId === undefined && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                إدارة منتجات الفروع
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                اختر المنتجات المتاحة لكل فرع من الفروع
              </p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              تحديث
            </Button>
          </div>

          {/* Branches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => openBranchDialog(branch)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                      {branch.name}
                    </CardTitle>
                    <Badge variant="secondary">
                      {getSelectedProductsCount(branch)} منتج
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <span className="font-medium">العنوان:</span>
                      <span className="mr-2">{branch.address}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">الهاتف:</span>
                      <span className="mr-2">{branch.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">ساعات العمل:</span>
                      <span className="mr-2">
                        {branch.openTime} - {branch.closeTime}
                      </span>
                    </div>
                  </div>
                  
                  {/* Selected Products Preview */}
                  {branch.products && branch.products.length > 0 && (
                    <div className="mt-4 pt-3 border-t">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        المنتجات المختارة:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {branch.products.slice(0, 3).map((product) => (
                          <Badge key={product.id} variant="outline" className="text-xs">
                            {product.name}
                          </Badge>
                        ))}
                        {branch.products.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{branch.products.length - 3} أكثر
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Products Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          handleCancel();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2 text-blue-600" />
              إدارة منتجات: {selectedBranch?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="البحث في المنتجات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Products Table */}
            <div className="border rounded-lg">
              <div className="p-4 border-b bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={
                        filteredProducts.length > 0 &&
                        selectedProducts.size === filteredProducts.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="font-medium">
                      تحديد الكل ({filteredProducts.length} منتج)
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {selectedProducts.size} منتج محدد
                  </Badge>
                </div>
              </div>

              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>المنتج</TableHead>
                      <TableHead>الفئة</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.has(product.id)}
                            onCheckedChange={() => handleProductToggle(product.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {product.images && product.images.length > 0 && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500">
                                {product.description?.replace(/<[^>]*>/g, "").slice(0, 50)}...
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.price} ج.م
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={product.isArchived ? "destructive" : "default"}
                          >
                            {product.isArchived ? "مؤرشف" : "نشط"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  حفظ التغييرات
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 