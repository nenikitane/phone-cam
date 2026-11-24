import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ControlButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  size?: number;
  color?: string;
  activeColor?: string;
}

export const ControlButton: React.FC<ControlButtonProps> = ({
  icon,
  label,
  onPress,
  active = false,
  disabled = false,
  size = 28,
  color = '#fff',
  activeColor = '#ff3b30',
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        active && styles.active,
        disabled && styles.disabled,
      ]}
      activeOpacity={0.7}
    >
      <Icon
        name={icon}
        size={size}
        color={active ? activeColor : color}
      />
      <Text style={[
        styles.label,
        active && styles.labelActive,
        disabled && styles.labelDisabled,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    minWidth: 70,
  },
  active: {
    backgroundColor: 'rgba(255, 59, 48, 0.3)',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: '#fff',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  labelActive: {
    color: '#ff3b30',
  },
  labelDisabled: {
    color: 'rgba(255,255,255,0.5)',
  },
});