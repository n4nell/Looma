import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

export default function Chill() {
  const { t } = useTranslation();

  const router = useRouter();
  const [scale] = useState(() => new Animated.Value(1));
  const [activeMood, setActiveMood] = useState(null);

  useEffect(() => {
    // Breathing animation loop
    const breathe = Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.5,
        duration: 4000,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ]);
    
    Animated.loop(breathe).start();
  }, []);

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>{t('← back')}</Text>
      </Pressable>
      
      <View style={styles.content}>
        <Text style={styles.title}>{t('breathe.')}</Text>
        <View style={styles.line} />
        
        <View style={styles.animationContainer}>
          <Animated.View style={[styles.circle, { transform: [{ scale }] }]} />
        </View>

        <Text style={styles.subtitle}>{t('choose a mood')}</Text>

        <View style={styles.moodList}>
          {['☁ calm', '☁ sleepy', '☁ cozy', '☁ peaceful'].map((item, index) => (
            <Pressable 
              key={index} 
              style={[
                styles.moodItem, 
                activeMood === index && styles.moodItemActive
              ]}
              onPress={() => setActiveMood(index)}
            >
              <Text style={[
                styles.moodText,
                activeMood === index && styles.moodTextActive
              ]}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8BA5C9', // Dusty Blue
    padding: 24,
  },
  backButton: {
    marginTop: 40,
    marginBottom: 20,
  },
  backText: {
    color: '#FFFAF1',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    color: '#FFFAF1',
    fontWeight: '300',
    fontStyle: 'italic',
  },
  line: {
    width: 80,
    height: 1,
    backgroundColor: '#FFFAF1',
    marginVertical: 30,
    opacity: 0.5,
  },
  animationContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 241, 255, 0.2)',
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFAF1',
    opacity: 0.8,
    marginBottom: 24,
    letterSpacing: 1,
  },
  moodList: {
    width: '100%',
    maxWidth: 250,
  },
  moodItem: {
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 241, 255, 0.2)',
  },
  moodItemActive: {
    backgroundColor: 'rgba(245, 241, 255, 0.1)',
    borderRadius: 12,
    borderBottomWidth: 0,
  },
  moodText: {
    fontSize: 20,
    color: '#FFFAF1',
    fontWeight: '400',
    opacity: 0.7,
  },
  moodTextActive: {
    opacity: 1,
    fontWeight: 'bold',
  }
});
