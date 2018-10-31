import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  ActivityIndicator,
  AsyncStorage,
  StatusBar,
  TouchableOpacity,
  Image,
  Switch
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

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: "#DDDDDD",
    padding: 12,
    borderRadius: 3,
    marginTop: 5
  }
});

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
        <SafeMap userToken={this.state.token} />
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
        <Switch />
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
        <TouchableOpacity onPress={this._stravaSignInAsync}>
          <Image
            source={require("./assets/btn_strava_connectwith_orange.png")}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={this._signInAsync}>
          <Text> Just take me to the app </Text>
        </TouchableOpacity>
      </View>
    );
  }

  _signInAsync = async () => {
    this.props.navigation.navigate("App");
  };
  _stravaSignInAsync = async () => {
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
      await AsyncStorage.setItem("userToken", this.state.code);

      this.props.navigation.navigate("App");
    }
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
