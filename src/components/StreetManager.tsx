import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import StreetBranchesManager from './StreetBranchesManager';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { textToSlug } from "@/utils/urlUtils";

// بيانات شوارع المرج (يمكن لاحقًا جلبها من store.json أو props)
const streets = [
  { id: "street-15e88196-7a65-41ff-8c55-334b1928ffe2", name: "مؤسسه الزكاه" },
];

export const StreetsCarousel = () => {
  const navigate = useNavigate();
  const [api, setApi] = useState<any>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-scroll
  useEffect(() => {
    if (!api || isHovered) return;
    const interval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [api, isHovered]);

  if (streets.length === 0) return null;

  return (
    <div
      className="w-full py-8 bg-gradient-to-b from-background to-secondary/5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="container">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">تسوق حسب الشارع في المرج</h2>
            <p className="text-muted-foreground mt-1">اختر شارعك المفضل لعرض المطاعم والفروع المتاحة.</p>
          </div>
          <Button
            variant="ghost"
            className="group border border-gray-200"
            onClick={() => navigate("/products")}
          >
            عرض الكل
          </Button>
        </div>
        <Carousel className="w-full" setApi={setApi}>
          <CarouselContent className="-ml-2 md:-ml-4">
            {streets.map((street) => (
              <CarouselItem
                key={street.id}
                className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="group relative h-32 rounded-xl overflow-hidden cursor-pointer bg-primary/10 flex items-center justify-center"
                  onClick={() => navigate(`/products?street=${textToSlug(street.name)}`)}
                >
                  <span className="text-xl font-bold text-primary drop-shadow-lg">{street.name}</span>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden sm:block">
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </div>
        </Carousel>
      </div>
    </div>
  );
};

interface Street {
  id: string;
  name: string;
  notes: string;
  regionId?: string | null;
  branches?: string[];
}

interface Region {
  id: string;
  name: string;
  notes: string;
  branches: string[];
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

interface StreetManagerProps {
  onDataChange: () => void;
}

export default function StreetManager({ onDataChange }: StreetManagerProps) {
  const [streets, setStreets] = useState<Street[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStreet, setEditingStreet] = useState<Street | null>(null);
  const [showBranchesManager, setShowBranchesManager] = useState(false);
  const [selectedStreetForBranches, setSelectedStreetForBranches] = useState<Street | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    notes: '',
    regionId: ''
  });
  
  // State for street filters
  const [streetFilterRegionId, setStreetFilterRegionId] = useState<string>("all");
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/store");
      if (!response.ok) throw new Error("فشل في تحميل البيانات");
      const data = await response.json();
      
      console.log('Loaded data:', data); // للتأكد من البيانات
      
      setStreets(data.streets || []);
      setRegions(data.regions || []);
      setBranches(data.branches || []);
      
      console.log('Regions loaded:', data.regions || []); // للتأكد من المناطق
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = async (newStreets: Street[]) => {
    try {
      // الحصول على البيانات الحالية من الخادم
      const currentDataResponse = await fetch("http://localhost:3001/api/store");
      if (!currentDataResponse.ok) throw new Error("فشل في تحميل البيانات الحالية");
      const currentData = await currentDataResponse.json();
      
      // تحديث البيانات مع الحفاظ على باقي البيانات
      const updatedData = {
        ...currentData,
        streets: newStreets,
      };
      
      const response = await fetch("http://localhost:3001/api/store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) throw new Error("فشل في حفظ البيانات");
      
      setStreets(newStreets);
      onDataChange();
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ بيانات الشوارع بنجاح",
      });
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "خطأ في الحفظ",
        description: "حدث خطأ أثناء حفظ البيانات",
        variant: "destructive",
      });
    }
  };

  const handleAdd = async () => {
    if (!formData.name) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال اسم الشارع",
        variant: "destructive",
      });
      return;
    }

    const newStreet: Street = {
      id: `street-${crypto.randomUUID()}`,
      name: formData.name,
      notes: formData.notes,
      regionId: formData.regionId || null,
      branches: []
    };

    const newStreets = [...streets, newStreet];
    await saveData(newStreets);
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = async () => {
    if (!editingStreet || !formData.name) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال اسم الشارع",
        variant: "destructive",
      });
      return;
    }

    const updatedStreet: Street = {
      ...editingStreet,
      name: formData.name,
      notes: formData.notes,
      regionId: formData.regionId || null
    };

    const newStreets = streets.map(street => 
      street.id === editingStreet.id ? updatedStreet : street
    );
    await saveData(newStreets);
    resetForm();
    setIsEditDialogOpen(false);
    setEditingStreet(null);
  };

  const handleDelete = async (streetId: string) => {
    const newStreets = streets.filter(street => street.id !== streetId);
    await saveData(newStreets);
  };

  const openEditDialog = (street: Street) => {
    setEditingStreet(street);
    setFormData({
      name: street.name,
      notes: street.notes,
      regionId: street.regionId || ""
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      notes: '',
      regionId: ''
    });
  };

  const getRegionName = (regionId: string | null | undefined) => {
    if (!regionId) return "غير محدد";
    const region = regions.find(r => r.id === regionId);
    return region ? region.name : "غير محدد";
  };

  const getBranchCount = (streetId: string) => {
    return branches.filter(branch => branch.streetId === streetId).length;
  };

  // Filter streets by region
  const filteredStreets = streets.filter((street) => {
    if (streetFilterRegionId && streetFilterRegionId !== "all" && street.regionId !== streetFilterRegionId) {
      return false;
    }
    return true;
  });

  const handleUpdateStreetBranches = async (streetId: string, branchIds: string[]) => {
    try {
      // الحصول على البيانات الحالية من الخادم
      const currentDataResponse = await fetch("http://localhost:3001/api/store");
      if (!currentDataResponse.ok) throw new Error("فشل في تحميل البيانات الحالية");
      const currentData = await currentDataResponse.json();
      
      // تحديث الفروع لتشير للشارع الجديد
      const updatedBranches = currentData.branches.map((branch: Branch) => {
        if (branchIds.includes(branch.id)) {
          // الفرع محدد للشارع الحالي
          return { ...branch, streetId: streetId };
        } else {
          // الفرع غير محدد للشارع الحالي، احتفظ بـ streetId الحالي إذا كان موجوداً
          return branch;
        }
      });

      // تحديث جميع الشوارع لتحديث قوائم الفروع
      const updatedStreets = currentData.streets.map((street: Street) => {
        if (street.id === streetId) {
          // للشارع الحالي، استخدم القائمة الجديدة
          return { ...street, branches: branchIds };
        } else {
          // للشوارع الأخرى، أزل الفروع التي تم نقلها للشارع الحالي
          const filteredBranches = (street.branches || []).filter(branchId => {
            // إذا كان الفرع محدد للشارع الحالي، أزله من الشوارع الأخرى
            return !branchIds.includes(branchId);
          });
          return { ...street, branches: filteredBranches };
        }
      });

      // حفظ التحديثات
      const response = await fetch("http://localhost:3001/api/store", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...currentData,
          streets: updatedStreets,
          branches: updatedBranches,
        }),
      });
      
      if (!response.ok) throw new Error("فشل في حفظ البيانات");
      
      setStreets(updatedStreets);
      setBranches(updatedBranches);
      onDataChange();
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث فروع الشارع بنجاح",
      });
    } catch (error) {
      console.error('Error updating street branches:', error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث فروع الشارع",
        variant: "destructive",
      });
    }
  };

  const handleCloseBranchesManager = () => {
    setShowBranchesManager(false);
    setSelectedStreetForBranches(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>إدارة الشوارع</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة شارع جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة شارع جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">اسم الشارع</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="أدخل اسم الشارع"
                  />
                </div>
                <div>
                  <Label htmlFor="region">المنطقة</Label>
                  <Select value={formData.regionId} onValueChange={(value) => setFormData({ ...formData, regionId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المنطقة" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.length === 0 ? (
                        <SelectItem value="" disabled>
                          لا توجد مناطق متاحة
                        </SelectItem>
                      ) : (
                        regions.map((region) => (
                          <SelectItem key={region.id} value={region.id}>
                            {region.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {regions.length === 0 && (
                    <p className="text-sm text-red-500 mt-1">
                      يجب إضافة منطقة أولاً قبل إضافة شارع
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="أدخل ملاحظات الشارع"
                  />
                </div>
                <div className="flex justify-end space-x-2 space-x-reverse">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={handleAdd}>
                    إضافة
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Street Filters */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">تصفية الشوارع:</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={streetFilterRegionId}
                onValueChange={(value) => setStreetFilterRegionId(value)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="جميع المناطق" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المناطق</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(streetFilterRegionId !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStreetFilterRegionId("all")}
                  className="text-xs"
                >
                  مسح الفلاتر
                </Button>
              )}
            </div>
            {streetFilterRegionId !== "all" && (
              <div className="text-sm text-gray-600">
                عرض {filteredStreets.length} من {streets.length} شارع
              </div>
            )}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>اسم الشارع</TableHead>
              <TableHead>المنطقة</TableHead>
              <TableHead>عدد الفروع</TableHead>
              <TableHead>ملاحظات</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStreets.map((street) => (
              <TableRow key={street.id}>
                <TableCell>
                  <div className="font-medium">{street.name}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{getRegionName(street.regionId)}</Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-gray-600">
                    {getBranchCount(street.id)} فرع
                  </span>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground max-w-xs truncate">
                    {street.notes}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2 space-x-reverse">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedStreetForBranches(street);
                        setShowBranchesManager(true);
                      }}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(street)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>تعديل الشارع</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="edit-name">اسم الشارع</Label>
                            <Input
                              id="edit-name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              placeholder="أدخل اسم الشارع"
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-region">المنطقة</Label>
                            <Select value={formData.regionId} onValueChange={(value) => setFormData({ ...formData, regionId: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر المنطقة" />
                              </SelectTrigger>
                              <SelectContent>
                                {regions.map((region) => (
                                  <SelectItem key={region.id} value={region.id}>
                                    {region.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="edit-notes">ملاحظات</Label>
                            <Textarea
                              id="edit-notes"
                              value={formData.notes}
                              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                              placeholder="أدخل ملاحظات الشارع"
                            />
                          </div>
                          <div className="flex justify-end space-x-2 space-x-reverse">
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                              إلغاء
                            </Button>
                            <Button onClick={handleEdit}>
                              حفظ التعديلات
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف الشارع "{street.name}"؟ لا يمكن التراجع عن هذا الإجراء.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(street.id)}>
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredStreets.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {streetFilterRegionId !== "all"
              ? "لا توجد شوارع في المنطقة المختارة" 
              : "لا توجد شوارع مضافة حالياً"
            }
          </div>
        )}
      </CardContent>

      {/* Street Branches Manager */}
      {showBranchesManager && selectedStreetForBranches && (
        <StreetBranchesManager
          streets={streets}
          branches={branches}
          onUpdateStreet={handleUpdateStreetBranches}
          selectedStreetId={selectedStreetForBranches.id}
          onClose={handleCloseBranchesManager}
        />
      )}
    </Card>
  );
} 