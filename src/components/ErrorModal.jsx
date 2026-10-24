import { AlertTriangle, X } from 'lucide-react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export default function ErrorModal({
  isOpen,
  onClose,
  tag = 'Peringatan',
  title = 'Ups, Terjadi Kesalahan!',
  message = 'Silakan periksa kembali data Anda.',
  warning = '',
  buttonText = 'Coba Lagi',
}) {
  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        style={styles.backdrop} 
        onPress={onClose}
      >
        <Pressable 
          style={styles.card} 
          onPress={(e) => {
            if (Platform.OS === 'web' && e?.stopPropagation) {
              e.stopPropagation();
            }
          }}
        >
          {/* Close X Button */}
          <Pressable 
            style={styles.closeBtn} 
            onPress={onClose}
            hitSlop={8}
          >
            <X size={16} color="#302541" strokeWidth={3} />
          </Pressable>

          {/* Icon Badge */}
          <View style={styles.iconBox}>
            <AlertTriangle size={32} color="#FF385C" strokeWidth={2.5} />
          </View>

          {/* Tag Pill */}
          <View style={styles.tagPill}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>

          {/* Title */}
          <Text style={styles.titleText}>{title}</Text>

          {/* Body Message */}
          <Text style={[styles.bodyText, !warning && { marginBottom: 20 }]}>{message}</Text>

          {/* Warning Banner */}
          {!!warning && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>⚠️ {warning}</Text>
            </View>
          )}

          {/* Action Button */}
          <Pressable 
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed
            ]}
            onPress={onClose}
          >
            <Text style={styles.actionButtonText}>{buttonText}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(41, 37, 34, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 99999,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(4px)' } : {}),
  },
  card: {
    backgroundColor: '#FFFAF1',
    borderRadius: 32,
    borderWidth: 3.5,
    borderColor: '#302541',
    padding: 24,
    maxWidth: 360,
    width: '100%',
    alignItems: 'center',
    position: 'relative',
    elevation: 8,
    ...(Platform.OS === 'web' ? { boxShadow: '8px 8px 0px #302541' } : { shadowColor: '#302541', shadowOffset: { width: 8, height: 8 }, shadowOpacity: 1, shadowRadius: 0 }),
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#302541',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { boxShadow: '2px 2px 0px #302541', cursor: 'pointer' } : { shadowColor: '#302541', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0 }),
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FFE2D8',
    borderWidth: 3,
    borderColor: '#302541',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...(Platform.OS === 'web' ? { boxShadow: '3px 3px 0px #302541' } : { shadowColor: '#302541', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0 }),
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFE2D8',
    borderWidth: 2,
    borderColor: '#302541',
    marginBottom: 10,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#302541',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#302541',
    marginBottom: 8,
    textAlign: 'center',
  },
  bodyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#746B7C',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  warningBox: {
    marginTop: 14,
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFF0DF',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 74, 0.5)',
    width: '100%',
  },
  warningText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FF385C',
    textAlign: 'center',
  },
  actionButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FF385C',
    borderWidth: 2.5,
    borderColor: '#302541',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { boxShadow: '3px 3px 0px #302541', cursor: 'pointer' } : { shadowColor: '#302541', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0 }),
  },
  actionButtonPressed: {
    transform: [{ translateX: 1.5 }, { translateY: 1.5 }],
    ...(Platform.OS === 'web' ? { boxShadow: '1px 1px 0px #302541' } : { shadowColor: '#302541', shadowOffset: { width: 1, height: 1 }, shadowOpacity: 1, shadowRadius: 0 }),
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
