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

// Do Not commit API secrets!!!
// Need to figure out a good strategy for handling keys
// to prevent accidental leaking via version control
const STRAVA_CLIENT_ID = null;
const STRAVA_CLIENT_SECRET = null;

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

  state = {
    tokenInfo: null
  };

  constructor(props) {
    console.log("at homescreen");
    super(props);
    this.state = {
      profile: null,
      tokenInfo: {
        access_token: null,
        refresh_token: null,
        expires_at: null,
        athlete_id: null
      }
    };
    this._loadTokenAsync();
  }

  _loadTokenAsync = async () => {
    let access_token = await AsyncStorage.getItem("access_token", err => {
      console.log("error with getting access token: " + err);
    });
    let refresh_token = await AsyncStorage.getItem("refresh_token", err => {
      console.log("error with getting refresh token: " + err);
    });

    let expires_at = await AsyncStorage.getItem("expires_at", err => {
      console.log("error with getting expiration: " + err);
    });
    let athlete_id = await AsyncStorage.getItem("athlete_id", err => {
      console.log("error with getting athlete_id: " + err);
    });

    console.log("begin load token async homescreen");
    this.setState({
      tokenInfo: {
        access_token: access_token,
        refresh_token: refresh_token,
        expires_at: expires_at,
        athlete_id: athlete_id
      }
    });
    console.log("strava token info from homescreen: ");
    console.log(this.state.tokenInfo);
  };

  render() {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <SafeMap tokenInfo={this.state.tokenInfo} />
      </View>
    );
  }
}

class SettingsScreen extends React.Component {
  static navigationOptions = { title: "Settings" };
  state = {
    profile: null
  };

  constructor(props) {
    super(props);

    this._getProfileAsync();
  }

  _getProfileAsync = async () => {
    let profileURL = await AsyncStorage.getItem("profile", err => {
      console.log("error with getting profile: " + err);
    });
    let firstname = await AsyncStorage.getItem("firstname", err => {
      console.log("error with getting firstname: " + err);
    });
    console.log(" get profile async: " + profileURL);
    console.log(" get first name async: " + firstname);
    this.setState({ profile: profileURL, firstname: firstname });
  };

  _signOutAsync = async () => {
    let access_token = await AsyncStorage.getItem("access_token", err => {
      console.log("error with getting access token: " + err);
    });
    await AsyncStorage.clear();

    try {
      let response = await fetch("https://www.strava.com/oauth/deauthorize", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          access_token: access_token
        })
      });
      console.log("request successful");
      let json = await response.json();
      console.log("extracted json from request");
      console.log(json);
    } catch (err) {
      console.log("error: " + err);
    }

    this.props.navigation.navigate("Auth");
    console.log("signing out and clearing async storage");
  };

  render() {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Settings Screen</Text>
        <Image
          style={{
            width: 125,
            height: 125,
            borderRadius: 25,
            shadowOffset: { width: 10, height: 10 },
            shadowColor: "grey",
            shadowOpacity: 0.8,
            margin: 5
          }}
          source={{
            uri: this.state.profile
              ? this.state.profile
              : "https://i.kym-cdn.com/photos/images/original/000/581/296/c09.jpg"
          }}
        />
        <Text> {this.state.firstname ? this.state.firstname : ""} </Text>

        <Button title="Sign Out" onPress={this._signOutAsync} />
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
    try {
      const access_token = await AsyncStorage.getItem("access_token");
      const profile = await AsyncStorage.getItem("profile");
      if (access_token !== null && profile !== null) {
        console.log("found access token: " + access_token);
        console.log("navigating to home screen");

        this.props.navigation.navigate("App");
      } else {
        console.log("no access token stored, navigating to signin screen");
        this.props.navigation.navigate("Auth");
      }
    } catch (err) {
      console.log("no access token stored, navigating to signin screen");
      this.props.navigation.navigate("Auth");
    }
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
      let authToken = result.params.code;
      console.log("auth token: " + authToken);

      try {
        let response = await fetch("https://www.strava.com/oauth/token", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            client_id: STRAVA_CLIENT_ID,
            client_secret: STRAVA_CLIENT_SECRET,
            code: authToken,
            grant_type: "authorization_code"
          })
        });
        console.log("request successful");
        let json = await response.json();
        console.log("extracted json from request");
        console.log(json);
        if (json.refresh_token !== null && json.refresh_token !== undefined) {
          console.log("before storing refresh_token: " + json.refresh_token);
          await AsyncStorage.setItem(
            "refresh_token",
            json.refresh_token,
            err => {
              console.log("error with refresh token store: " + err);
            }
          );
          console.log("stored refresh_token");
        }
        if (json.expires_at !== null && json.expires_at !== undefined) {
          console.log("before storing expiration: " + json.expires_at);
          await AsyncStorage.setItem("expires_at", json.expires_at, err => {
            console.log("error with  expiration store: " + err);
          });

          console.log("stored expiration");
        }

        await AsyncStorage.setItem("profile", json.athlete.profile, err => {
          console.log("error with profile store: " + err);
        });

        await AsyncStorage.setItem("firstname", json.athlete.firstname, err => {
          console.log("error with firstname store: " + err);
        });

        if (
          json.athlete !== undefined &&
          json.athlete !== null &&
          json.athlete.id !== undefined &&
          json.athlete.id !== null
        ) {
          let athlete_id = json.athlete.id;
          console.log("before storing athlete id: " + athlete_id);
          await AsyncStorage.setItem("athlete_id", "" + athlete_id, err => {
            console.log("error with athlete id store: " + err);
          });

          console.log("stored athlete id");
        }
        if (json.access_token !== null && json.access_token !== undefined) {
          console.log("before storing access token: " + json.access_token);
          await AsyncStorage.setItem("access_token", json.access_token, err => {
            console.log("error with access token store: " + err);
          });

          console.log("stored token info");
          this.props.navigation.navigate("App");
        } else {
          console.log("something went wrong");
        }
      } catch (err) {
        console.log("error: " + err);
      }
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
