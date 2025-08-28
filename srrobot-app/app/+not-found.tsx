import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Link, Stack } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <SafeAreaView style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={{ fontSize: wp(6) }}>This screen does not exist.</ThemedText>
          <Link href="/" style={styles.link}>
            <ThemedText type="link" style={{ fontSize: wp(4.2) }}>Go to home screen!</ThemedText>
          </Link>
        </ThemedView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(5),
  },
  link: {
    marginTop: hp(2),
    paddingVertical: hp(1.5),
  },
});