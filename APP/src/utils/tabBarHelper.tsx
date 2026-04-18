import { Color } from "@src/styles/colors";
import { View, Text } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { FontAwesome6 } from '@expo/vector-icons';

const focusedColor = Color.Cyan.v400;
const unfocusedColor = Color.gray1;

type TabBarIconProps = {
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  focused: boolean;
};

type MaterialTabBarIconProps = {
  iconName: keyof typeof MaterialIcons.glyphMap;
  focused: boolean;
};

type TabBarLabelProps = {
  name: string;
  focused: boolean;
};

export const TabBarIcon: React.FC<TabBarIconProps> = ({ Icon, focused }) => {
  return (
    <View>
      <Icon width={25} height={25} fill={focused ? focusedColor : unfocusedColor} />
    </View>
  );
};

export const MaterialTabBarIcon: React.FC<MaterialTabBarIconProps> = ({ iconName, focused }) => {
  return (
    <View>
      <MaterialIcons name={iconName} size={25} color={focused ? focusedColor : unfocusedColor} />
    </View>
  );
};

export const TabBarLabel: React.FC<TabBarLabelProps> = ({ name, focused }) => {
  return (
    <Text style={{
      color: focused ? focusedColor : unfocusedColor,
      fontSize: 10
    }}>
      {name}
    </Text>
  );
};