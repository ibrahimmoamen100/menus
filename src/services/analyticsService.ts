import { Visitor, PageView, AnalyticsData } from "@/types/analytics";

// خدمة تتبع الزوار المحسنة
export const analyticsService = {
  // إنشاء معرف جلسة فريد
  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // إنشاء معرف زائر فريد
  generateVisitorId(): string {
    return `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // حفظ بيانات الزائر
  saveVisitor(visitor: Omit<Visitor, "id">): string {
    const visitorWithId = {
      ...visitor,
      id: this.generateVisitorId(),
      timestamp: new Date(), // تأكد من أن الوقت دقيق
    };

    const visitors = this.getVisitorsFromStorage();
    
    // التحقق من عدم وجود تكرار للجلسة في نفس الوقت
    const existingSession = visitors.find(v => 
      v.sessionId === visitor.sessionId && 
      Math.abs(new Date(v.timestamp).getTime() - new Date(visitor.timestamp).getTime()) < 1000
    );
    
    if (!existingSession) {
      visitors.push(visitorWithId);
      this.saveVisitorsToStorage(visitors);
    }

    return visitorWithId.id;
  },

  // حفظ عرض الصفحة
  savePageView(pageView: Omit<PageView, "id">): void {
    const pageViewWithId = {
      ...pageView,
      id: `pageview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(), // تأكد من أن الوقت دقيق
    };

    const pageViews = this.getPageViewsFromStorage();
    
    // التحقق من عدم وجود تكرار للصفحة في نفس الجلسة في نفس الوقت
    const existingPageView = pageViews.find(pv => 
      pv.sessionId === pageView.sessionId && 
      pv.page === pageView.page &&
      Math.abs(new Date(pv.timestamp).getTime() - new Date(pageView.timestamp).getTime()) < 1000
    );
    
    if (!existingPageView) {
      pageViews.push(pageViewWithId);
      this.savePageViewsToStorage(pageViews);
    }
  },

  // تحديث مدة الزيارة
  updateVisitDuration(sessionId: string, duration: number): void {
    const visitors = this.getVisitorsFromStorage();
    const visitorIndex = visitors.findIndex(v => v.sessionId === sessionId);
    
    if (visitorIndex !== -1) {
      visitors[visitorIndex].visitDuration = duration;
      this.saveVisitorsToStorage(visitors);
    }
  },

  // جلب جميع الزوار
  getVisitors(): Visitor[] {
    return this.getVisitorsFromStorage();
  },

  // جلب جميع عروض الصفحات
  getPageViews(): PageView[] {
    return this.getPageViewsFromStorage();
  },

  // مسح البيانات القديمة (أكثر من 30 يوم)
  cleanupOldData(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // مسح الزوار القدامى
    const visitors = this.getVisitorsFromStorage();
    const filteredVisitors = visitors.filter(visitor => 
      new Date(visitor.timestamp) > thirtyDaysAgo
    );
    this.saveVisitorsToStorage(filteredVisitors);

    // مسح عروض الصفحات القديمة
    const pageViews = this.getPageViewsFromStorage();
    const filteredPageViews = pageViews.filter(pageView => 
      new Date(pageView.timestamp) > thirtyDaysAgo
    );
    this.savePageViewsToStorage(filteredPageViews);
  },

  // تحليل البيانات المحسن
  getAnalytics(timeFilter: string = "all"): AnalyticsData {
    // تنظيف البيانات القديمة أولاً
    this.cleanupOldData();

    const visitors = this.getVisitors();
    const pageViews = this.getPageViews();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    // تصفية حسب الوقت
    const filteredVisitors = visitors.filter((visitor) => {
      const visitorDate = new Date(visitor.timestamp);
      switch (timeFilter) {
        case "today":
          return visitorDate >= today;
        case "week":
          return visitorDate >= weekAgo;
        case "month":
          return visitorDate >= monthAgo;
        default:
          return true;
      }
    });

    const filteredPageViews = pageViews.filter((pageView) => {
      const pageViewDate = new Date(pageView.timestamp);
      switch (timeFilter) {
        case "today":
          return pageViewDate >= today;
        case "week":
          return pageViewDate >= weekAgo;
        case "month":
          return pageViewDate >= monthAgo;
        default:
          return true;
      }
    });

    // إحصائيات عامة
    const totalVisitors = filteredVisitors.length;
    const uniqueVisitors = new Set(filteredVisitors.map((v) => v.visitorId || v.sessionId)).size;
    const totalPageViews = filteredPageViews.length;

    // حساب متوسط مدة الجلسة (بالدقائق)
    const sessionDurations = filteredVisitors
      .filter((v) => v.visitDuration && v.visitDuration > 0)
      .map((v) => (v.visitDuration! / (1000 * 60))); // تحويل من مللي ثانية إلى دقائق
    
    const averageSessionDuration = sessionDurations.length > 0
      ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length
      : 0;

    // أكثر الصفحات زيارة
    const pageStats = filteredPageViews.reduce((acc, pageView) => {
      const page = pageView.page;
      acc[page] = (acc[page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topPages = Object.entries(pageStats)
      .map(([page, views]) => ({ page, views: Number(views) }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // الزوار حسب اليوم (آخر 7 أيام)
    const visitorsByDay = new Array(7).fill(0).map((_, index) => {
      const date = new Date(today.getTime() - (6 - index) * 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString("ar-EG", {
        weekday: "short",
        month: "short",
        day: "numeric"
      });
      
      const count = filteredVisitors.filter((visitor) => {
        const visitorDate = new Date(visitor.timestamp);
        return visitorDate.toDateString() === date.toDateString();
      }).length;
      
      return { date: dateStr, visitors: count };
    });

    // الزوار حسب الساعة (12 ساعة)
    const visitorsByHour = new Array(24).fill(0).map((_, hour) => {
      const count = filteredVisitors.filter((visitor) => {
        const visitorDate = new Date(visitor.timestamp);
        return visitorDate.getHours() === hour;
      }).length;
      
      // تحويل إلى تنسيق 12 ساعة
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const period = hour < 12 ? 'ص' : 'م';
      const label = `${hour12}:00 ${period}`;
      
      return { 
        hour, 
        visitors: count,
        label
      };
    });

    // الزوار الجدد والعائدون
    const newVisitors = filteredVisitors.filter((v) => v.isNewVisitor).length;
    const returningVisitors = filteredVisitors.filter((v) => !v.isNewVisitor).length;

    // حساب معدل الارتداد (زوار زاروا صفحة واحدة فقط)
    const singlePageVisitors = new Set();
    const multiPageVisitors = new Set();
    
    filteredPageViews.forEach(pageView => {
      const visitorId = pageView.visitorId || pageView.sessionId;
      if (singlePageVisitors.has(visitorId)) {
        singlePageVisitors.delete(visitorId);
        multiPageVisitors.add(visitorId);
      } else if (!multiPageVisitors.has(visitorId)) {
        singlePageVisitors.add(visitorId);
      }
    });

    const bounceRate = uniqueVisitors > 0 ? (singlePageVisitors.size / uniqueVisitors) * 100 : 0;
    const avgPagesPerSession = uniqueVisitors > 0 ? totalPageViews / uniqueVisitors : 0;

    // أعلى ساعة نشاط
    const peakHour = visitorsByHour.reduce((max, current) => 
      current.visitors > max.visitors ? current : max
    );

    // أعلى يوم نشاط
    const peakDay = visitorsByDay.reduce((max, current) => 
      current.visitors > max.visitors ? current : max
    );

    return {
      totalVisitors,
      uniqueVisitors,
      totalPageViews,
      averageSessionDuration,
      topPages,
      visitorsByDay,
      visitorsByHour,
      newVisitors,
      returningVisitors,
      bounceRate,
      avgPagesPerSession,
      peakHour: peakHour.hour,
      peakDay: peakDay.date,
    };
  },

  // الاشتراك في تحديثات الإحصائيات
  subscribeToAnalytics(callback: (data: AnalyticsData) => void): () => void {
    const interval = setInterval(() => {
      const data = this.getAnalytics();
      callback(data);
    }, 30000); // تحديث كل 30 ثانية

    return () => clearInterval(interval);
  },

  // دوال التخزين المحسنة
  getVisitorsFromStorage(): Visitor[] {
    try {
      const visitorsJson = localStorage.getItem("visitors");
      if (!visitorsJson) return [];
      
      const visitors = JSON.parse(visitorsJson);
      // تحويل التواريخ من النصوص إلى كائنات Date
      return visitors.map((visitor: any) => ({
        ...visitor,
        timestamp: new Date(visitor.timestamp)
      }));
    } catch (error) {
      console.error("Error loading visitors from localStorage:", error);
      return [];
    }
  },

  saveVisitorsToStorage(visitors: Visitor[]): void {
    try {
      localStorage.setItem("visitors", JSON.stringify(visitors));
    } catch (error) {
      console.error("Error saving visitors to localStorage:", error);
    }
  },

  getPageViewsFromStorage(): PageView[] {
    try {
      const pageViewsJson = localStorage.getItem("pageViews");
      if (!pageViewsJson) return [];
      
      const pageViews = JSON.parse(pageViewsJson);
      // تحويل التواريخ من النصوص إلى كائنات Date
      return pageViews.map((pageView: any) => ({
        ...pageView,
        timestamp: new Date(pageView.timestamp)
      }));
    } catch (error) {
      console.error("Error loading pageViews from localStorage:", error);
      return [];
    }
  },

  savePageViewsToStorage(pageViews: PageView[]): void {
    try {
      localStorage.setItem("pageViews", JSON.stringify(pageViews));
    } catch (error) {
      console.error("Error saving pageViews to localStorage:", error);
    }
  },

  // إعادة تعيين البيانات (للتطوير والاختبار)
  resetData(): void {
    localStorage.removeItem("visitors");
    localStorage.removeItem("pageViews");
    localStorage.removeItem("sessionId");
    localStorage.removeItem("visitorId");
    localStorage.removeItem("hasVisited");
  }
};
