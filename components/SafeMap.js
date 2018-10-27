import React, { Component } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { Location, Permissions, MapView} from 'expo';


const LATITUDE_DELTA = 0.001;
const LONGITUDE_DELTA = 0.001;

class SafeMap extends React.Component {

    state = {
        region: {
            latitude: 43.128333, 
            longitude: -77.628333,
            latitudeDelta: LATITUDE_DELTA, 
            longitudeDelta: LONGITUDE_DELTA 
        },
        errorMessage: null,
    }

    onComponentDidMount() {
       this._getLocationAsync(); 
    }

    _getLocationAsync = async () => {
        let status = await Permissions.askAsync(Permissions.LOCATION);

        if (status != 'granted') {
            this.setState({
                errorMessage: 'Permission to access location was denied',
            });
        }

        let location = await Location.getCurrentPositionAsync({});
        let region = null;
        this.setState({ region });
    }
    
    render() {
        return (
        <View style={styles.container}>
            <MapView
                provider={this.props.provider}
                style={styles.map}
                initialRegion={this.state.region}
                onPress={this.onMapPress}
            />
        </View>
    )}
};
