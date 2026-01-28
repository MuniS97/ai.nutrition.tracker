// lib/telegram/webapp.ts

export interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  }
  
  export interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
      user?: TelegramUser;
      auth_date: number;
      hash: string;
    };
    version: string;
    platform: string;
    colorScheme: 'light' | 'dark';
    themeParams: {
      bg_color?: string;
      text_color?: string;
      hint_color?: string;
      link_color?: string;
      button_color?: string;
      button_text_color?: string;
    };
    isExpanded: boolean;
    viewportHeight: number;
    viewportStableHeight: number;
    headerColor: string;
    backgroundColor: string;
    BackButton: {
      isVisible: boolean;
      show: () => void;
      hide: () => void;
      onClick: (callback: () => void) => void;
      offClick: (callback: () => void) => void;
    };
    MainButton: {
      text: string;
      color: string;
      textColor: string;
      isVisible: boolean;
      isActive: boolean;
      isProgressVisible: boolean;
      setText: (text: string) => void;
      show: () => void;
      hide: () => void;
      enable: () => void;
      disable: () => void;
      showProgress: (leaveActive: boolean) => void;
      hideProgress: () => void;
      onClick: (callback: () => void) => void;
      offClick: (callback: () => void) => void;
    };
    ready: () => void;
    expand: () => void;
    close: () => void;
    sendData: (data: string) => void;
    openLink: (url: string) => void;
    openTelegramLink: (url: string) => void;
  }
  
  declare global {
    interface Window {
      Telegram?: {
        WebApp: TelegramWebApp;
      };
    }
  }
  
  export function getTelegramWebApp(): TelegramWebApp | null {
    if (typeof window === 'undefined') return null;
    return window.Telegram?.WebApp || null;
  }
  
  export function isTelegramMiniApp(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(window.Telegram?.WebApp);
  }
  
  export function initTelegramWebApp() {
    const tg = getTelegramWebApp();
    
    if (!tg) return null;
    
    // Initialize the Web App
    tg.ready();
    tg.expand(); // Make it fullscreen
    
    // Get user data
    const user = tg.initDataUnsafe?.user;
    
    if (!user) return null;
    
    return {
      tg,
      userId: user.id.toString(),
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      languageCode: user.language_code,
    };
  }
  
  export function applyTelegramTheme() {
    const tg = getTelegramWebApp();
    if (!tg) return;
    
    const theme = tg.themeParams;
    
    // Apply Telegram theme colors to CSS variables
    if (theme.bg_color) {
      document.documentElement.style.setProperty('--tg-bg-color', theme.bg_color);
    }
    if (theme.text_color) {
      document.documentElement.style.setProperty('--tg-text-color', theme.text_color);
    }
    if (theme.button_color) {
      document.documentElement.style.setProperty('--tg-button-color', theme.button_color);
    }
  }