// src/hooks/usePWAInstall.ts
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { useTranslations } from 'next-intl';

// Объявление глобального интерфейса для window
declare global {
  interface Window {
    _deferredInstallPrompt: BeforeInstallPromptEvent | null;
    _beforeInstallPromptListener: ((e: Event) => void) | null;
    _appInstalledListener: (() => void) | null;
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const t = useTranslations('InstallPWA');
  const theme = useTheme();
  const isMobileMediaQuery = useMediaQuery(theme.breakpoints.down('sm')); // Переименовал, чтобы не конфликтовать с isMobile, который будет выводиться
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [platform, setPlatform] = useState<
    'ios' | 'android' | 'desktop' | null
  >(null);
  const [browser, setBrowser] = useState<'safari' | 'chrome' | 'other' | null>(
    null,
  );
  const [showInstallButton, setShowInstallButton] = useState(false);
  const isInitialCheckPerformed = useRef(false);

  // --- Логика определения платформы и браузера, а также начальная проверка PWA ---
  useEffect(() => {
    if (isInitialCheckPerformed.current || typeof window === 'undefined') {
      return;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    let currentDetectedPlatform: 'ios' | 'android' | 'desktop' | null = null;
    let currentDetectedBrowser: 'safari' | 'chrome' | 'other' | null = null;

    if (/iphone|ipad|ipod/.test(userAgent)) {
      currentDetectedPlatform = 'ios';
      currentDetectedBrowser = 'safari';
    } else if (/android/.test(userAgent)) {
      currentDetectedPlatform = 'android';
      if (/chrome/.test(userAgent)) {
        currentDetectedBrowser = 'chrome';
      } else {
        currentDetectedBrowser = 'other';
      }
    } else {
      // Десктоп
      currentDetectedPlatform = 'desktop';
      if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) {
        currentDetectedBrowser = 'safari';
      } else if (/chrome/.test(userAgent)) {
        currentDetectedBrowser = 'chrome';
      } else {
        currentDetectedBrowser = 'other';
      }
    }
    setPlatform(currentDetectedPlatform);
    setBrowser(currentDetectedBrowser);

    const isCurrentlyStandalone = window.matchMedia(
      '(display-mode: standalone)',
    ).matches;

    setIsAppInstalled(isCurrentlyStandalone);

    // Устанавливаем начальное значение deferredPrompt, если оно уже есть
    setDeferredPrompt(window._deferredInstallPrompt);

    // Определяем, показывать ли кнопку при первоначальной загрузке
    if (!isCurrentlyStandalone) {
      if (currentDetectedBrowser === 'safari') {
        setShowInstallButton(true);
      } else if (
        currentDetectedPlatform === 'android' &&
        currentDetectedBrowser === 'chrome'
      ) {
        setShowInstallButton(!!window._deferredInstallPrompt);
      } else {
        setShowInstallButton(!!window._deferredInstallPrompt);
      }
    } else {
      setShowInstallButton(false);
    }

    isInitialCheckPerformed.current = true;
  }, []); // Пустой массив зависимостей для однократного выполнения

  // --- Управление глобальными слушателями событий PWA (только один раз) ---
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Listener for 'beforeinstallprompt'
    if (!window._beforeInstallPromptListener) {
      const newListener = (e: Event) => {
        e.preventDefault();
        window._deferredInstallPrompt = e as BeforeInstallPromptEvent;
        window.dispatchEvent(new Event('deferredInstallPromptChanged'));
      };
      window.addEventListener('beforeinstallprompt', newListener);
      window._beforeInstallPromptListener = newListener;
    }

    // Listener for 'appinstalled'
    if (!window._appInstalledListener) {
      const newAppInstalledListener = () => {
        window._deferredInstallPrompt = null;
        window.dispatchEvent(new Event('appInstalledCustom'));
      };
      window.addEventListener('appinstalled', newAppInstalledListener);
      window._appInstalledListener = newAppInstalledListener;
    }

    // Cleanup (необходимо, если хук может быть размонтирован, хотя для PWA это реже)
    return () => {
      // В данном случае, слушатели остаются, так как они глобальные
      // и управляют общим состоянием PWA для всего приложения.
      // Если бы они были специфичны для компонента, их нужно было бы удалять.
    };
  }, []); // Пустой массив зависимостей, чтобы добавились один раз

  // --- Обработка динамических изменений deferredPrompt и appinstalled ---
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleDeferredPromptChange = () => {
      const currentGlobalPrompt = window._deferredInstallPrompt;
      setDeferredPrompt(currentGlobalPrompt);

      if (!isAppInstalled) {
        // Только если приложение еще не установлено
        if (browser === 'safari') {
          // Safari всегда показывает кнопку, так как нет prompt
          setShowInstallButton(true);
        } else if (platform === 'android' && browser === 'chrome') {
          // Android Chrome показывает кнопку, если есть prompt
          setShowInstallButton(!!currentGlobalPrompt);
        } else {
          // Другие браузеры/платформы показывают кнопку, если есть prompt
          setShowInstallButton(!!currentGlobalPrompt);
        }
      } else {
        // Если приложение установлено, кнопку не показываем
        setShowInstallButton(false);
      }
    };

    const handleAppInstalledUpdate = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      setShowInstallButton(false);
    };

    window.addEventListener(
      'deferredInstallPromptChanged',
      handleDeferredPromptChange,
    );
    window.addEventListener('appInstalledCustom', handleAppInstalledUpdate);

    // Вызываем при монтировании, чтобы обновить состояние, если prompt уже был до монтирования
    handleDeferredPromptChange();

    return () => {
      window.removeEventListener(
        'deferredInstallPromptChanged',
        handleDeferredPromptChange,
      );
      window.removeEventListener(
        'appInstalledCustom',
        handleAppInstalledUpdate,
      );
    };
  }, [isAppInstalled, platform, browser]); // Зависимости для пересчета состояния

  // --- Функция установки PWA ---
  const handleInstallClick = async () => {
    if (typeof window === 'undefined') return;

    if (
      browser === 'safari' || // Safari всегда открывает модалку
      (!window._deferredInstallPrompt && platform === 'desktop') // На десктопе без prompt тоже модалка
    ) {
      return 'openModal'; // Сигнал для открытия модалки
    }

    const currentDeferredPrompt = window._deferredInstallPrompt;

    if (currentDeferredPrompt) {
      try {
        currentDeferredPrompt.prompt();
        const { outcome } = await currentDeferredPrompt.userChoice;
        window._deferredInstallPrompt = null; // Очищаем после использования
        setDeferredPrompt(null); // Обновляем состояние хука
        if (outcome === 'accepted') {
          // 'appinstalled' событие обработает дальнейшее обновление состояния
        } else {
          // Пользователь отклонил установку
          // setShowInstallButton(true); // Возможно, снова показать кнопку, если пользователь отклонил?
        }
        return 'promptHandled';
      } catch (error) {
        console.error('Error during PWA prompt:', error);
        return 'error';
      }
    } else {
      return 'openModal'; // Открыть модалку, если prompt не был пойман
    }
  };

  // --- Вычисляемые значения ---
  const shouldRenderStickyButton = useMemo(() => {
    // Кнопка показывается, если приложение НЕ установлено, И showInstallButton=true
    return !isAppInstalled && showInstallButton;
  }, [isAppInstalled, showInstallButton]);

  const InstallIconType = useMemo(() => {
    // Возвращаем строку для динамического импорта
    if (browser === 'safari') return 'apple';
    if (platform === 'android') return 'android';
    return 'download';
  }, [platform, browser]);

  return {
    t, // Пробрасываем функцию переводов
    isMobile: isMobileMediaQuery, // isMobile из медиа-запроса
    deferredPrompt,
    isAppInstalled,
    platform,
    browser,
    showInstallButton,
    shouldRenderStickyButton,
    InstallIconType, // Тип иконки для динамического импорта
    handleInstallClick,
  };
}
