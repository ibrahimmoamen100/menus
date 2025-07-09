import { Product } from "@/types/product";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  Timer,
  ArrowDownToLine,
  Building2,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { DEFAULT_SUPPLIER } from "@/constants/supplier";
import { formatPrice } from "@/utils/format";

// Branch interface
interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
  products?: Array<{ id: string; name: string }>;
}

interface ProductTableProps {
  products?: Product[];
  searchQuery: string;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  branches?: Branch[];
  onUpdateBranchProducts?: (branchId: string, products: Array<{ id: string; name: string }>) => void;
}

export function ProductTable({
  products = [],
  searchQuery,
  onEdit,
  onDelete,
  branches = [],
  onUpdateBranchProducts,
}: ProductTableProps) {
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const filteredProducts = (products || []).filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Product ID copied to clipboard");
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      onDelete(productToDelete.id);
      setProductToDelete(null);
      toast.success("Product deleted successfully");
    }
  };

  // Handle branch selection for product
  const handleBranchSelection = (product: Product) => {
    setSelectedProduct(product);
    setIsBranchDialogOpen(true);
    
    // Initialize selected branches based on current product assignment
    const currentBranches = new Set<string>();
    branches.forEach((branch) => {
      if (branch.products?.some(p => p.id === product.id)) {
        currentBranches.add(branch.id);
      }
    });
    setSelectedBranches(currentBranches);
  };

  const handleBranchToggle = (branchId: string) => {
    const newSelected = new Set(selectedBranches);
    if (newSelected.has(branchId)) {
      newSelected.delete(branchId);
    } else {
      newSelected.add(branchId);
    }
    setSelectedBranches(newSelected);
  };

  const handleSaveBranchAssignment = async () => {
    if (!selectedProduct || !onUpdateBranchProducts) return;

    setIsLoading(true);
    try {
      // Update each selected branch with the product
      for (const branchId of selectedBranches) {
        const branch = branches.find(b => b.id === branchId);
        if (!branch) continue;

        const currentProducts = branch.products || [];
        const productExists = currentProducts.some(p => p.id === selectedProduct.id);
        
        if (!productExists) {
          const updatedProducts = [
            ...currentProducts,
            { id: selectedProduct.id, name: selectedProduct.name }
          ];
          await onUpdateBranchProducts(branchId, updatedProducts);
        }
      }

      // Remove product from unselected branches
      branches.forEach((branch) => {
        if (!selectedBranches.has(branch.id) && branch.products) {
          const updatedProducts = branch.products.filter(p => p.id !== selectedProduct.id);
          if (updatedProducts.length !== branch.products.length) {
            onUpdateBranchProducts(branch.id, updatedProducts);
          }
        }
      });

      toast.success("تم تحديث ربط المنتج بالفروع بنجاح");
      setIsBranchDialogOpen(false);
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث ربط المنتج بالفروع");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBranchAssignment = () => {
    setIsBranchDialogOpen(false);
    setSelectedProduct(null);
    setSelectedBranches(new Set());
  };

  // Get branches that contain this product
  const getProductBranches = (productId: string) => {
    return branches
      .filter(branch => branch.products?.some(p => p.id === productId))
      .map(branch => branch.name);
  };

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px] text-center">ID</TableHead>
              <TableHead className="w-[300px]">المنتج</TableHead>
              <TableHead className="w-[120px] text-center">السعر</TableHead>
              <TableHead className="w-[120px] text-center">التصنيف</TableHead>
              {/* <TableHead className="w-[120px] text-center">الألوان</TableHead> */}
              <TableHead className="w-[120px] text-center">المورد</TableHead>
              <TableHead className="w-[150px] text-center">
                العرض الخاص
              </TableHead>
              <TableHead className="w-[150px] text-center">
                تاريخ الإضافة
              </TableHead>
              <TableHead className="w-[120px] text-center">الفروع</TableHead>
              <TableHead className="w-[80px] text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                      {product.id.slice(0, 8)}...
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopyId(product.id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {product.description?.slice(0, 50)}...
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {product.specialOffer && product.discountPercentage ? (
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant="destructive" className="w-fit">
                        {formatPrice(
                          product.price -
                            (product.price * product.discountPercentage) / 100
                        )}{" "}
                        جنيه
                      </Badge>
                      <span className="text-muted-foreground line-through text-xs">
                        {formatPrice(product.price)} جنيه
                      </span>
                    </div>
                  ) : (
                    <span>{formatPrice(product.price)} جنيه</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Badge variant="outline" className="font-normal">
                      {product.category}
                    </Badge>
                    {product.subcategory && (
                      <div className="flex items-center gap-1">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 128 128"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-muted-foreground"
                          style={{ transform: "rotate(0deg)" }}
                        >
                          <path
                            d="M78.1 0v6.2c22.4 0 40.5 18.2 40.5 40.6s-18.1 40.6-40.5 40.6H17.9l27.9-28-4.5-4.5L5.5 90.8l36 36.2 4.5-4.5-28.8-28.9h60.9c25.8 0 46.7-21 46.7-46.8S103.9 0 78.1 0z"
                            stroke="currentColor"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <Badge
                          variant="secondary"
                          className="font-normal text-xs"
                        >
                          {product.subcategory}
                        </Badge>
                      </div>
                    )}
                  </div>
                </TableCell>
                {/* <TableCell className="text-center">
                  <div className="flex justify-center gap-1">
                    {product.color.split(",").map((color, index) => (
                      <div
                        key={index}
                        className="h-6 w-6 rounded-full border"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </TableCell> */}
                <TableCell className="text-center">
                  <Badge variant="outline" className="font-normal">
                    {product.wholesaleInfo?.supplierName ||
                      DEFAULT_SUPPLIER.name}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {product.specialOffer ? (
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant="secondary" className="w-fit">
                        {product.discountPercentage}% خصم
                      </Badge>
                      {product.offerEndsAt && (
                        <div className="flex items-center justify-center text-xs gap-1 text-muted-foreground">
                          <Timer className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(
                              new Date(product.offerEndsAt),
                              { addSuffix: true }
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-sm">
                      {format(
                        new Date(product.createdAt || new Date()),
                        "dd/MM/yyyy hh:mm a",
                        { locale: ar }
                      )
                        .replace("AM", "ص")
                        .replace("PM", "م")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(
                        new Date(product.createdAt || new Date()),
                        { addSuffix: true, locale: ar }
                      )}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex flex-wrap justify-center gap-1 max-w-[100px]">
                      {getProductBranches(product.id).length > 0 ? (
                        getProductBranches(product.id).slice(0, 2).map((branchName, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {branchName}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">لا توجد فروع</span>
                      )}
                      {getProductBranches(product.id).length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{getProductBranches(product.id).length - 2}
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBranchSelection(product)}
                      className="h-6 px-2 text-xs"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      إدارة
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">فتح القائمة</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onEdit(product)}
                        className="flex items-center gap-2"
                      >
                        <Pencil className="h-4 w-4" />
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(product)}
                        className="flex items-center gap-2 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleCopyId(product.id)}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        نسخ المعرف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!productToDelete}
        onOpenChange={() => setProductToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              لا يمكن التراجع عن هذا الإجراء. سيتم حذف المنتج نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Branch Selection Dialog */}
      <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              ربط المنتج بالفروع
            </DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">المنتج المحدد:</h4>
                <div className="flex items-center gap-3">
                  <img
                    src={selectedProduct.images[0]}
                    alt={selectedProduct.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div>
                    <p className="font-medium">{selectedProduct.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(selectedProduct.price)} جنيه
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">اختر الفروع:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {branches.map((branch) => (
                    <div
                      key={branch.id}
                      className="flex items-center space-x-3 p-2 rounded-lg border hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedBranches.has(branch.id)}
                        onCheckedChange={() => handleBranchToggle(branch.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{branch.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {branch.address}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelBranchAssignment}
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveBranchAssignment}
              disabled={isLoading}
            >
              {isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
