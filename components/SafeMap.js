import React, { Component } from "react";
import { StyleSheet, Alert, View, TextInput } from "react-native";
import {
  Location,
  Permissions,
  MapView,
  SQLite,
  FileSystem,
  Asset
} from "expo";
import { Callout } from "react-native-maps";

const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = 0.0421;
const SPACE = 0.01;

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center"
  },
  calloutView: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 10,
    width: "40%",
    marginLeft: "30%",
    marginRight: "30%",
    marginTop: 20
  },
  calloutSearch: {
    borderColor: "transparent",
    marginLeft: 10,
    width: "90%",
    marginRight: 10,
    height: 40,
    borderWidth: 0.0
  }
});

//const pins =
function errorCB(err) {
  console.log("SQL Error: " + err);
}

function successCB() {
  console.log("SQL executed fine");
}

function openCB() {
  console.log("Database OPENED");
}

var DB = null;

function getPinColor(offense) {
  if (offense.includes("2")) {
    return "#FFA500";
  }

  if (offense.includes("3")) {
    return "#FF0000";
  }

  return "#ffff00";
}

class SafeMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      region: {
        latitude: 43.128333,
        longitude: -77.628333,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA
      },
      markers: [],
      errorMessage: null,
      watchId: null
    };

    this._loadDBAsync();
    this._getLocationAsync();
    this._getStravaDataAsync();
  }

  componentDidMount() {}

  _getStravaDataAsync = async () => {
    try {
      let response = await fetch(
        `https://www.strava.com/api/v3/athlete&access_token=${
          this.props.tokenInfo.access_token
        }`
      );
      let responseJson = await response.json();
      console.log("strava athlete data");
      console.log(responseJson);
    } catch (error) {
      console.error(error);
    }
  };

  _loadDBAsync = async () => {
    await FileSystem.downloadAsync(
      Asset.fromModule(require("../assets/db/Rnnr.db.sqlite")).uri,
      `${FileSystem.documentDirectory}Rnnr.db.sqlite`
    );

    DB = SQLite.openDatabase(
      "Rnnr.db.sqlite",
      "3.0",
      "Rnnr Database",
      200000,
      openCB,
      errorCB
    );
    await this._queryAsync();
  };

  _queryAsync = async () => {
    DB.transaction(
      (tx, results) => {
        tx.executeSql(
          "SELECT lat, lon, offense FROM offenders  WHERE lat IS NOT NULL",
          [],
          (tx, results) => {
            // Get rows with Web SQL Database spec compliance.

            var len = results.rows.length;
            var coordinates = [];
            for (let i = 0; i < len; i++) {
              let row = results.rows.item(i);
              if (row.lat !== null) {
                coordinates.push({
                  key: i + 1,
                  pinColor: getPinColor(row.offense),
                  offense: row.offense,
                  coordinate: { latitude: row.lat, longitude: row.lon }
                });
              }
            }
            let user_loc = {
              latitude: this.state.region.latitude,
              longitude: this.state.region.longitude
            };

            coordinates.push({
              key: 0,
              pinColor: "#0000ff",
              coordinate: user_loc
            });
            this.setState({ markers: coordinates });
          },
          err => {
            console.log(err);
          }
        );
      },
      err => {
        console.log("error: " + err);
      },
      () => {
        console.log("success");
      }
    );
  };

  _updateLocation = async location => {
    this.setState({
      region: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA
      }
    });
  };

  _getLocationAsync = async () => {
    let permission = await Permissions.askAsync(Permissions.LOCATION).catch(
      err => {
        console.log(err);
      }
    );
    console.log(permission);
    if (permission.status !== "granted") {
      this.setState({
        errorMessage: "Permission to access location was denied"
      });
    } else {
      this.state.watchId = await Location.watchPositionAsync(
        {
          enableHighAccuracy: true,
          timeInterval: 1000
        },
        currentLocation => {
          this._updateLocation(currentLocation), console.log("updating!");
        }
      ).catch(err => {
        console.log(err);
      });
    }

    if (this.state.errorMessage !== null) {
      alert(this.state.errorMessage);
    }

    let location = await Location.getCurrentPositionAsync(
      { enableHighAccuracy: true },
      () => {
        this.setState({
          region: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA
          }
        });
      }
    ).catch(err => {
      console.log(err);
    });
  };

  render() {
    return (
      <View style={styles.container}>
        <MapView style={styles.map} initialRegion={this.state.region}>
          {this.state.markers.map(marker => (
            <MapView.Marker
              coordinate={marker.coordinate}
              pinColor={marker.pinColor}
              key={marker.key}
              description={marker.offense}
            />
          ))}
        </MapView>
      </View>
    );
  }
}

export default SafeMap;

//select lat, lon from offenders where city == Bronx
// success function callback, takes transaction and result set object
