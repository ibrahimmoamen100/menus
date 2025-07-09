import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

// Branch interface
interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
  regionId?: string;
  products?: Array<{ id: string; name: string }>;
}

// Region interface
interface Region {
  id: string;
  name: string;
  notes: string;
  branches?: string[];
}

interface RegionBranchesManagerProps {
  regions: Region[];
  branches: Branch[];
  onUpdateRegion: (regionId: string, branches: string[]) => void;
  selectedRegionId?: string;
  onClose?: () => void;
}

export const RegionBranchesManager: React.FC<RegionBranchesManagerProps> = ({
  regions,
  branches,
  onUpdateRegion,
  selectedRegionId,
  onClose,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // If selectedRegionId is provided, use that region directly
  useEffect(() => {
    if (selectedRegionId !== undefined) {
      const region = regions.find(r => r.id === selectedRegionId);
      if (region) {
        setSelectedRegion(region);
        setIsDialogOpen(true);
      }
    }
  }, [selectedRegionId, regions]);

  // Initialize selected branches when region changes
  useEffect(() => {
    if (selectedRegion) {
      const currentBranches = new Set<string>();
      if (selectedRegion.branches && Array.isArray(selectedRegion.branches)) {
        selectedRegion.branches.forEach(branchId => {
          currentBranches.add(branchId);
        });
      }
      setSelectedBranches(currentBranches);
    }
  }, [selectedRegion]);

  const handleBranchToggle = (branchId: string) => {
    const newSelected = new Set(selectedBranches);
    if (newSelected.has(branchId)) {
      newSelected.delete(branchId);
    } else {
      newSelected.add(branchId);
    }
    setSelectedBranches(newSelected);
  };

  const handleSelectAll = () => {
    const allBranchIds = branches.map(branch => branch.id);
    setSelectedBranches(new Set(allBranchIds));
  };

  const handleDeselectAll = () => {
    setSelectedBranches(new Set());
  };

  const handleSave = async () => {
    if (!selectedRegion) return;

    try {
      const selectedBranchIds = Array.from(selectedBranches);
      await onUpdateRegion(selectedRegion.id, selectedBranchIds);
      
      toast.success("تم تحديث فروع المنطقة بنجاح");
      setIsDialogOpen(false);
      
      // Reset state when using selectedRegionId
      if (selectedRegionId !== undefined) {
        setSelectedRegion(null);
        setSelectedBranches(new Set());
        setSearchQuery("");
        
        // Call onClose callback if provided
        if (onClose) {
          onClose();
        }
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث فروع المنطقة");
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setSelectedRegion(null);
    setSelectedBranches(new Set());
    setSearchQuery("");
    
    if (onClose) {
      onClose();
    }
  };

  // Filter branches based on search query
  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCount = selectedBranches.size;
  const totalCount = branches.length;

  return (
    <>
      {/* Manual trigger button - only show if no specific region is selected */}
      {selectedRegionId === undefined && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsDialogOpen(true)}
        >
          إدارة الفروع
        </Button>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              إدارة فروع المنطقة
            </DialogTitle>
            <DialogDescription>
              اختر الفروع التي تريد ربطها بهذه المنطقة
            </DialogDescription>
          </DialogHeader>
          
          {selectedRegionId === undefined && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">اختر المنطقة</h3>
              <select
                className="w-full p-2 border rounded-lg"
                onChange={(e) => {
                  const region = regions.find(r => r.id === e.target.value);
                  setSelectedRegion(region || null);
                }}
                value={selectedRegion?.id || ""}
              >
                <option value="">اختر المنطقة</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {selectedRegion && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-primary">
                إدارة فروع: {selectedRegion.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedRegion.notes}
              </p>
            </div>
          )}

          {selectedRegion && (
            <div className="space-y-4">
              {/* Search and Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="البحث في الفروع..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    تحديد الكل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                  >
                    إلغاء التحديد
                  </Button>
                </div>
              </div>

              {/* Selection Summary */}
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">
                  تم تحديد {selectedCount} من {totalCount} فرع
                </p>
              </div>

              {/* Branches List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredBranches.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد فروع
                  </p>
                ) : (
                  filteredBranches.map((branch) => (
                    <div
                      key={branch.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedBranches.has(branch.id)}
                        onCheckedChange={() => handleBranchToggle(branch.id)}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{branch.name}</h4>
                        <p className="text-sm text-gray-600">{branch.address}</p>
                        <p className="text-xs text-gray-500">
                          {branch.openTime} - {branch.closeTime} | {branch.phone}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              إلغاء
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!selectedRegion}
            >
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}; 