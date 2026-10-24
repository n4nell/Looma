import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function Express() {
  const { t } = useTranslation();

  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState(null);
  const [text, setText] = useState('');

  if (activeMenu) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={() => setActiveMenu(null)} style={styles.backButton}>
            <Text style={styles.backText}>{t('← cancel')}</Text>
          </Pressable>
          <Pressable style={styles.saveButton} onPress={() => setActiveMenu(null)}>
            <Text style={styles.saveText}>{t('done')}</Text>
          </Pressable>
        </View>

        <TextInput
          style={styles.inputArea}
          placeholder="Just type..."
          placeholderTextColor="rgba(41, 37, 34, 0.3)"
          multiline
          autoFocus
          value={text}
          onChangeText={setText}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>{t('← back')}</Text>
      </Pressable>
      
      <Text style={styles.title}>{t('Get something out of your head.')}</Text>

      <View style={styles.menu}>
        {[
          { icon: '💭', name: 'Thought', desc: 'Write anything.', id: 'thought' },
          { icon: '📖', name: 'Journal', desc: 'Write about your day.', id: 'journal' },
          { icon: '📝', name: 'Free Write', desc: 'Write without a prompt.', id: 'freewrite' },
          { icon: '🎙️', name: 'Voice', desc: 'Speak and save your thoughts.', id: 'voice' },
          { icon: '🖼️', name: 'Visual', desc: 'Add an image and some text.', id: 'visual' },
        ].map((item, index) => (
          <Pressable 
            key={index} 
            style={styles.menuItem}
            onPress={() => setActiveMenu(item.id)}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <View style={styles.textContainer}>
              <Text style={styles.menuName}>{item.name}</Text>
              <Text style={styles.menuDesc}>{item.desc}</Text>
            </View>
          </Pressable>
        ))}
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 10,
  },
  backText: {
    color: '#302541',
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#FF385C',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  inputArea: {
    flex: 1,
    fontSize: 24,
    color: '#302541',
    textAlignVertical: 'top',
    lineHeight: 34,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#302541',
    marginBottom: 40,
  },
  menu: {
    gap: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(168, 216, 185, 0.1)',
    borderRadius: 16,
  },
  icon: {
    fontSize: 24,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  menuName: {
    fontSize: 18,
    color: '#302541',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  menuDesc: {
    fontSize: 14,
    color: '#302541',
    opacity: 0.6,
  },
});
