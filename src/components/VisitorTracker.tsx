import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { analyticsService } from "@/services/analyticsService";

export const VisitorTracker = () => {
  const location = useLocation();
  const sessionIdRef = useRef<string>("");
  const visitorIdRef = useRef<string>("");
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // إنشاء أو استرجاع معرف الجلسة
    let sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      sessionId = analyticsService.generateSessionId();
      localStorage.setItem("sessionId", sessionId);
    }
    sessionIdRef.current = sessionId;

    // إنشاء أو استرجاع معرف الزائر
    let visitorId = localStorage.getItem("visitorId");
    if (!visitorId) {
      visitorId = analyticsService.generateVisitorId();
      localStorage.setItem("visitorId", visitorId);
    }
    visitorIdRef.current = visitorId;

    // تحديد ما إذا كان زائر جديد
    const isNewVisitor = !localStorage.getItem("hasVisited");
    if (isNewVisitor) {
      localStorage.setItem("hasVisited", "true");
    }

    // حفظ بيانات الزائر
    const visitorData = {
      timestamp: new Date(),
      page: location.pathname,
      userAgent: navigator.userAgent,
      referrer: document.referrer || undefined,
      sessionId: sessionIdRef.current,
      visitorId: visitorIdRef.current,
      isNewVisitor,
    };

    analyticsService.saveVisitor(visitorData);

    // حفظ عرض الصفحة
    const pageViewData = {
      page: location.pathname,
      timestamp: new Date(),
      sessionId: sessionIdRef.current,
      visitorId: visitorIdRef.current,
    };

    analyticsService.savePageView(pageViewData);

    // تحديث وقت البداية
    startTimeRef.current = Date.now();

    // دالة لحساب مدة الزيارة عند مغادرة الصفحة
    const handleBeforeUnload = () => {
      const visitDuration = Date.now() - startTimeRef.current;
      analyticsService.updateVisitDuration(sessionIdRef.current, visitDuration);
    };

    // دالة لحساب مدة الزيارة عند تغيير الصفحة
    const handlePageChange = () => {
      const visitDuration = Date.now() - startTimeRef.current;
      analyticsService.updateVisitDuration(sessionIdRef.current, visitDuration);
      startTimeRef.current = Date.now();
    };

    // إضافة مستمع لحدث مغادرة الصفحة
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    // إضافة مستمع لحدث تغيير الصفحة
    window.addEventListener("popstate", handlePageChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePageChange);
    };
  }, []); // تشغيل مرة واحدة فقط عند تحميل المكون

  // تتبع تغيير الصفحة
  useEffect(() => {
    if (sessionIdRef.current && visitorIdRef.current) {
      // حفظ عرض الصفحة الجديدة
      const pageViewData = {
        page: location.pathname,
        timestamp: new Date(),
        sessionId: sessionIdRef.current,
        visitorId: visitorIdRef.current,
      };

      analyticsService.savePageView(pageViewData);

      // تحديث وقت البداية للصفحة الجديدة
      startTimeRef.current = Date.now();
    }
  }, [location.pathname]);

  // هذا المكون لا يعرض أي شيء مرئي
  return null;
};
