import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

const WebViewMap = ({ 
  initialLocation = { latitude: 33.6844, longitude: 73.0479 }, 
  onLocationSelect,
  markers = [],
  showUserLocation = true,
  height = 400,
  zoomLevel = 10,
  style
}) => {
  const webviewRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const generateMapHTML = () => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Map</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            body { 
                margin: 0; 
                padding: 0; 
                font-family: Arial, sans-serif;
            }
            #map { 
                height: 100vh; 
                width: 100vw; 
            }
            .loading {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background: #f0f0f0;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div id="loading" class="loading">Loading Map...</div>
        <div id="map" style="display: none;"></div>
        
        <script>
            let map;
            let userMarker;
            let markers = [];
            
            function initMap() {
                try {
                    // Hide loading, show map
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('map').style.display = 'block';
                    
                    // Initialize map
                    map = L.map('map').setView([${initialLocation.latitude}, ${initialLocation.longitude}], ${zoomLevel});
                    
                    // Add tile layer (OpenStreetMap)
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap contributors',
                        maxZoom: 19
                    }).addTo(map);
                    
                    // Add click handler for location selection
                    map.on('click', function(e) {
                        const lat = e.latlng.lat;
                        const lng = e.latlng.lng;
                        
                        // Remove previous user marker
                        if (userMarker) {
                            map.removeLayer(userMarker);
                        }
                        
                        // Add new marker
                        userMarker = L.marker([lat, lng], {
                            icon: L.icon({
                                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                                iconSize: [25, 41],
                                iconAnchor: [12, 41],
                                popupAnchor: [1, -34],
                                shadowSize: [41, 41]
                            })
                        }).addTo(map);
                        
                        // Notify React Native
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'locationSelected',
                            latitude: lat,
                            longitude: lng
                        }));
                    });
                    
                    // Add existing markers
                    addMarkers(${JSON.stringify(markers)});
                    
                    // Notify React Native that map is ready
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'mapReady'
                    }));
                    
                } catch (error) {
                    console.error('Map initialization error:', error);
                    document.getElementById('loading').innerHTML = 'Map loading failed. Please check your internet connection.';
                }
            }
            
            function addMarkers(markersData) {
                markersData.forEach(markerData => {
                    if (markerData.latitude && markerData.longitude) {
                        const marker = L.marker([markerData.latitude, markerData.longitude])
                            .addTo(map);
                        
                        if (markerData.title || markerData.description) {
                            marker.bindPopup(
                                '<strong>' + (markerData.title || 'Location') + '</strong><br>' +
                                (markerData.description || '')
                            );
                        }
                        
                        markers.push(marker);
                    }
                });
            }
            
            function updateLocation(lat, lng, zoom = ${zoomLevel}) {
                if (map) {
                    map.setView([lat, lng], zoom);
                    
                    // Remove previous user marker
                    if (userMarker) {
                        map.removeLayer(userMarker);
                    }
                    
                    // Add new marker
                    userMarker = L.marker([lat, lng], {
                        icon: L.icon({
                            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                            popupAnchor: [1, -34],
                            shadowSize: [41, 41]
                        })
                    }).addTo(map);
                }
            }
            
            // Initialize map when page loads
            document.addEventListener('DOMContentLoaded', initMap);
            
            // Handle messages from React Native
            document.addEventListener('message', function(event) {
                const data = JSON.parse(event.data);
                
                switch(data.type) {
                    case 'updateLocation':
                        updateLocation(data.latitude, data.longitude, data.zoom);
                        break;
                    case 'addMarkers':
                        addMarkers(data.markers);
                        break;
                }
            });
        </script>
    </body>
    </html>
    `;
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'mapReady':
          setIsMapReady(true);
          console.log('WebView Map is ready');
          break;
        case 'locationSelected':
          if (onLocationSelect) {
            onLocationSelect({
              latitude: data.latitude,
              longitude: data.longitude
            });
          }
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const updateLocation = (latitude, longitude, zoom = zoomLevel) => {
    if (webviewRef.current && isMapReady) {
      const message = JSON.stringify({
        type: 'updateLocation',
        latitude,
        longitude,
        zoom
      });
      
      webviewRef.current.postMessage(message);
    }
  };

  const addMarkers = (newMarkers) => {
    if (webviewRef.current && isMapReady) {
      const message = JSON.stringify({
        type: 'addMarkers',
        markers: newMarkers
      });
      
      webviewRef.current.postMessage(message);
    }
  };

  useEffect(() => {
    if (isMapReady && markers.length > 0) {
      addMarkers(markers);
    }
  }, [isMapReady, markers]);

  return (
    <View style={[styles.container, { height }, style]}>
      <WebView
        ref={webviewRef}
        source={{ html: generateMapHTML() }}
        style={styles.webview}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error: ', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView HTTP error: ', nativeEvent);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
});

export default WebViewMap;
