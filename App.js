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
import { Constants, WebBrowser, AuthSession } from "expo";
import {
  createSwitchNavigator,
  createStackNavigator,
  createBottomTabNavigator
} from "react-navigation";
import Ionicons from "react-native-vector-icons/Ionicons";
import SafeMap from "./components/SafeMap.js";

const STRAVA_CLIENT_ID = 29699;

class HomeScreen extends React.Component {
  static navigationOptions = { title: "Home" };

  constructor(props) {
    super(props);
    this.state = {
      token: null
    };
    this._loadTokenAsync();
  }

  _loadTokenAsync = async () => {
    let token = await AsyncStorage.getItem("userToken");
    this.setState({ token: token });
    console.log("strava token: " + token);
  };

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
    code: null
  };

  render() {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Button
          title="Don't use Strava, just take me to the app"
          onPress={this._signInAsync}
        />
        <Button
          title="Sign In with Strava"
          onPress={this._handlePressButtonAsync}
        />
      </View>
    );
  }

  _signInAsync = async () => {
    this.props.navigation.navigate("App");
  };
  _handlePressButtonAsync = async () => {
    let redirectUrl = AuthSession.getRedirectUrl();
    console.log(redirectUrl);
    let result = await AuthSession.startAsync({
      authUrl:
        `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}` +
        `&response_type=code&redirect_uri=${redirectUrl}&approval_prompt=force`
    }).catch(err => {
      console.log(err);
    });
    console.log(result);
    if (result.type === "success" && result.params !== null) {
      this.setState({ code: result.params.code });
    }
    console.log(this.state.code);
    await AsyncStorage.setItem("userToken", this.state.code);
    this.props.navigation.navigate("App");
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
