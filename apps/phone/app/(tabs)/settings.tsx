import React from 'react';
import { View, Text, StyleSheet, Switch, Alert, Linking } from 'react-native';
import { useAppStore } from '@/store/useAppStore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const {
    roomId,
    setRoomId,
    signalingHost,
    setSignalingHost,
    videoQuality,
    setVideoQuality,
    cameraPosition,
    setCameraPosition,
    videoEnabled,
    setVideoEnabled,
    audioEnabled,
    setAudioEnabled,
  } = useAppStore();

  const appVersion = Application.nativeApplicationVersion || '1.0.0';
  const buildNumber = Application.nativeBuildVersion || '1';
  const deviceName = Device.deviceName || 'Unknown Device';
  const osVersion = `${Device.osName} ${Device.osVersion}`;

  const openGitHub = () => Linking.openURL('https://github.com/yourusername/phone-cam');
  const openSignalingDocs = () => Linking.openURL('https://github.com/yourusername/phone-cam/tree/main/packages/signaling-server');

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CONNECTION</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Room ID</Text>
            <Text style={styles.settingHint}>Unique identifier for this session</Text>
          </View>
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
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Signaling Server</Text>
            <Text style={styles.settingHint}>WebSocket URL (optional, uses default)</Text>
          </View>
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
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CAMERA & QUALITY</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Video Quality</Text>
            <Text style={styles.settingHint}>Higher quality = more bandwidth</Text>
          </View>
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
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Default Camera</Text>
            <Text style={styles.settingHint}>Which camera to use on start</Text>
          </View>
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

        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Video Enabled by Default</Text>
            <Text style={styles.settingHint}>Start streaming with video on</Text>
          </View>
          <Switch
            value={videoEnabled}
            onValueChange={setVideoEnabled}
            trackColor={{ false: '#3a3a3c', true: '#ff3b30' }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Audio Enabled by Default</Text>
            <Text style={styles.settingHint}>Start streaming with audio on</Text>
          </View>
          <Switch
            value={audioEnabled}
            onValueChange={setAudioEnabled}
            trackColor={{ false: '#3a3a3c', true: '#ff3b30' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DESKTOP APP</Text>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Icon name="desktop-classic" size={24} color="#8e8e93" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Windows Receiver</Text>
              <Text style={styles.infoValue}>Download from Releases</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Icon name="server-network" size={24} color="#8e8e93" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Signaling Server</Text>
              <Text style={styles.infoValue}>Run locally or deploy</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.linkButton} onPress={openSignalingDocs}>
          <Text style={styles.linkText}>Setup Signaling Server →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>{appVersion} ({buildNumber})</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Device</Text>
            <Text style={styles.infoValue}>{deviceName}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>OS</Text>
            <Text style={styles.infoValue}>{osVersion}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Expo SDK</Text>
            <Text style={styles.infoValue}>{Constants.expoConfig?.sdkVersion || '50'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.linkButton} onPress={openGitHub}>
          <Text style={styles.linkText}>GitHub Repository →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DANGER ZONE</Text>
        
        <TouchableOpacity style={styles.dangerButton} onPress={() => Alert.alert('Reset', 'Reset all settings to defaults?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: () => {
            setRoomId('');
            setSignalingHost('');
            setVideoQuality('1080p');
            setCameraPosition('back');
            setVideoEnabled(true);
            setAudioEnabled(true);
          }},
        ])}>
          <Text style={styles.dangerButtonText}>RESET ALL SETTINGS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Need TextInput and TouchableOpacity
import { TextInput, TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    color: '#8e8e93',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  settingRow: {
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingLabelContainer: {
    flex: 1,
    paddingRight: 16,
  },
  settingLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  settingHint: {
    color: '#8e8e93',
    fontSize: 12,
    marginTop: 2,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#2c2c2e',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
    fontFamily: 'monospace',
    minWidth: 0,
  },
  qualitySelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  qualityOption: {
    flex: 1,
    paddingVertical: 10,
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
  infoRow: {
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    color: '#8e8e93',
    fontSize: 13,
  },
  infoValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  linkButton: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  linkText: {
    color: '#ff3b30',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#2c2c2e',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  dangerButtonText: {
    color: '#ff3b30',
    fontSize: 14,
    fontWeight: '700',
  },
});