const { withAndroidManifest } = require('@expo/config-plugins');

function addFikIntentFilter(androidManifest) {
  const mainActivity = androidManifest.manifest.application[0].activity.find(
    (activity) => activity.$['android:name'] === '.MainActivity'
  );

  if (!mainActivity['intent-filter']) {
    mainActivity['intent-filter'] = [];
  }

  mainActivity['intent-filter'].push({
    action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
    category: [
      { $: { 'android:name': 'android.intent.category.DEFAULT' } },
      { $: { 'android:name': 'android.intent.category.BROWSABLE' } },
    ],
    data: [
      { $: { 'android:scheme': 'file', 'android:mimeType': '*/*', 'android:pathPattern': '.*\\.fik' } },
      { $: { 'android:scheme': 'content', 'android:mimeType': '*/*', 'android:pathPattern': '.*\\.fik' } },
    ],
  });

  return androidManifest;
}

const withFikFileHandling = (config) => {
  return withAndroidManifest(config, (config) => {
    config.modResults = addFikIntentFilter(config.modResults);
    return config;
  });
};

module.exports = withFikFileHandling;
