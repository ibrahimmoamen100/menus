import React from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import storeData from "@/data/store.json";
import { Store } from "lucide-react";
import { textToSlug } from "@/utils/urlUtils";

interface BranchesCarouselProps {
  streetId: string;
}

const BranchesCarousel: React.FC<BranchesCarouselProps> = ({ streetId }) => {
  const navigate = useNavigate();
  const branches = (storeData.branches || []).filter(b => b.streetId === streetId);
  const street = (storeData.streets || []).find(s => s.id === streetId);

  if (!streetId || branches.length === 0) return null;

  return (
    <div className="w-full py-8 bg-gradient-to-b from-background to-secondary/5">
      <div className="container">
        <div className="flex flex-col items-start gap-2 mb-3">
          <div>

          <span className="text-primary font-bold text-2xl"> شارع  {street?.name} </span>
          <span className="text-md text-gray-500">({branches.length} محل)</span>
          </div>
          <div className="text-base text-gray-500 ">
           تسوق حسب المحلات المتاحة في هذا الشارع
          </div>
        </div>
        <Carousel className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {branches.map((branch) => (
              <CarouselItem
                key={branch.id}
                className="pl-2 h-48 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 m-4"
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="group relative h-32 p-8 rounded-xl cursor-pointer bg-gradient-to-br from-primary/10 to-secondary/20 shadow-md flex flex-col items-center justify-center transition-transform duration-200 hover:shadow-md border border-primary/10"
                  onClick={() => navigate(`/products?branch=${textToSlug(branch.name)}`)}
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
    </div>
  );
};

export default BranchesCarousel; 