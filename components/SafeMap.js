import React, { Component } from 'react';
import { StyleSheet, Alert, View, TextInput } from 'react-native';
import { Location, Permissions, MapView } from 'expo';
import { Callout } from 'react-native-maps';

const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = 0.0421;
const SPACE = 0.01;

const styles = StyleSheet.create({
	map: {
		...StyleSheet.absoluteFillObject,
    },
    container: {
            ...StyleSheet.absoluteFillObject,
            justifyContent: 'flex-end',
            alignItems: 'center',
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


class SafeMap extends Component {

    constructor(props) {
        super(props);
        this.state = {
            region: {
                latitude: 43.128333, 
                longitude: -77.628333,
                latitudeDelta: LATITUDE_DELTA, 
                longitudeDelta: LONGITUDE_DELTA,
            },
            markers: [],
            errorMessage: null,
            watchId: null,
        }
    }

    componentDidMount() {
        this._getLocationAsync(); 
    }

   _updateLocation = async (location) => {
       this.setState({
         region: {
           latitude: location.coords.latitude,
           longitude: location.coords.longitude,
           latitudeDelta: LATITUDE_DELTA, 
           longitudeDelta: LONGITUDE_DELTA
         }
       });
       console.log(this.state.region);
   }

    _getLocationAsync = async () => {
        let permission = await Permissions.askAsync(Permissions.LOCATION)
            .catch((err) => { 
                console.log(err); 
            });
        console.log(permission);
        if (permission.status !== 'granted') {
            this.setState({
                errorMessage: 'Permission to access location was denied',
            });
        } else {
            this.state.watchId = await Location.watchPositionAsync({
                    enableHighAccuracy: true,
                    timeInterval: 1000,
                },
                currentLocation => {
                    this._updateLocation(currentLocation),
                    console.log('updating!')
                }
            ).catch((err) => {
                console.log(err);
            });
        }

        if (this.state.errorMessage !== null) {
            alert(this.state.errorMessage)
        }

        let location = await Location
			.getCurrentPositionAsync({ enableHighAccuracy: true }, 
				() => { 
					this.setState({ 
            		region: {
                		latitude: location.coords.latitude,
                		longitude: location.coords.longitude,
                		latitudeDelta: LATITUDE_DELTA, 
                		longitudeDelta: LONGITUDE_DELTA,
            		},
        		});
			})
            .catch((err) => {
                console.log(err);
            });
    }
    
    render() {
        return (
			<View style={styles.container}>
            <MapView style={styles.map} initialRegion={this.state.region}>
                <MapView.Marker
                    coordinate= {{
                        latitude: this.state.region.latitude,
                        longitude: this.state.region.longitude
                    }}
                />
            </ MapView>
  			<Callout>
          		<View style={styles.calloutView} >
                	<TextInput style={styles.calloutSearch}
						placeholder={"Search"}
 						onChangeText={(text) => console.log(text)}
                     />
				</View>
            </Callout>
			</View>
        );
    }
};

export default SafeMap;
