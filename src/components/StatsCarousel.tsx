import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { MapPin, Store, Building2, Percent, Package, Archive } from 'lucide-react';
import storeData from '@/data/store.json';

const StatsCarousel: React.FC = () => {
  // حساب الإحصائيات الفعلية من البيانات
  const totalProducts = storeData.products.length;
  const totalRegions = storeData.regions.length;
  const totalBranches = storeData.branches.length;
  const totalStreets = storeData.streets.length;
  const activeOffers = storeData.products.filter(product => product.specialOffer).length;
  const archivedProducts = storeData.products.filter(product => product.isArchived).length;

  const stats = [
    {
      title: 'إجمالي المنتجات',
      value: totalProducts,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'إجمالي المناطق',
      value: totalRegions,
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'إجمالي الفروع',
      value: totalBranches,
      icon: Store,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'العروض النشطة',
      value: activeOffers,
      icon: Percent,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'إجمالي الشوارع',
      value: totalStreets,
      icon: Building2,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'المنتجات المؤرشفة',
      value: archivedProducts,
      icon: Archive,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ];

  return (
    <div className="w-full">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {stats.map((stat, index) => (
            <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};

export default StatsCarousel; 