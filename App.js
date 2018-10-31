import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  ActivityIndicator,
  AsyncStorage,
  StatusBar
} from "react-native";
import { Constants, WebBrowser } from "expo";
import {
  createSwitchNavigator,
  createStackNavigator,
  createBottomTabNavigator
} from "react-navigation";
import Ionicons from "react-native-vector-icons/Ionicons";
import SafeMap from "./components/SafeMap.js";

class HomeScreen extends React.Component {
  static navigationOptions = { title: "Home" };
  render() {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <SafeMap />
      </View>
    );
  }
}

class SettingsScreen extends React.Component {
  static navigationOptions = { title: "Settings" };

  _signOutAsync = async () => {
    await AsyncStorage.clear();
    this.props.navigation.navigate("Auth");
  };

  render() {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Settings Screen</Text>
        <Button
          title="Go to Home"
          onPress={() => this.props.navigation.navigate("Home")}
        />
        <Button title="Actually, sign me out :)" onPress={this._signOutAsync} />
      </View>
    );
  }
}

class AuthLoadingScreen extends React.Component {
  constructor(props) {
    super(props);
    this._bootstrapAsync();
  }

  _bootstrapAsync = async () => {
    const userToken = await AsyncStorage.getItem("userToken");

    this.props.navigation.navigate(userToken ? "App" : "Auth");
  };

  render() {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <StatusBar barStyle="default" />
      </View>
    );
  }
}

class SignInScreen extends React.Component {
  static navigationOptions = {
    title: "Please sign in"
  };

  state = {
    result: null
  };

  render() {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Button
          title="Don't use Strava, just take me to the app"
          onPress={this._signInAsync}
        />
        <Button
          title="Open WebBrowser"
          onPress={this._handlePressButtonAsync}
        />
      </View>
    );
  }

  _signInAsync = async () => {
    await AsyncStorage.setItem("userToken", "abc");
    this.props.navigation.navigate("App");
  };
  _handlePressButtonAsync = async () => {
    let result = await WebBrowser.openAuthSessionAsync(
      "https://www.strava.com/oauth/authorize?client_id=29699&response_type=code&redirect_uri=http://localhost&approval_prompt=force"
    );
    this.setState({ result });
  };
}

const AuthStack = createStackNavigator({ SignIn: SignInScreen });

const AppTab = createBottomTabNavigator(
  { Home: HomeScreen, Settings: SettingsScreen },
  {
    navigationOptions: ({ navigation }) => ({
      tabBarIcon: ({ focused, horizontal, tintColor }) => {
        const { routeName } = navigation.state;
        let iconName;
        if (routeName === "Home") {
          iconName = `ios-map${focused ? "" : "-outline"}`;
        } else if (routeName === "Settings") {
          iconName = `ios-options${focused ? "" : "-outline"}`;
        }
        return (
          <Ionicons
            name={iconName}
            size={horizontal ? 20 : 25}
            color={tintColor}
          />
        );
      }
    }),
    tabBarOptions: {
      activeTintColor: "tomato",
      inactiveTintColor: "gray"
    }
  }
);

const RootStack = createSwitchNavigator(
  {
    AuthLoading: AuthLoadingScreen,
    App: AppTab,
    Auth: AuthStack
  },
  {
    initialRouteName: "AuthLoading"
  }
);

export default class App extends React.Component {
  render() {
    return <RootStack />;
  }
}

// oauth url strava rnnr app:
//
