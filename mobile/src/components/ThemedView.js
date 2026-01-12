import React from 'react';
import { View } from 'react-native';
import { theme } from '../theme';

export function ThemedView({ children, style }) {
  return (
    <View style={[{ backgroundColor: theme.colors.background, flex: 1 }, style]}> 
      {children}
    </View>
  );
}
