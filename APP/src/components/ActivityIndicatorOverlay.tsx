import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Color } from '../styles/colors';

export const ActivityIndicatorOverlay = () => {
  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" />
    </View>
  )
};

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Color.Background.subtle,
    opacity: 0.7,
  },
});