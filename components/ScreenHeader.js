import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Link } from "expo-router";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { AppText as Text } from "./AppText";
import { commonStyles } from "../styles/commonStyles";

export default function ScreenHeader({
  title,
  count,
  onBack,
  backHref,
  rightAccessory,
}) {
  const backButton = (
    <Pressable onPress={onBack} style={styles.backButton}>
      <FontAwesome5 name="arrow-left" size={20} color="#192f6a" />
    </Pressable>
  );

  return (
    <View style={[commonStyles.gradienteContainer, styles.container]}>
      {backHref ? (
        <Link href={backHref} asChild>
          {backButton}
        </Link>
      ) : onBack ? (
        backButton
      ) : null}
      <View style={styles.identity}>
        <Link href="/Principal" asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Ir a Principal"
          >
            <Image
              source={require("../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Pressable>
        </Link>
        <View style={styles.textBlock}>
          <View style={styles.row}>
            <Text style={styles.leftText}>ENCODIGO</Text>
            <Text style={styles.rightText}>PRECONS III</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.leftText} numberOfLines={1} ellipsizeMode="tail">
              {title}
            </Text>
            <Text style={styles.rightText} numberOfLines={1}>
              {count ?? ""}
            </Text>
          </View>
        </View>
      </View>
      {rightAccessory}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backButton: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  identity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  logo: {
    width: 50,
    height: 50,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  leftText: {
    flexShrink: 1,
    color: "#192f6a",
    fontWeight: "bold",
    textAlign: "left",
  },
  rightText: {
    marginLeft: 8,
    color: "#192f6a",
    textAlign: "right",
  },
});
