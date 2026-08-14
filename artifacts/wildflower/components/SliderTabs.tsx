import React from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { createStyles } from '@/utils/responsiveStyles';

// This toggle reads as too short/cramped on Android, so its container is
// 1.5x taller there (padding grows to match so the active pill still looks
// balanced inside it). iOS/web keep the original dimensions.
const TAB_HEIGHT = Platform.OS === 'android' ? 62 : 41;
const TAB_PADDING = Platform.OS === 'android' ? 5 : 3;

interface Tab {
  id: string;
  label: string;
  disabled?: boolean;
  badge?: string;
  /** Show a lock icon beside the label when the tab is not active. */
  lockIcon?: boolean;
}

interface SliderTabsProps {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
}

export default function SliderTabs({ tabs, activeId, onChange }: SliderTabsProps) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const isNarrow = width < 360;
  const compactTextSize = Platform.OS === 'android' ? 10 * 1.6 : 10;

  return (
    <View style={[
      styles.container,
      isNarrow && styles.narrowContainer,
      { backgroundColor: colors.card, borderColor: colors.border },
    ]}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <Pressable
            key={tab.id}
            onPress={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            style={({ pressed }) => [
              styles.tab,
              isNarrow && styles.narrowTab,
              isActive && [styles.activeTab, { backgroundColor: colors.cardElevated, borderColor: colors.gold }],
              tab.disabled && styles.disabledTab,
              pressed && !tab.disabled && { opacity: 0.7 },
            ]}
          >
            {tab.lockIcon && !isActive && (
              <Ionicons
                name="lock-closed"
                size={isNarrow ? 11 : 13}
                color={colors.mutedForeground}
                style={{ marginRight: isNarrow ? 3 : 5 }}
              />
            )}
            <Text
              style={[
                styles.tabText,
                isNarrow && { fontSize: compactTextSize },
                { color: isActive ? colors.gold : colors.mutedForeground },
                isActive && styles.activeTabText,
                tab.disabled && { color: colors.border },
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
            {tab.badge && (
              <Text style={[styles.badge, { color: colors.border }]}> {tab.badge}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = createStyles({
  container: {
    flexDirection: 'row',
    height: TAB_HEIGHT,
    borderRadius: 12,
    borderWidth: 1,
    padding: TAB_PADDING,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  narrowContainer: {
    marginHorizontal: 12,
  },
  narrowTab: {
    paddingHorizontal: 3,
  },
  activeTab: {
    borderWidth: 1,
  },
  disabledTab: {
    opacity: 0.45,
  },
  tabText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.2,
  },
  activeTabText: {
    fontFamily: 'Inter_600SemiBold',
  },
  badge: {
    fontSize: 9.5,
    fontFamily: 'Inter_400Regular',
  },
});
