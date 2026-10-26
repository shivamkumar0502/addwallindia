const isClientId = (value) => typeof value === "string" && /^\d+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(value);

module.exports = ({ config }) => {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  if (webClientId && !isClientId(webClientId)) throw new Error("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID must be a Web OAuth client ID");
  if (iosClientId && !isClientId(iosClientId)) throw new Error("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID must be an iOS OAuth client ID");
  return {
    ...config,
    // Android without Firebase uses native autolinking; this package's config
    // plugin only adds iOS URL schemes when used without Firebase.
    plugins: [
      ...(config.plugins || []),
      ...(iosClientId ? [["@react-native-google-signin/google-signin", {
        iosUrlScheme: `com.googleusercontent.apps.${iosClientId.replace(".apps.googleusercontent.com", "")}`,
      }]] : []),
    ],
    extra: {
      ...config.extra,
      ...(webClientId ? { googleWebClientId: webClientId } : {}),
      ...(iosClientId ? { googleIosClientId: iosClientId } : {}),
    },
  };
};
