// import React from "react";
// import { StatusBar } from "expo-status-bar";
// import { SafeAreaProvider } from "react-native-safe-area-context";
// import { GestureHandlerRootView } from "react-native-gesture-handler";
// import { AuthProvider, useAuth } from "./src/context/AuthContext";
// import AppNavigator from "./src/navigation/AppNavigator";
// import usePushNotifications from "./src/hooks/usePushNotifications";

// function Root() {
//   const { isAuthenticated } = useAuth();
//   usePushNotifications(isAuthenticated);
//   return <AppNavigator />;
// }

// export default function App() {
//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <SafeAreaProvider>
//         <AuthProvider>
//           <StatusBar style="dark" />
//           <Root />
//         </AuthProvider>
//       </SafeAreaProvider>
//     </GestureHandlerRootView>
//   );
// }

import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import usePushNotifications from "./src/hooks/usePushNotifications";
// Addy chatbot — web pe pehle se tha, app me nahi tha
import Chatbot from "./src/components/Chatbot";

function Root() {
  const { isAuthenticated } = useAuth();
  usePushNotifications(isAuthenticated);
  return (
    <>
      <AppNavigator />
      {/* Floating button har screen ke upar */}
      <Chatbot />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Root />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}