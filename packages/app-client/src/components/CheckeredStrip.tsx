import React from 'react';
import { View, StyleSheet } from 'react-native';

/** Taxi-style checkered accent strip */
export function CheckeredStrip({ height = 6 }: { height?: number }) {
  const size = height;
  const cols = 20;
  const rows = 1;

  return (
    <View style={[styles.container, { height }]}>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {Array.from({ length: cols }).map((_, colIdx) => (
            <View
              key={colIdx}
              style={[
                styles.cell,
                { width: size, height: size },
                (rowIdx + colIdx) % 2 === 0 ? styles.cellBlack : styles.cellWhite,
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    backgroundColor: '#1a1a1a',
  },
  cellBlack: {
    backgroundColor: '#1a1a1a',
  },
  cellWhite: {
    backgroundColor: '#ffffff',
  },
});
