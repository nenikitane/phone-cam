import { Tabs } from 'expo-router';
import React from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ff3b30',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarStyle: {
          backgroundColor: '#1c1c1e',
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'STREAM',
          tabBarIcon: ({ focused, color }) => (
            <Icon
              name={focused ? 'camera' : 'camera-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="recordings"
        options={{
          title: 'RECORDINGS',
          tabBarIcon: ({ focused, color }) => (
            <Icon
              name={focused ? 'folder' : 'folder-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'SETTINGS',
          tabBarIcon: ({ focused, color }) => (
            <Icon
              name={focused ? 'cog' : 'cog-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}