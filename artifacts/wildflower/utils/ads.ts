import Constants, { ExecutionEnvironment } from 'expo-constants';

// react-native-google-mobile-ads requires native code that Expo Go doesn't
// ship with. Replit's live-preview workflow (`pnpm dev`) runs inside Expo
// Go, so any real ad SDK call there throws instead of loading -- this flag
// lets ad-related code skip straight to its fallback behavior in that case,
// and only exercise the real SDK in EAS development/preview/production
// builds, which do include the native module.
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Interstitial shown before an Ask reading unlocks. Google's official test
// ID is used automatically in dev builds. NOTE: __DEV__ is only true when
// the JS is running against a connected Metro dev server -- EAS `preview`
// and `production` builds bundle in release mode, so __DEV__ is FALSE there
// too. That means installing a preview/production build normally requests
// REAL ads. To test safely on a real device without risking your AdMob
// account being flagged for invalid traffic, register the device as a test
// device below instead of relying on __DEV__ alone.
// Real interstitial ad unit, created in the AdMob console for this app.
const PRODUCTION_INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-6480013765291060/5652033492';

// Add your device's test ID here after checking `adb logcat` (or Play
// Console) for a line like:
//   "Use RequestConfiguration.Builder.setTestDeviceIds(Arrays.asList(...))
//    to get test ads on this device."
// This makes AdMob serve guaranteed test ads to these specific devices even
// in preview/production builds, without touching the real ad unit's traffic.
const TEST_DEVICE_IDS: string[] = [
  // 'PASTE_YOUR_DEVICE_TEST_ID_HERE',
];

export function getInterstitialAdUnitId(): string {
  if (__DEV__) {
    // Lazy require so this file can be imported even in Expo Go without
    // touching the native module at all.
    const { TestIds } = require('react-native-google-mobile-ads');
    return TestIds.INTERSTITIAL;
  }
  return PRODUCTION_INTERSTITIAL_AD_UNIT_ID;
}

// Set once gatherConsentAndInitializeAdsSdk() resolves. AdPlaceholder checks
// this before ever loading a real interstitial -- if consent hasn't been
// resolved (or the user is in a region requiring it and hasn't granted it),
// ads must not be requested at all. Defaults closed (false) rather than
// open, so a failure never accidentally serves ads without consent.
let canRequestAdsFlag = false;
export function canRequestAds(): boolean {
  return isExpoGo ? true : canRequestAdsFlag;
}

/**
 * Google's required EU/UK privacy (UMP) consent flow -- must run and
 * resolve BEFORE initializing the Mobile Ads SDK or requesting any ad. This
 * is an AdMob policy requirement for EEA/UK users, not just a nicety.
 * https://support.google.com/admob/answer/10113005
 *
 * AdsConsent.gatherConsent() is Google's own convenience helper: it
 * requests consent info and automatically shows their consent form if this
 * specific user needs one. For users outside regulated regions it resolves
 * immediately with canRequestAds: true and shows nothing -- safe to always
 * call on every app start, not just for EEA/UK users.
 *
 * Call once at app startup (outside Expo Go), before any ad is requested.
 */
export async function gatherConsentAndInitializeAdsSdk(): Promise<void> {
  if (isExpoGo) return;
  try {
    const { AdsConsent } = require('react-native-google-mobile-ads');
    const mobileAds = require('react-native-google-mobile-ads').default;

    if (TEST_DEVICE_IDS.length > 0) {
      await mobileAds().setRequestConfiguration({ testDeviceIdentifiers: TEST_DEVICE_IDS });
    }

    const consentInfo = await AdsConsent.gatherConsent();
    canRequestAdsFlag = !!consentInfo.canRequestAds;

    if (canRequestAdsFlag) {
      await mobileAds().initialize();
    }
  } catch (err) {
    console.warn('UMP consent / AdMob SDK initialization failed', err);
    canRequestAdsFlag = false;
  }
}

/**
 * Whether a "Privacy Options" entry should be shown in Settings. Google
 * requires EEA/UK users have an ongoing way to review/change their consent
 * choice after the initial prompt, not just a one-time form at first launch.
 */
export async function isPrivacyOptionsRequired(): Promise<boolean> {
  if (isExpoGo) return false;
  try {
    const { AdsConsent, AdsConsentPrivacyOptionsRequirementStatus } = require('react-native-google-mobile-ads');
    const info = await AdsConsent.getConsentInfo();
    return info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
  } catch (err) {
    console.warn('Failed to check privacy options requirement', err);
    return false;
  }
}

/** Re-opens Google's privacy options form so the user can change their consent choice. */
export async function showPrivacyOptionsForm(): Promise<void> {
  if (isExpoGo) return;
  try {
    const { AdsConsent } = require('react-native-google-mobile-ads');
    const consentInfo = await AdsConsent.showPrivacyOptionsForm();
    canRequestAdsFlag = !!consentInfo.canRequestAds;
  } catch (err) {
    console.warn('Failed to show privacy options form', err);
  }
}
