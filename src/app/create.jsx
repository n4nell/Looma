import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function Create() {
  const { t } = useTranslation();

  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState(null);
  const [colors, setColors] = useState(['#FFD978', '#BAE6FD', '#A8D8B9']);

  const generateRandomColors = () => {
    const randomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    setColors([randomColor(), randomColor(), randomColor()]);
  };

  if (activeMenu === 'colors') {
    return (
      <View style={[styles.container, { backgroundColor: '#FFFAF1' }]}>
        <Pressable onPress={() => setActiveMenu(null)} style={styles.backButton}>
          <Text style={styles.backText}>{t('← back')}</Text>
        </Pressable>
        
        <View style={styles.colorPlayground}>
          <Text style={styles.playgroundTitle}>{t('COLOR PLAYGROUND')}</Text>
          
          <View style={styles.colorRow}>
            {colors.map((color, idx) => (
              <View key={idx} style={styles.colorWrapper}>
                <View style={[styles.colorCircle, { backgroundColor: color }]} />
                <Text style={styles.colorHex}>{color.toUpperCase()}</Text>
              </View>
            ))}
          </View>
          
          <Pressable style={styles.actionButton} onPress={generateRandomColors}>
            <Text style={styles.actionButtonText}>{t('Try another combination')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>{t('← back')}</Text>
      </Pressable>
      
      <Text style={styles.title}>{t('Make something.')}</Text>

      <View style={styles.menu}>
        {[
          { label: '🎨 Draw something', id: 'draw' },
          { label: '📝 Write something', id: 'write' },
          { label: '🧩 Build a moodboard', id: 'moodboard' },
          { label: '📐 Make a layout', id: 'layout' },
          { label: '🌈 Play with colors', id: 'colors' },
          { label: '✦ Start from scratch', id: 'scratch' }
        ].map((item, index) => (
          <Pressable 
            key={index} 
            style={styles.menuItem}
            onPress={() => {
              if (item.id === 'colors') setActiveMenu('colors');
            }}
          >
            <Text style={styles.menuText}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFAF1',
    padding: 24,
  },
  backButton: {
    marginTop: 40,
    marginBottom: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#302541',
    borderRadius: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFAF1',
    boxShadow: '2px 2px 0px #302541',
    elevation: 4,
  },
  backText: {
    color: '#302541',
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#302541',
    marginBottom: 40,
    letterSpacing: -1,
  },
  menu: {
    gap: 16,
  },
  menuItem: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#FFFAF1',
    borderWidth: 3,
    borderColor: '#302541',
    borderRadius: 16,
    boxShadow: '3px 4px 0px #302541',
    elevation: 6,
  },
  menuText: {
    fontSize: 20,
    color: '#302541',
    fontWeight: 'bold',
  },
  colorPlayground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  playgroundTitle: {
    fontSize: 24,
    color: '#302541',
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 60,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 60,
  },
  colorWrapper: {
    alignItems: 'center',
  },
  colorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#302541',
    marginBottom: 16,
    boxShadow: '3px 3px 0px #302541',
    elevation: 4,
  },
  colorHex: {
    fontSize: 14,
    color: '#302541',
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#FFD978',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#302541',
    boxShadow: '3px 4px 0px #302541',
    elevation: 6,
  },
  actionButtonText: {
    color: '#302541',
    fontSize: 18,
    fontWeight: '900',
  }
});
