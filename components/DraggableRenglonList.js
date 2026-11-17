import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import { Swipeable } from 'react-native-gesture-handler';
import { FontAwesome5 } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';

export default function DraggableRenglonList({ data, onReorder, renderItem, keyExtractor, ...props }) {
  const handleDragEnd = ({ from, to }) => {
    if (from !== to) {
      const newData = Array.from(data);
      const [movedItem] = newData.splice(from, 1);
      newData.splice(to, 0, movedItem);
      onReorder(newData);
    }
  };

  return (
    <DraggableFlatList
      data={data}
      keyExtractor={keyExtractor}
      onDragEnd={handleDragEnd}
      renderItem={renderItem}
      {...props}
    />
  );
}

const styles = StyleSheet.create({});