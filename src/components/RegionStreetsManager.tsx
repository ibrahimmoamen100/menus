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

// Street interface
interface Street {
  id: string;
  name: string;
  regionId?: string | null;
  notes?: string;
  branches?: string[];
}

// Region interface
interface Region {
  id: string;
  name: string;
  notes: string;
  streets: string[];
}

interface RegionStreetsManagerProps {
  regions: Region[];
  streets: Street[];
  onUpdateRegion: (regionId: string, streets: string[]) => void;
  selectedRegionId?: string;
  onClose?: () => void;
}

export const RegionStreetsManager: React.FC<RegionStreetsManagerProps> = ({
  regions,
  streets,
  onUpdateRegion,
  selectedRegionId,
  onClose,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedStreets, setSelectedStreets] = useState<Set<string>>(new Set());
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

  // Initialize selected streets when region changes
  useEffect(() => {
    if (selectedRegion) {
      const currentStreets = new Set<string>();
      if (selectedRegion.streets && Array.isArray(selectedRegion.streets)) {
        selectedRegion.streets.forEach(streetId => {
          currentStreets.add(streetId);
        });
      }
      setSelectedStreets(currentStreets);
    }
  }, [selectedRegion]);

  const handleStreetToggle = (streetId: string) => {
    const newSelected = new Set(selectedStreets);
    if (newSelected.has(streetId)) {
      newSelected.delete(streetId);
    } else {
      newSelected.add(streetId);
    }
    setSelectedStreets(newSelected);
  };

  const handleSelectAll = () => {
    const allStreetIds = streets.map(street => street.id);
    setSelectedStreets(new Set(allStreetIds));
  };

  const handleDeselectAll = () => {
    setSelectedStreets(new Set());
  };

  const handleSave = async () => {
    if (!selectedRegion) return;

    try {
      const selectedStreetIds = Array.from(selectedStreets);
      await onUpdateRegion(selectedRegion.id, selectedStreetIds);
      
      toast.success("تم تحديث شوارع المنطقة بنجاح");
      setIsDialogOpen(false);
      
      // Reset state when using selectedRegionId
      if (selectedRegionId !== undefined) {
        setSelectedRegion(null);
        setSelectedStreets(new Set());
        setSearchQuery("");
        
        // Call onClose callback if provided
        if (onClose) {
          onClose();
        }
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث شوارع المنطقة");
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setSelectedRegion(null);
    setSelectedStreets(new Set());
    setSearchQuery("");
    
    if (onClose) {
      onClose();
    }
  };

  // Filter streets based on search query and availability
  const filteredStreets = streets.filter(street => {
    const matchesSearch = street.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Only show streets that are either:
    // 1. Not assigned to any region (regionId is null or undefined), OR
    // 2. Already assigned to the current region
    const isAvailable = !street.regionId || street.regionId === selectedRegion?.id;
    
    return matchesSearch && isAvailable;
  });

  const selectedCount = selectedStreets.size;
  const totalCount = filteredStreets.length;

  return (
    <>
      {/* Manual trigger button - only show if no specific region is selected */}
      {selectedRegionId === undefined && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsDialogOpen(true)}
        >
          إدارة الشوارع
        </Button>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              إدارة شوارع المنطقة
            </DialogTitle>
            <DialogDescription>
              اختر الشوارع التي تريد ربطها بهذه المنطقة
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
                إدارة شوارع: {selectedRegion.name}
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
                    placeholder="البحث في الشوارع..."
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
                  تم تحديد {selectedCount} من {totalCount} شارع
                </p>
              </div>

              {/* Streets List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredStreets.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    لا توجد شوارع متاحة
                  </p>
                ) : (
                  filteredStreets.map((street) => (
                    <div
                      key={street.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedStreets.has(street.id)}
                        onCheckedChange={() => handleStreetToggle(street.id)}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{street.name}</h4>
                        {street.regionId && street.regionId !== selectedRegion?.id && (
                          <p className="text-xs text-orange-600">
                            مرتبط بمنطقة أخرى
                          </p>
                        )}
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