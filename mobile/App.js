import React from "react";
import { ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, useAuth } from "./src/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import InterviewScreen from "./src/screens/InterviewScreen";
import FeedbackScreen from "./src/screens/FeedbackScreen";
import SummaryScreen from "./src/screens/SummaryScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

const Stack = createNativeStackNavigator();

function Routes() {
  const { token, booting } = useAuth();
  if (booting) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <Stack.Navigator>
      {token ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Interview" component={InterviewScreen} options={{ headerBackVisible: false }} />
          <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ headerBackVisible: false }} />
          <Stack.Screen name="Summary" component={SummaryScreen} options={{ headerBackVisible: false }} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Routes />
      </NavigationContainer>
    </AuthProvider>
  );
}