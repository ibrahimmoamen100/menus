import React, { useState, useEffect } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import storeData from "@/data/store.json";
import { Store } from "lucide-react";

interface BranchesByStreetCarouselProps {
  regionId: string;
}

const BranchesByStreetCarousel: React.FC<BranchesByStreetCarouselProps> = ({ regionId }) => {
  const navigate = useNavigate();
  const [api, setApi] = useState<any>(null);
  const [isHovered, setIsHovered] = useState(false);

  // جلب بيانات المنطقة والشوارع والفروع
  const region = (storeData.regions || []).find(r => r.id === regionId);
  const streets = (storeData.streets || []).filter(street => street.regionId === regionId);
  const branches = storeData.branches || [];

  // Auto-scroll
  useEffect(() => {
    if (!api || isHovered) return;
    const interval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [api, isHovered]);

  if (!regionId || streets.length === 0) return null;

  return (
    <div className="w-full py-8 bg-gradient-to-b from-background to-secondary/5">
      <div className="container">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">
              تسوق الفروع حسب الشوارع في {region?.name || "المنطقة"}
            </h2>
            <p className="text-muted-foreground mt-1">اختر فرعك المفضل من الشارع المناسب.</p>
          </div>
          <Button
            variant="ghost"
            className="group border border-gray-200"
            onClick={() => navigate("/products")}
          >
            عرض الكل
          </Button>
        </div>
        {/* لكل شارع كاروسيل للفروع */}
        {streets.map((street) => {
          const streetBranches = branches.filter(b => b.streetId === street.id);
          if (streetBranches.length === 0) return null;
          return (
            <div key={street.id} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-primary font-bold text-lg">شارع {street.name}</span>
                <span className="text-xs text-gray-500">({streetBranches.length} محل)</span>
              </div>
              <Carousel className="w-full" setApi={setApi}>
                <CarouselContent className="-ml-2 md:-ml-4">
                  {streetBranches.map((branch) => (
                    <CarouselItem
                      key={branch.id}
                      className="pl-2 h-48 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 m-4"
                    >
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        className="group relative h-32 p-8 rounded-xl cursor-pointer bg-gradient-to-br from-primary/10 to-secondary/20 shadow-md flex flex-col items-center justify-center transition-transform duration-200 hover:shadow-md border border-primary/10"
                        onClick={() => navigate(`/products?branchId=${branch.id}`)}
                      >
                        <span className="text-lg font-bold text-primary mb-1 text-center whitespace-nowrap">{branch.name}</span>
                        <span className="text-xs text-gray-600 mb-1">{branch.address}</span>
                        <span className="flex items-center gap-1 text-xs font-medium text-gray-700 bg-white/70 rounded-full px-2 py-0.5 mt-2 shadow-sm border border-gray-200">
                          <Store className="w-4 h-4 text-primary" />
                          فرع
                        </span>
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
          );
        })}
      </div>
    </div>
  );
};

export default BranchesByStreetCarousel; 