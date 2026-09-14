import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * Configure native Android / iOS status bar to prevent clashing with web UI
 * @param {string} theme - 'dark' | 'light'
 */
export async function updateNativeStatusBar(theme = 'dark') {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    // Keep web view below system status bar to prevent notch/clock overlap
    await StatusBar.setOverlaysWebView({ overlay: false });

    if (theme === 'light') {
      // Dark icons on light status bar
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#F8FAFC' });
    } else {
      // Light icons on dark status bar
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#020617' });
    }
  } catch (err) {
    console.warn('Status bar adjustment failed:', err);
  }
}
