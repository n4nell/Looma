import { useEffect } from 'react';
import { Slot } from 'expo-router';
import '../global.css';
import '../i18n';
import { setupGlobalClickSound } from '../utils/sound';

export default function Layout() {
  useEffect(() => {
    const cleanup = setupGlobalClickSound();
    return cleanup;
  }, []);

  return <Slot />;
}
