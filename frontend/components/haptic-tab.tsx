import React from "react";
import { TouchableOpacity } from "react-native";

// Accept any props so this component can be used as a custom tabBarButton
// for different navigator implementations without strict prop mismatches.
export const HapticTab: React.FC<any> = ({ children, ...rest }) => {
  return (
    <TouchableOpacity {...rest} activeOpacity={0.8}>
      {children}
    </TouchableOpacity>
  );
};

export default HapticTab;
