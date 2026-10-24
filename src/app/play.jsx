import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

const CHALLENGES = [
  "Make something using only circles.",
  "Create a logo for a fictional café.",
  "Choose three random colors and make them work together.",
  "Design a room for a person who loves rain.",
  "Design a product that nobody asked for."
];

export default function Play() {
  const { t } = useTranslation();

  const router = useRouter();
  const [challengeIdx, setChallengeIdx] = useState(0);

  const nextChallenge = () => {
    setChallengeIdx((prev) => (prev + 1) % CHALLENGES.length);
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>{t('← back')}</Text>
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.icon}>🎲</Text>
        <Text style={styles.subtitle}>{t('Random Challenge')}</Text>
        
        <Text style={styles.challenge}>{CHALLENGES[challengeIdx]}</Text>
        
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>{t('START')}</Text>
        </Pressable>

        <Pressable style={styles.skipButton} onPress={nextChallenge}>
          <Text style={styles.skipText}>{t('skip this one')}</Text>
        </Pressable>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  icon: {
    fontSize: 70,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    color: '#302541',
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  challenge: {
    fontSize: 32,
    color: '#302541',
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 60,
    paddingHorizontal: 20,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  button: {
    backgroundColor: '#FFD978',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#302541',
    marginBottom: 24,
    boxShadow: '4px 6px 0px #302541',
    elevation: 8,
  },
  buttonText: {
    color: '#302541',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    color: '#302541',
    fontSize: 18,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
