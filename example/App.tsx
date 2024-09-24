import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { isBleEnabled as sdkIsBleEnabled } from "@animo-id/react-native-ble-didcomm";
import { useEffect, useState } from "react";

export const App = () => {
  const [isBleEnabled, setIsBleEnabled] = useState(false);

  useEffect(() => {
    sdkIsBleEnabled()
      .then(setIsBleEnabled)
      .catch((e) => {
        setIsBleEnabled(false);
        console.error(e);
      });
  }, [sdkIsBleEnabled]);

  return (
    <View style={styles.container}>
      <Text> BLE STATUS: {isBleEnabled ? "ON" : "OFF"} </Text>
      <StatusBar style="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
