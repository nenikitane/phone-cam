import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { useAppStore } from '@/store/useAppStore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Recording {
  id: string;
  filename: string;
  uri: string;
  creationTime: number;
  duration: number;
  fileSize: number;
}

export default function RecordingsScreen() {
  const [recordings, setRecordings] = React.useState<Recording[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant media library access to view recordings');
        return;
      }

      const assets = await MediaLibrary.getAssetsAsync({
        mediaType: 'video',
        sortBy: 'creationTime',
        sortOrder: 'desc',
        first: 50,
      });

      setRecordings(assets.map(a => ({
        id: a.id,
        filename: a.filename,
        uri: a.uri,
        creationTime: a.creationTime * 1000,
        duration: a.duration || 0,
        fileSize: a.fileSize || 0,
      })));
    } catch (e) {
      console.error('Load recordings error:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const deleteRecording = async (id: string) => {
    Alert.alert('Delete', 'Delete this recording?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          await MediaLibrary.deleteAssetsAsync([id]);
          setRecordings(r => r.filter(rec => rec.id !== id));
        }
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading recordings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {recordings.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="folder-outline" size={64} color="#3a3a3c" />
          <Text style={styles.emptyText}>No recordings yet</Text>
          <Text style={styles.emptySubtext}>Recordings will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={recordings}
          keyExtractor={r => r.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => console.log('Play:', item.uri)}
              onLongPress={() => deleteRecording(item.id)}
            >
              <View style={styles.itemThumb}>
                <Icon name="video" size={32} color="#8e8e93" />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.filename}</Text>
                <Text style={styles.itemMeta}>
                  {formatDate(item.creationTime)} · {formatDuration(item.duration)} · {formatSize(item.fileSize)}
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#3a3a3c" />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#8e8e93',
    textAlign: 'center',
    marginTop: 50,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#8e8e93',
    fontSize: 14,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
  },
  itemThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#2c2c2e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  itemMeta: {
    color: '#8e8e93',
    fontSize: 12,
    marginTop: 2,
  },
  separator: {
    height: 8,
  },
});