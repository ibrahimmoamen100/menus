import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  query,
  onSnapshot,
} from "firebase/firestore";
import { Order } from "@/types/order";

// تكوين Firebase - ستحتاج لإنشاء مشروع في Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCTXR6dPpPM_9qLp2Pxws_lzwhENHMNFFE",
  authDomain: "menus-f4aa3.firebaseapp.com",
  projectId: "menus-f4aa3",
  storageBucket: "menus-f4aa3.firebasestorage.app",
  messagingSenderId: "739208140291",
  appId: "1:739208140291:web:ce538f099df1194f84a036",
  measurementId: "G-MM0BCQ427L"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// دالة مساعدة لتنظيف البيانات من القيم undefined
const cleanOrderData = (orderData: Omit<Order, "id" | "createdAt" | "updatedAt">) => {
  return {
    customerName: orderData.customerName || "",
    customerPhone: orderData.customerPhone || "",
    customerAddress: orderData.customerAddress || "",
    selectedBranch: orderData.selectedBranch || "",
    items: orderData.items.map(item => ({
      productId: item.productId || "",
      productName: item.productName || "",
      quantity: item.quantity || 0,
      price: item.price || 0,
      selectedSize: item.selectedSize || null,
      selectedExtra: item.selectedExtra || null,
    })),
    totalAmount: orderData.totalAmount || 0,
    status: orderData.status || "pending",
    notes: orderData.notes || null,
  };
};

// دوال إدارة الطلبات
export const orderService = {
  // إضافة طلب جديد
  async createOrder(
    orderData: Omit<Order, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      console.log("[DEBUG] Attempting to create order in Firebase:", orderData);
      
      // تنظيف البيانات من القيم undefined
      const cleanedData = cleanOrderData(orderData);

      const orderWithTimestamps = {
        ...cleanedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log("[DEBUG] Cleaned order data:", cleanedData);
      console.log("[DEBUG] Order with timestamps:", orderWithTimestamps);
      console.log("[DEBUG] About to call addDoc...");

      const docRef = await addDoc(collection(db, "orders"), orderWithTimestamps);
      console.log("[DEBUG] Firebase document created with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("[DEBUG] Error creating order in Firebase:", error);
      console.error("[DEBUG] Full error object:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      
      // التحقق من نوع الخطأ
      if (error instanceof Error) {
        console.log("[DEBUG] Error type:", error.name);
        console.log("[DEBUG] Error message:", error.message);
        
        // إذا كان الخطأ بسبب حظر الاتصال
        if (error.message.includes('ERR_BLOCKED_BY_CLIENT') || 
            error.message.includes('network') ||
            error.message.includes('connection') ||
            error.message.includes('Could not establish connection')) {
          console.log("[DEBUG] Firebase connection blocked, using localStorage fallback");
        }
      }
      
      console.log("[DEBUG] Falling back to localStorage...");
      // Fallback to localStorage if Firebase fails
      const localId = this.createOrderLocal(orderData);
      console.log("[DEBUG] Local order created with ID:", localId);
      return localId;
    }
  },

  // جلب جميع الطلبات
  async getOrders(): Promise<Order[]> {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // تحويل Timestamp إلى Date
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        };
      }) as Order[];
    } catch (error) {
      console.error("Error getting orders from Firebase:", error);
      // Fallback to localStorage
      return this.getOrdersLocal();
    }
  },

  // تحديث حالة الطلب
  async updateOrderStatus(
    orderId: string,
    status: Order["status"]
  ): Promise<void> {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error updating order status in Firebase:", error);
      // Fallback to localStorage
      this.updateOrderStatusLocal(orderId, status);
    }
  },

  // الاستماع للتغييرات في الوقت الفعلي
  subscribeToOrders(callback: (orders: Order[]) => void) {
    try {
      console.log("[DEBUG] Setting up Firebase subscription...");
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      
      const unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
          console.log("[DEBUG] Firebase snapshot received:", querySnapshot.docs.length, "documents");
          const orders = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // تحويل Timestamp إلى Date
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
            };
          }) as Order[];
          console.log("[DEBUG] Processed orders:", orders);
          callback(orders);
        },
        (error) => {
          console.error("Firebase subscription error:", error);
          console.log("[DEBUG] Falling back to localStorage polling...");
          // Fallback to localStorage polling
          return this.subscribeToOrdersLocal(callback);
        }
      );
      
      console.log("[DEBUG] Firebase subscription set up successfully");
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up Firebase subscription:", error);
      console.log("[DEBUG] Falling back to localStorage polling due to setup error...");
      // Fallback to localStorage polling
      return this.subscribeToOrdersLocal(callback);
    }
  },

  // Fallback methods using localStorage
  createOrderLocal(orderData: Omit<Order, "id" | "createdAt" | "updatedAt">): string {
    // تنظيف البيانات من القيم undefined
    const cleanedData = cleanOrderData(orderData);

    const orderWithTimestamps = {
      ...cleanedData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const orders = this.getOrdersFromStorage();
    orders.unshift(orderWithTimestamps);
    this.saveOrdersToStorage(orders);

    return orderWithTimestamps.id;
  },

  getOrdersLocal(): Order[] {
    return this.getOrdersFromStorage();
  },

  updateOrderStatusLocal(orderId: string, status: Order["status"]): void {
    const orders = this.getOrdersFromStorage();
    const orderIndex = orders.findIndex((order) => order.id === orderId);

    if (orderIndex !== -1) {
      orders[orderIndex].status = status;
      orders[orderIndex].updatedAt = new Date();
      this.saveOrdersToStorage(orders);
    }
  },

  subscribeToOrdersLocal(callback: (orders: Order[]) => void) {
    const interval = setInterval(() => {
      const orders = this.getOrdersFromStorage();
      callback(orders);
    }, 2000); // تحديث كل ثانيتين

    return () => clearInterval(interval);
  },

  // دوال مساعدة للـ Local Storage
  getOrdersFromStorage(): Order[] {
    try {
      const ordersJson = localStorage.getItem("orders");
      if (!ordersJson) return [];
      
      const orders = JSON.parse(ordersJson);
      // تحويل التواريخ من النص إلى Date objects
      return orders.map((order: any) => ({
        ...order,
        createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
        updatedAt: order.updatedAt ? new Date(order.updatedAt) : new Date(),
      }));
    } catch {
      return [];
    }
  },

  saveOrdersToStorage(orders: Order[]): void {
    try {
      localStorage.setItem("orders", JSON.stringify(orders));
    } catch (error) {
      console.error("Error saving orders to localStorage:", error);
    }
  },

  // دالة لفحص حالة الاتصال بـ Firebase
  async testConnection(): Promise<{ success: boolean; error?: string; blocked?: boolean }> {
    try {
      console.log("[DEBUG] Testing Firebase connection...");
      
      // محاولة إنشاء مستند اختبار في مجموعة orders
      const testOrder = {
        customerName: "اختبار الاتصال",
        customerPhone: "01000000000",
        customerAddress: "عنوان اختبار",
        selectedBranch: "فرع اختبار",
        items: [{
          productId: "test-connection",
          productName: "منتج اختبار الاتصال",
          quantity: 1,
          price: 10,
          selectedSize: null,
          selectedExtra: null
        }],
        totalAmount: 10,
        status: "pending",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, "orders"), testOrder);
      console.log("[DEBUG] Test order created in orders collection:", docRef.id);
      
      return { success: true };
    } catch (error) {
      console.error("[DEBUG] Firebase connection test failed:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const isBlocked = errorMessage.includes('ERR_BLOCKED_BY_CLIENT') || 
                       errorMessage.includes('network') ||
                       errorMessage.includes('connection');
      
      return { 
        success: false, 
        error: errorMessage,
        blocked: isBlocked
      };
    }
  },

  // دالة لفحص حالة الاتصال بالشبكة
  async checkNetworkStatus(): Promise<{ online: boolean; firebaseAccessible: boolean }> {
    try {
      // فحص الاتصال بالإنترنت
      const online = navigator.onLine;
      
      // فحص الوصول لـ Firebase
      const firebaseTest = await this.testConnection();
      
      return {
        online,
        firebaseAccessible: firebaseTest.success
      };
    } catch (error) {
      return {
        online: navigator.onLine,
        firebaseAccessible: false
      };
    }
  },
};
