import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { CameraPreview } from '@/components/CameraPreview';
import { ControlButton } from '@/components/ControlButton';
import { WebRTCManager, ConnectionState } from '@/webrtc/webrtc';
import { useAppStore, useVideoConstraints } from '@/store/useAppStore';
import { MediaStream } from 'react-native-webrtc/lib/typescript/globals';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';

export default function StreamingScreen() {
  const {
    roomId,
    signalingHost,
    connectionState,
    setConnectionState,
    viewerCount,
    setViewerCount,
    isStreaming,
    setIsStreaming,
    cameraPosition,
    setCameraPosition,
    videoEnabled,
    setVideoEnabled,
    audioEnabled,
    setAudioEnabled,
    videoQuality,
    setVideoQuality,
    showSettings,
    setShowSettings,
    error,
    setError,
  } = useAppStore();

  const videoConstraints = useVideoConstraints();
  const webrtcRef = useRef<WebRTCManager | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const roomIdRef = useRef(roomId);
  const signalingHostRef = useRef(signalingHost);

  // Update refs when values change
  roomIdRef.current = roomId;
  signalingHostRef.current = signalingHost;

  // Handle connection state changes
  const handleConnectionStateChange = useCallback((state: ConnectionState) => {
    setConnectionState(state);
    if (state === 'connected') {
      setIsStreaming(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (state === 'disconnected' || state === 'failed') {
      setIsStreaming(false);
    }
  }, [setConnectionState, setIsStreaming]);

  const handleViewerCountChange = useCallback((count: number) => {
    setViewerCount(count);
  }, [setViewerCount]);

  const handleLocalStream = useCallback((stream: MediaStream) => {
    localStreamRef.current = stream;
  }, []);

  const handleError = useCallback((err: Error) => {
    console.error('[Streaming] Error:', err);
    setError(err.message);
    Alert.alert('Ошибка', err.message);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [setError]);

  // Start streaming
  const startStreaming = useCallback(async () => {
    if (!roomIdRef.current.trim()) {
      Alert.alert('Ошибка', 'Введите ID комнаты');
      return;
    }

    setError(null);
    setIsStreaming(true);

    try {
      const manager = new WebRTCManager({
        roomId: roomIdRef.current,
        signalingHost: signalingHostRef.current || undefined,
        videoConstraints: {
          ...videoConstraints,
          facingMode: cameraPosition === 'front' ? 'user' : 'environment',
        },
        audioConstraints: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      manager.onConnectionStateChange = handleConnectionStateChange;
      manager.onViewerCountChange = handleViewerCountChange;
      manager.onLocalStream = handleLocalStream;
      manager.onError = handleError;

      await manager.start();
      webrtcRef.current = manager;
    } catch (err) {
      setIsStreaming(false);
      handleError(err as Error);
    }
  }, [
    videoConstraints,
    cameraPosition,
    handleConnectionStateChange,
    handleViewerCountChange,
    handleLocalStream,
    handleError,
    setError,
    setIsStreaming,
  ]);

  // Stop streaming
  const stopStreaming = useCallback(async () => {
    await webrtcRef.current?.stop();
    webrtcRef.current = null;
    localStreamRef.current = null;
    setIsStreaming(false);
    setConnectionState('disconnected');
    setViewerCount(0);
  }, [setIsStreaming, setConnectionState, setViewerCount]);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    const newPosition = cameraPosition === 'front' ? 'back' : 'front';
    setCameraPosition(newPosition);
    
    try {
      await webrtcRef.current?.switchCamera(newPosition);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      console.error('Switch camera error:', err);
      setError('Не удалось переключить камеру');
    }
  }, [cameraPosition, setCameraPosition, setError]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    const newState = !videoEnabled;
    setVideoEnabled(newState);
    await webrtcRef.current?.toggleVideo(newState);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [videoEnabled, setVideoEnabled]);

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    await webrtcRef.current?.toggleAudio(newState);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [audioEnabled, setAudioEnabled]);

  // Cleanup on unmount
  useFocusEffect(
    useCallback(() => {
      return () => {
        webrtcRef.current?.stop();
      };
    }, [])
  );

  // Status bar
  StatusBar.setBarStyle('light-content');
  StatusBar.setBackgroundColor('transparent');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Camera Preview */}
      <View style={styles.previewContainer}>
        <CameraPreview
          stream={localStreamRef.current}
          mirror={cameraPosition === 'front'}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Connection Status Overlay */}
        <View style={styles.statusOverlay}>
          <View style={[
            styles.statusBadge,
            connectionState === 'connected' && styles.statusConnected,
            connectionState === 'connecting' && styles.statusConnecting,
            (connectionState === 'failed' || connectionState === 'disconnected') && styles.statusDisconnected,
          ]}>
            <View style={[
              styles.statusDot,
              connectionState === 'connected' && styles.dotGreen,
              connectionState === 'connecting' && styles.dotYellow,
              (connectionState === 'failed' || connectionState === 'disconnected') && styles.dotRed,
            ]} />
            <Text style={styles.statusText}>
              {connectionState === 'connected' && `● ON AIR · ${viewerCount} viewer${viewerCount !== 1 ? 's' : ''}`}
              {connectionState === 'connecting' && '● CONNECTING...'}
              {connectionState === 'disconnected' && '● DISCONNECTED'}
              {connectionState === 'failed' && '● FAILED'}
              {connectionState === 'new' && '● READY'}
            </Text>
          </View>
        </View>

        {/* Room ID Display */}
        {roomId && connectionState !== 'new' && (
          <View style={styles.roomIdBadge}>
            <Text style={styles.roomIdText}>Room: {roomId}</Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Main Controls Row */}
        <View style={styles.controlRow}>
          <ControlButton
            icon="camera-flip"
            label={cameraPosition === 'front' ? 'FRONT' : 'BACK'}
            onPress={toggleCamera}
            active={false}
            size={26}
          />
          
          <ControlButton
            icon={videoEnabled ? "video" : "video-off"}
            label={videoEnabled ? 'VIDEO ON' : 'VIDEO OFF'}
            onPress={toggleVideo}
            active={videoEnabled}
            size={28}
            activeColor="#34c759"
          />
          
          <ControlButton
            icon={audioEnabled ? "microphone" : "microphone-off"}
            label={audioEnabled ? 'AUDIO ON' : 'AUDIO OFF'}
            onPress={toggleAudio}
            active={audioEnabled}
            size={28}
            activeColor="#34c759"
          />
          
          <ControlButton
            icon="cog"
            label="SETTINGS"
            onPress={() => setShowSettings(!showSettings)}
            size={26}
          />
        </View>

        {/* Big Start/Stop Button */}
        <TouchableOpacity
          style={[
            styles.mainButton,
            isStreaming ? styles.mainButtonStop : styles.mainButtonStart,
          ]}
          onPress={isStreaming ? stopStreaming : startStreaming}
          disabled={connectionState === 'connecting'}
          activeOpacity={0.85}
        >
          <View style={styles.mainButtonInner}>
            {isStreaming ? (
              <>
                <View style={styles.recordingDot} />
                <Text style={styles.mainButtonText}>STOP</Text>
              </>
            ) : (
              <Text style={styles.mainButtonText}>GO LIVE</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Quality Indicator */}
        <View style={styles.qualityBadge}>
          <Text style={styles.qualityText}>{videoQuality.toUpperCase()}</Text>
        </View>
      </View>

      {/* Settings Modal */}
      {showSettings && (
        <View style={styles.modalOverlay} onTouchStart={() => setShowSettings(false)}>
          <View style={styles.modalContent} onTouchStart={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>SETTINGS</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Room ID</Text>
              <TextInput
                style={styles.textInput}
                value={roomId}
                onChangeText={setRoomId}
                placeholder="Enter room ID"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Signaling Server (optional)</Text>
              <TextInput
                style={styles.textInput}
                value={signalingHost}
                onChangeText={setSignalingHost}
                placeholder="ws://your-server.com:8080"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Video Quality</Text>
              <View style={styles.qualitySelector}>
                {(['720p', '1080p', '4k'] as const).map(q => (
                  <TouchableOpacity
                    key={q}
                    style={[
                      styles.qualityOption,
                      videoQuality === q && styles.qualityOptionSelected,
                    ]}
                    onPress={() => setVideoQuality(q)}
                  >
                    <Text style={[
                      styles.qualityOptionText,
                      videoQuality === q && styles.qualityOptionTextSelected,
                    ]}>
                      {q.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Camera</Text>
              <View style={styles.qualitySelector}>
                {(['front', 'back'] as const).map(pos => (
                  <TouchableOpacity
                    key={pos}
                    style={[
                      styles.qualityOption,
                      cameraPosition === pos && styles.qualityOptionSelected,
                    ]}
                    onPress={() => setCameraPosition(pos)}
                  >
                    <Text style={[
                      styles.qualityOptionText,
                      cameraPosition === pos && styles.qualityOptionTextSelected,
                    ]}>
                      {pos === 'front' ? 'SELFIE' : 'MAIN'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.closeButtonText}>DONE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)} style={styles.errorDismiss}>
            <Text style={styles.errorDismissText}>DISMISS</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// Need to import TextInput and TouchableOpacity
import { TextInput, TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  statusOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignSelf: 'flex-start',
  },
  statusConnected: {
    backgroundColor: 'rgba(52, 199, 89, 0.9)',
  },
  statusConnecting: {
    backgroundColor: 'rgba(255, 149, 0, 0.9)',
  },
  statusDisconnected: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dotGreen: { backgroundColor: '#34c759' },
  dotYellow: { backgroundColor: '#ff9500' },
  dotRed: { backgroundColor: '#ff3b30' },
  statusText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  roomIdBadge: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 10,
  },
  roomIdText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  controlsContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  mainButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mainButtonStart: {
    backgroundColor: '#ff3b30',
  },
  mainButtonStop: {
    backgroundColor: '#1c1c1e',
    borderWidth: 2,
    borderColor: '#ff3b30',
  },
  mainButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff3b30',
    marginRight: 10,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  qualityBadge: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  qualityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 1,
  },
  settingRow: {
    marginBottom: 20,
  },
  settingLabel: {
    color: '#8e8e93',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#2c2c2e',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  qualitySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  qualityOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2c2c2e',
    alignItems: 'center',
  },
  qualityOptionSelected: {
    backgroundColor: '#ff3b30',
  },
  qualityOptionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  qualityOptionTextSelected: {
    color: '#fff',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Error banner
  errorBanner: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.95)',
    zIndex: 50,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  errorDismiss: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  errorDismissText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});