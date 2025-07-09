import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, X } from 'lucide-react';

interface Street {
  id: string;
  name: string;
  notes: string;
  regionId?: string | null;
  branches?: string[];
}

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

interface StreetBranchesManagerProps {
  streets: Street[];
  branches: Branch[];
  onUpdateStreet: (streetId: string, branchIds: string[]) => void;
  selectedStreetId: string;
  onClose: () => void;
}

export default function StreetBranchesManager({
  streets,
  branches,
  onUpdateStreet,
  selectedStreetId,
  onClose
}: StreetBranchesManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  const selectedStreet = streets.find(s => s.id === selectedStreetId);

  useEffect(() => {
    if (selectedStreet) {
      setSelectedBranches(selectedStreet.branches || []);
    }
  }, [selectedStreet]);

  // عرض الفروع غير المرتبطة بأي شارع + الفروع المرتبطة بالشارع الحالي
  const availableBranches = branches.filter(branch => {
    // الفروع التي لا تملك streetId أو streetId فارغ أو مرتبطة بالشارع الحالي
    return !branch.streetId || 
           branch.streetId === "" || 
           branch.streetId === undefined || 
           branch.streetId === selectedStreetId;
  });
  
  const filteredBranches = availableBranches.filter(branch =>
    branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBranchToggle = (branchId: string) => {
    setSelectedBranches(prev => {
      if (prev.includes(branchId)) {
        return prev.filter(id => id !== branchId);
      } else {
        return [...prev, branchId];
      }
    });
  };

  const handleSave = () => {
    onUpdateStreet(selectedStreetId, selectedBranches);
    onClose();
  };

  const handleSelectAll = () => {
    setSelectedBranches(filteredBranches.map(b => b.id));
  };

  const handleDeselectAll = () => {
    setSelectedBranches([]);
  };

  if (!selectedStreet) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>إدارة فروع الشارع: {selectedStreet.name}</span>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search and Controls */}
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في الفروع..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              تحديد الكل
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              إلغاء التحديد
            </Button>
          </div>

          {/* Branches Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">تحديد</TableHead>
                  <TableHead>اسم الفرع</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>ساعات العمل</TableHead>
                  <TableHead>المنتجات</TableHead>
                  <TableHead>الشارع الحالي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBranches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد فروع
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBranches.map((branch) => {
                    const currentStreet = streets.find(s => s.id === branch.streetId);
                    const isSelected = selectedBranches.includes(branch.id);
                    
                    return (
                      <TableRow key={branch.id} className={isSelected ? 'bg-primary/5' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleBranchToggle(branch.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{branch.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground max-w-xs truncate">
                            {branch.address}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{branch.phone}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {branch.openTime} - {branch.closeTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {branch.products?.length || 0} منتج
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {currentStreet ? (
                            <Badge variant={currentStreet.id === selectedStreetId ? "default" : "outline"}>
                              {currentStreet.id === selectedStreetId ? "هذا الشارع" : currentStreet.name}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              متاح {branch.streetId ? `(${branch.streetId})` : "(لا يوجد)"}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">
              تم تحديد {selectedBranches.length} فرع من أصل {availableBranches.length} فرع متاح
              <br />
              <span className="text-xs">(يتم عرض الفروع المتاحة والفروع المرتبطة بهذا الشارع فقط)</span>
              <br />
              <span className="text-xs text-blue-500">
                إجمالي الفروع: {branches.length} | الفروع المتاحة: {availableBranches.length}
              </span>
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <Button variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button onClick={handleSave}>
                حفظ التغييرات
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 