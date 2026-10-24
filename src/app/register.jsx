import confetti from 'canvas-confetti';
import { useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Image, KeyboardAvoidingView, PanResponder, Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import ErrorModal from '../components/ErrorModal';
import { registerUser } from '../utils/auth';

// Suppress the browser's built-in password reveal eye so our custom one is the only one
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'looma-no-native-eye';
  if (!document.getElementById(styleId)) {
    const tag = document.createElement('style');
    tag.id = styleId;
    tag.textContent = `
      input[type="password"]::-ms-reveal,
      input[type="password"]::-ms-clear,
      input[type="password"]::-webkit-contacts-auto-fill-button,
      input[type="password"]::-webkit-credentials-auto-fill-button {
        display: none !important;
      }
    `;
    document.head.appendChild(tag);
  }
}

const triggerSound = (type = 'click') => {
  if (Platform.OS !== 'web') return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'chime') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {}
};

const DraggableShape = ({ color, size, startX, startY, shape, emoji }) => {
  const [pan] = useState(() => new Animated.ValueXY());
  const [scale] = useState(() => new Animated.Value(1));
  const [rotate] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: 10000, useNativeDriver: false })
    ).start();
  }, []);

  const [panResponder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
        Animated.spring(scale, { toValue: 1.2, friction: 3, useNativeDriver: false }).start();
        triggerSound('click');
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: false }).start();
        triggerSound('chime');
      }
    })
  );

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute', left: startX, top: startY, width: size, height: size,
        backgroundColor: color, borderWidth: 4, borderColor: '#302541',
        borderRadius: shape === 'circle' ? size / 2 : 16,
        transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale }, { rotate: rotateInterpolate }],
        justifyContent: 'center', alignItems: 'center',
        zIndex: 10,
        boxShadow: '4px 4px 0px #302541',
        cursor: 'grab'
      }}
    >
      <Text style={{ fontSize: size / 2 }}>{emoji}</Text>
    </Animated.View>
  );
};

export default function Register() {
  const { t } = useTranslation();

  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    tag: 'Sign-up Failed',
    title: 'Sign-up Failed!',
    message: '',
    warning: '',
    buttonText: 'Try Again'
  });
  
  const [scaleAnim] = useState(() => new Animated.Value(1));
  const [logoRotateAnim] = useState(() => new Animated.Value(0));

  const { width } = useWindowDimensions();
  const isWide = width > 500;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focusedInput ? 1.01 : 1,
      friction: 5,
      tension: 100,
      useNativeDriver: Platform.OS !== 'web'
    }).start();
  }, [focusedInput]);

  const handleFocus = (field) => {
    setFocusedInput(field);
    triggerSound('click');
    Animated.sequence([
      Animated.timing(logoRotateAnim, { toValue: 1, duration: 150, useNativeDriver: false }),
      Animated.timing(logoRotateAnim, { toValue: 0, duration: 150, useNativeDriver: false })
    ]).start();
  };

  const handleRegister = async (e) => {
    if (!username.trim() || !password) {
      triggerSound('click');
      const msg = t('Please enter your username and password.');
      setModalConfig({
        isOpen: true,
        tag: 'Missing Information',
        title: 'Please Fill In All Fields',
        message: msg,
        warning: '',
        buttonText: 'Got It'
      });
      return;
    }
    if (username.trim().length < 3) {
      triggerSound('click');
      const msg = t('Username must be at least 3 characters long.');
      setModalConfig({
        isOpen: true,
        tag: 'Username Format',
        title: 'Username Is Too Short!',
        message: msg,
        warning: '',
        buttonText: 'Fix It'
      });
      return;
    }
    if (password.length < 4) {
      triggerSound('click');
      const msg = t('Password must be at least 4 characters long.');
      setModalConfig({
        isOpen: true,
        tag: 'Account Security',
        title: 'Password Is Too Short!',
        message: msg,
        warning: '',
        buttonText: 'Fix It'
      });
      return;
    }

    setLoading(true);

    const result = await registerUser({ fullName, username, password });
    if (!result.success) {
      setLoading(false);
      triggerSound('click');
      setModalConfig({
        isOpen: true,
        tag: 'Sign-up Failed',
        title: 'Sign-up Failed!',
        message: result.message || 'Something went wrong while creating your account.',
        warning: '',
        buttonText: 'Try Again'
      });
      return;
    }

    triggerSound('chime');
    if (Platform.OS === 'web' && e?.nativeEvent) {
      const rect = e.target?.getBoundingClientRect?.();
      if (rect) {
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;
        confetti({ particleCount: 80, spread: 100, origin: { x, y }, colors: ['#FF385C', '#FFD978', '#A8D8B9', '#FFE2D8'], gravity: 1.2 });
      }
    }
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 400);
  };

  const logoRotation = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '15deg']
  });

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#FFFAF1' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {Platform.OS === 'web' && (
        <View style={[StyleSheet.absoluteFillObject, { 
          backgroundImage: 'radial-gradient(#302541 1.5px, transparent 1.5px)', 
          backgroundSize: '24px 24px', opacity: 0.1, zIndex: 0, pointerEvents: 'none'
        }]} />
      )}

      <View style={[StyleSheet.absoluteFillObject, { overflow: 'hidden', zIndex: 0 }]}>
        <DraggableShape color="#FFD978" size={80} startX="8%" startY="12%" shape="square" emoji="🎲" />
        <DraggableShape color="#BAE6FD" size={100} startX="82%" startY="15%" shape="circle" emoji="🎸" />
        <DraggableShape color="#FFE2D8" size={90} startX="75%" startY="75%" shape="square" emoji="🍕" />
        <DraggableShape color="#FFF9F2" size={70} startX="12%" startY="80%" shape="circle" emoji="🍩" />
      </View>

      <View style={styles.container}>
        
        <View style={styles.header}>
          <Animated.View style={[styles.logoWrapper, { transform: [{ rotate: logoRotation }] }]}>
            <Image source={require('../../assets/images/looma.png')} style={styles.logo} />
            <View style={styles.sparkleBadge}><Text style={{ fontSize: 24 }}>✨</Text></View>
          </Animated.View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t('JOIN THE FUN!')}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t('CREATE AN ACCOUNT 🚀')}</Text>
            </View>
          </View>
        </View>

        <Animated.View style={[styles.formCard, { transform: [{ scale: scaleAnim }, { rotate: focusedInput ? '0deg' : '-1deg' }] }]}>
          
          <View style={{ flexDirection: isWide ? 'row' : 'column', gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t('FULL NAME')}</Text>
              <TextInput
                style={[styles.input, focusedInput === 'fullname' && styles.inputFocused]}
                placeholder="Super Creator"
                placeholderTextColor="rgba(48,37,65,0.4)"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                onFocus={() => handleFocus('fullname')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t('USERNAME')}</Text>
              <TextInput
                style={[styles.input, focusedInput === 'username' && styles.inputFocused]}
                placeholder="awesomeuser"
                placeholderTextColor="rgba(48,37,65,0.4)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                onFocus={() => handleFocus('username')}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          <Text style={styles.label}>{t('PASSWORD')}</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[styles.input, styles.passwordInput, focusedInput === 'password' && styles.inputFocused]}
              placeholder="make it unguessable"
              placeholderTextColor="rgba(48,37,65,0.4)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              returnKeyType="go"
              onSubmitEditing={handleRegister}
              onFocus={() => handleFocus('password')}
              onBlur={() => setFocusedInput(null)}
            />
            <Pressable 
              style={styles.eyeButton} 
              onPress={() => {
                triggerSound('click');
                setShowPassword(!showPassword);
              }}
              hitSlop={8}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff size={20} color="#302541" strokeWidth={2.5} />
              ) : (
                <Eye size={20} color="#302541" strokeWidth={2.5} />
              )}
            </Pressable>
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.registerButton, 
              loading && styles.buttonDisabled,
              { transform: [{ translateY: pressed && !loading ? 4 : 0 }] }
            ]}
            onPress={loading ? undefined : handleRegister}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>{loading ? t('CREATING ACCOUNT... ⏳') : t('SIGN UP NOW 🎪')}</Text>
          </Pressable>
        </Animated.View>

        <View style={styles.footer}>
          <Pressable 
            style={({ pressed }) => [styles.loginContainer, { transform: [{ scale: pressed ? 0.95 : 1 }, { rotate: '1deg' }] }]}
            onPress={() => { triggerSound('click'); router.push('/login'); }}
          >
            <Text style={styles.loginText}>Already a member? <Text style={styles.loginLink}>{t('Log in!')}</Text></Text>
          </Pressable>
          
          <Pressable 
            style={({ pressed }) => [styles.backButton, { transform: [{ translateY: pressed ? 2 : 0 }] }]}
            onPress={() => { triggerSound('click'); router.push('/'); }}
          >
            <Text style={styles.backButtonText}>{t('← BACK')}</Text>
          </Pressable>
        </View>
      </View>

      <ErrorModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        tag={modalConfig.tag}
        title={modalConfig.title}
        message={modalConfig.message}
        warning={modalConfig.warning}
        buttonText={modalConfig.buttonText}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 20,
  },
  logoWrapper: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#302541',
    boxShadow: '4px 4px 0px #302541',
  },
  logo: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
  },
  sparkleBadge: {
    position: 'absolute',
    top: -10,
    right: -15,
    transform: [{ rotate: '15deg' }],
  },
  titleContainer: {
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#302541',
    letterSpacing: -1,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#FFD978',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#302541',
    transform: [{ rotate: '-2deg' }],
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#302541',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 550, 
    padding: 32,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#302541',
    boxShadow: '8px 8px 0px #302541',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '900',
    color: '#302541',
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#FFFAF1',
    borderWidth: 3,
    borderColor: '#302541',
    borderRadius: 16,
    padding: 14,
    fontSize: 18,
    fontWeight: '700',
    color: '#302541',
    marginBottom: 16,
    boxShadow: '3px 3px 0px #302541',
  },
  inputFocused: {
    borderColor: '#302541',
    backgroundColor: '#FFFFFF',
  },
  passwordWrapper: {
    position: 'relative',
    width: '100%',
    marginBottom: 16,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 52,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 14,
    padding: 6,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButton: {
    backgroundColor: '#A8D8B9',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#302541',
    alignItems: 'center',
    marginTop: 8,
    boxShadow: '4px 4px 0px #302541',
  },
  registerButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#302541',
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  loginContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#302541',
  },
  loginText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#302541',
  },
  loginLink: {
    color: '#FF385C',
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#302541',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#302541',
  },
  backButtonText: {
    color: '#FFFAF1',
    fontWeight: '900',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});
