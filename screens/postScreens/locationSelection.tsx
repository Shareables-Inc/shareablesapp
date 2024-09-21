import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import Colors from '../../utils/colors'

const LocationSelectionScreen = () => {
  return (
    <View style={styles.container}>
      <Text>locationSelection</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default LocationSelectionScreen



