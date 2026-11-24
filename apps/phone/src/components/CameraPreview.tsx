import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { MediaStream } from 'react-native-webrtc/lib/typescript/globals';

interface CameraPreviewProps {
  stream: MediaStream | null;
  style?: View['style'];
  mirror?: boolean;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({ 
  stream, 
  style,
  mirror = true 
}) => {
  if (!stream) {
    return (
      <View style={[styles.container, style, styles.noStream]}>
        <View style={styles.placeholder} />
      </View>
    );
  }

  return (
    <RTCView
      streamURL={stream.toURL()}
      style={[styles.container, style]}
      mirror={mirror}
      objectFit="cover"
      // Android specific
      zOrder={Platform.OS === 'android' ? 1 : undefined}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  noStream: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});