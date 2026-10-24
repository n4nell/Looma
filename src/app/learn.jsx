import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

const LESSONS = [
  { text: 'Swipe →', color: '#FFD978' },
  { text: 'Complementary colors are opposite each other on the color wheel.', color: '#FF385C' },
  { text: 'Mini challenge:\n\nPick two colors that feel "calm".', color: '#A8D8B9' }
];

export default function Learn() {
  const { t } = useTranslation();

  const router = useRouter();
  const [step, setStep] = useState(0);

  const nextStep = () => {
    if (step < LESSONS.length - 1) setStep(step + 1);
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>{t('← back')}</Text>
      </Pressable>
      
      <View style={styles.content}>
        <Text style={styles.tag}>{t('Did you know?')}</Text>
        
        <Text style={styles.title}>{t('Why do some colors look good together?')}</Text>
        
        <Pressable 
          style={[styles.card, { backgroundColor: LESSONS[step].color }]}
          onPress={nextStep}
        >
          <Text style={styles.cardText}>{LESSONS[step].text}</Text>
        </Pressable>

        {step === LESSONS.length - 1 && (
          <Pressable style={styles.doneButton} onPress={() => router.back()}>
            <Text style={styles.doneText}>{t('Done for today')}</Text>
          </Pressable>
        )}
      </View>
    </View>
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
  },
  backText: {
    color: '#302541',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  tag: {
    fontSize: 16,
    color: '#FF385C',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#302541',
    marginBottom: 40,
  },
  card: {
    height: 300,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    boxShadow: '0px 2px 10px rgba(0,0,0,0.1)',
    elevation: 5,
  },
  cardText: {
    color: '#302541',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 30,
  },
  doneButton: {
    marginTop: 40,
    alignItems: 'center',
  },
  doneText: {
    color: '#FF385C',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
