import { doc, getDoc, setDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// تكوين Firebase
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

// دالة بسيطة لإدارة Cookies (بدون مكتبة خارجية)
const CookieManager = {
  set: (name: string, value: string, options: { expires?: Date; secure?: boolean; sameSite?: string } = {}) => {
    let cookie = `${name}=${encodeURIComponent(value)}`;
    if (options.expires) {
      cookie += `; expires=${options.expires.toUTCString()}`;
    }
    if (options.secure) {
      cookie += '; secure';
    }
    if (options.sameSite) {
      cookie += `; samesite=${options.sameSite}`;
    }
    document.cookie = cookie;
  },
  
  get: (name: string): string | undefined => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return decodeURIComponent(parts.pop()?.split(';').shift() || '');
    }
    return undefined;
  },
  
  remove: (name: string) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
};

const ADMIN_PASSWORD = '45086932';
const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface AdminSession {
  isAuthenticated: boolean;
  loginTime: number;
  expiresAt: number;
  token: string;
}

export class AuthService {
  private static instance: AuthService;
  private currentSession: AdminSession | null = null;

  private constructor() {
    this.loadSessionFromCookie();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // تحميل الجلسة من Cookie
  private loadSessionFromCookie(): void {
    try {
      const sessionData = CookieManager.get(SESSION_COOKIE_NAME);
      if (sessionData) {
        const session: AdminSession = JSON.parse(sessionData);
        const now = Date.now();
        
        // التحقق من صلاحية الجلسة
        if (session.expiresAt > now) {
          this.currentSession = session;
        } else {
          // الجلسة منتهية الصلاحية
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('Error loading session from cookie:', error);
      this.clearSession();
    }
  }

  // حفظ الجلسة في Cookie
  private saveSessionToCookie(session: AdminSession): void {
    try {
      CookieManager.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
        expires: new Date(session.expiresAt),
        secure: true,
        sameSite: 'strict'
      });
    } catch (error) {
      console.error('Error saving session to cookie:', error);
    }
  }

  // تسجيل الدخول
  public async login(password: string): Promise<{ success: boolean; message: string }> {
    try {
      if (password !== ADMIN_PASSWORD) {
        return { success: false, message: 'كلمة المرور غير صحيحة' };
      }

      // إنشاء جلسة جديدة
      const now = Date.now();
      const session: AdminSession = {
        isAuthenticated: true,
        loginTime: now,
        expiresAt: now + SESSION_DURATION,
        token: this.generateToken()
      };

      // حفظ الجلسة في Firebase
      await this.saveSessionToFirebase(session);

      // حفظ الجلسة محلياً وفي Cookie
      this.currentSession = session;
      this.saveSessionToCookie(session);

      return { success: true, message: 'تم تسجيل الدخول بنجاح' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'حدث خطأ أثناء تسجيل الدخول' };
    }
  }

  // تسجيل الخروج
  public async logout(): Promise<void> {
    try {
      if (this.currentSession) {
        // حذف الجلسة من Firebase
        await this.deleteSessionFromFirebase(this.currentSession.token);
      }
    } catch (error) {
      console.error('Error deleting session from Firebase:', error);
    } finally {
      this.clearSession();
    }
  }

  // التحقق من حالة تسجيل الدخول
  public isAuthenticated(): boolean {
    if (!this.currentSession) {
      return false;
    }

    const now = Date.now();
    if (this.currentSession.expiresAt <= now) {
      // الجلسة منتهية الصلاحية
      this.clearSession();
      return false;
    }

    return this.currentSession.isAuthenticated;
  }

  // الحصول على معلومات الجلسة
  public getSession(): AdminSession | null {
    return this.currentSession;
  }

  // تحديث الجلسة
  public async refreshSession(): Promise<boolean> {
    try {
      if (!this.currentSession) {
        return false;
      }

      const now = Date.now();
      const timeUntilExpiry = this.currentSession.expiresAt - now;
      
      // إذا كان الوقت المتبقي أقل من ساعة، قم بتحديث الجلسة
      if (timeUntilExpiry < 60 * 60 * 1000) {
        const newSession: AdminSession = {
          ...this.currentSession,
          loginTime: now,
          expiresAt: now + SESSION_DURATION,
          token: this.generateToken()
        };

        // تحديث في Firebase
        await this.saveSessionToFirebase(newSession);

        // تحديث محلياً وفي Cookie
        this.currentSession = newSession;
        this.saveSessionToCookie(newSession);
      }

      return true;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  }

  // حفظ الجلسة في Firebase
  private async saveSessionToFirebase(session: AdminSession): Promise<void> {
    try {
      const sessionRef = doc(db, 'admin_sessions', session.token);
      await setDoc(sessionRef, {
        ...session,
        lastActivity: Date.now(),
        userAgent: navigator.userAgent,
        ipAddress: await this.getClientIP()
      });
    } catch (error) {
      console.error('Error saving session to Firebase:', error);
      throw error;
    }
  }

  // حذف الجلسة من Firebase
  private async deleteSessionFromFirebase(token: string): Promise<void> {
    try {
      const sessionRef = doc(db, 'admin_sessions', token);
      await setDoc(sessionRef, { deleted: true, deletedAt: Date.now() });
    } catch (error) {
      console.error('Error deleting session from Firebase:', error);
    }
  }

  // مسح الجلسة محلياً
  private clearSession(): void {
    this.currentSession = null;
    CookieManager.remove(SESSION_COOKIE_NAME);
  }

  // إنشاء token عشوائي
  private generateToken(): string {
    return 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // الحصول على IP العميل (تقريبي)
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  // الحصول على إحصائيات الجلسات النشطة
  public async getActiveSessions(): Promise<any[]> {
    try {
      // هذا يتطلب إعداد قواعد Firestore مناسبة
      // يمكن إضافة هذا لاحقاً إذا لزم الأمر
      return [];
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return [];
    }
  }
}

// تصدير نسخة واحدة من الخدمة
export const authService = AuthService.getInstance(); 