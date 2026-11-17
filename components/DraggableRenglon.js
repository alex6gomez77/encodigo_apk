import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import { Swipeable } from 'react-native-gesture-handler';
import { DragGestureHandler } from 'react-native-gesture-handler';
import { FontAwesome5 } from '@expo/vector-icons';

export default function DraggableRenglon({ children, onReorder, index, totalItems }) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <DragGestureHandler
      onBegan={() => setIsDragging(true)}
      onEnded={() => setIsDragging(false)}
      onCanceled={() => setIsDragging(false)}
    >
      <View style={[styles.container, isDragging && styles.dragging]}>
        <View style={styles.dragHandle}>
          <View style={styles.dragDots}>
            <View style={styles.dragDot} />
            <View style={styles.dragDot} />
            <View style={styles.dragDot} />
            <View style={styles.dragDot} />
            <View style={styles.dragDot} />
            <View style={styles.dragDot} />
          </View>
        </View>
        <View style={styles.content}>
          {children}
        </View>
      </View>
    </DragGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dragging: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
  },
  dragHandle: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragDots: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    marginVertical: 1,
  },
  content: {
    flex: 1,
  },
});