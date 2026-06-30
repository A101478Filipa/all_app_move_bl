import React from 'react';
import {
  Text, ScrollView, SafeAreaView, RefreshControl, StyleSheet, Image
} from 'react-native';
import { HStack, VStack } from '@components/CoreComponents';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { Color } from '@src/styles/colors';
import { ExpandableRow } from '@components/ProfileComponents';
import InfoRowComponent from '@components/InfoRowComponent';
import { Programmer } from 'moveplus-shared';
import ScreenState from '@src/constants/screenState';
import { ActivityIndicatorOverlay } from '@components/ActivityIndicatorOverlay';
import PersonIcon from '@icons/generic-person.svg';
import EmailIcon from '@icons/generic-email.svg';
import PhoneIcon from '@icons/generic-phone.svg';
import { buildAvatarUrl } from '@src/services/ApiService';

type ProgrammerDetailsComponentArgs = {
  programmer: Programmer | null;
  screenState: ScreenState;
  onRefresh: () => Promise<void> | void;
}

// MARK: Component
const ProgrammerDetailsComponent = ({ screenState, programmer, onRefresh }: ProgrammerDetailsComponentArgs) => {
  if (screenState === ScreenState.LOADING) {
    return (
      <SafeAreaView>
        <ActivityIndicatorOverlay/>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={screenState === ScreenState.REFRESHING} onRefresh={onRefresh} />
        }
      >
        {programmer && (
          <VStack align="flex-start" spacing={Spacing.lg_24}>
            <HStack spacing={Spacing.lg_24} style={styles.header}>
              <Image source={{ uri: buildAvatarUrl(programmer.user.avatarUrl) }} style={styles.avatar} />
              <VStack align="flex-start" spacing={Spacing.xs_4}>
                <Text style={styles.name}>{programmer.name}</Text>
                <Text style={styles.role}>Programmer</Text>
              </VStack>
            </HStack>

            <ExpandableRow title="Programmer Info">
              <VStack align="flex-start" style={styles.infoRowContainer}>
                <InfoRowComponent
                  iconName="email"
                  title="Email"
                  value={programmer.user.email}
                  isLast={!programmer.phoneNumber}
                />
                {programmer.phoneNumber && (
                  <InfoRowComponent
                    iconName="phone"
                    title="Phone"
                    value={programmer.phoneNumber}
                    isLast={true}
                  />
                )}
              </VStack>
            </ExpandableRow>
          </VStack>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// MARK: Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  scrollContainer: {
    flexGrow: 1,
    ...spacingStyles.screenScrollContainer,
  },
  header: {
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Color.primary
  },
  name: {
    fontSize: FontSize.large,
    fontFamily: FontFamily.bold
  },
  role: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.primary,
  },
  infoRowContainer: {
    alignSelf: 'stretch'
  },
});

export default ProgrammerDetailsComponent;
