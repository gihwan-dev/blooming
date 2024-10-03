import {Stack} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import {useColorScheme} from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
      <Stack screenOptions={{
        headerShown: false,
      }}>
          <Stack.Screen name={"index"} />
      </Stack>
  );
}
