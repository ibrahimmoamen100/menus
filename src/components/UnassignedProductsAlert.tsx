import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, Settings } from 'lucide-react';
import { getUnassignedProductsCount } from '@/utils/productUtils';
import { Product } from '@/types/product';

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
  products?: Array<{ id: string; name: string }>;
  streetId?: string;
}

interface UnassignedProductsAlertProps {
  products: Product[];
  branches: Branch[];
  onManageProducts?: () => void;
}

export const UnassignedProductsAlert: React.FC<UnassignedProductsAlertProps> = ({
  products,
  branches,
  onManageProducts,
}) => {
  const unassignedCount = getUnassignedProductsCount(products, branches);
  
  if (unassignedCount === 0) {
    return null;
  }

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">
        تنبيه: منتجات غير مربوطة
      </AlertTitle>
      <AlertDescription className="text-orange-700">
        يوجد {unassignedCount} منتج غير مرتبط بأي فرع. 
        هذه المنتجات مؤرشفة تلقائياً ولن تظهر للمستخدمين العاديين.
        {onManageProducts && (
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onManageProducts}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <Settings className="h-4 w-4 mr-2" />
              إدارة ربط المنتجات
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}; 