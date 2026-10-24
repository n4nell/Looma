import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

const MOCK_FEED = [
  { icon: '🎨', name: 'Artwork', color: '#FF385C', likes: 12 },
  { icon: '✦', name: 'Design', color: '#FFD978', likes: 45 },
  { icon: '🧩', name: 'Creation', color: '#A8D8B9', likes: 8 },
  { icon: '📸', name: 'Photography', color: '#FFE2D8', likes: 112 },
];

export default function Explore() {
  const { t } = useTranslation();

  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>{t('← back')}</Text>
      </Pressable>
      
      <Text style={styles.title}>{t('EXPLORE')}</Text>

      <View style={styles.feed}>
        {MOCK_FEED.map((item, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{item.icon}</Text>
              <Text style={styles.cardName}>{item.name}</Text>
            </View>
            <View style={[styles.cardImagePlaceholder, { backgroundColor: item.color }]}>
              <Text style={styles.placeholderText}>{t('[visual content]')}</Text>
            </View>
            <View style={styles.cardActions}>
              <Text style={styles.actionIcon}>♡ {item.likes}</Text>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionIcon}>↗</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.actionIcon}>🔖</Text>
            </View>
          </View>
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
  },
  backText: {
    color: '#302541',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#302541',
    marginBottom: 30,
    letterSpacing: 2,
  },
  feed: {
    paddingBottom: 60,
  },
  card: {
    backgroundColor: '#A8D8B9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  cardName: {
    color: '#302541',
    fontSize: 16,
    fontWeight: '600',
  },
  cardImagePlaceholder: {
    height: 250,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    opacity: 0.9,
  },
  placeholderText: {
    color: '#302541',
    opacity: 0.6,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIcon: {
    color: '#302541',
    fontSize: 18,
  },
});
