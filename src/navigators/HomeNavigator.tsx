import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { TopBar } from "../components/top-bar/top-bar-feature";
import { HomeScreen } from "../screens/home/HomeScreen";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
// import { useTheme } from "react-native-paper";
import { LeaScreen } from "../screens/lea/LeaScreen";
import { Image, useColorScheme } from "react-native";

const Tab = createBottomTabNavigator();

/**
 * This is the main navigator with a bottom tab bar.
 * Each tab is a stack navigator with its own set of screens.
 *
 * More info: https://reactnavigation.org/docs/bottom-tab-navigator/
 */
export function HomeNavigator() {
  const colorScheme = useColorScheme(); // 'light' or 'dark'
  // const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // header: () => <TopBar />,
        header: () => null,
        tabBarIcon: ({ focused, color, size }) => {
          // return null;
          switch (route.name) {
            case "Lealabs":
              return (
                <Image
                  className="h-full"
                  source={require("@images/LEALABSLOGO.png")}
                  resizeMode="contain"
                  style={{
                    tintColor: colorScheme === "dark" ? "#fff" : "#000",
                  }}
                  alt="Lealabs logo"
                />
              );
            case "Blank":
              return (
                <MaterialCommunityIcon
                  name={
                    focused ? "application-edit" : "application-edit-outline"
                  }
                  size={size}
                  color={color}
                />
              );
          }
        },
      })}
    >
      <Tab.Screen name="Lealabs" component={HomeScreen} />
      {/* <Tab.Screen name="Blank" component={LeaScreen} /> */}
    </Tab.Navigator>
  );
}
