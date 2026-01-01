// Hooks
import { useApptheme } from "@/lib/context/global/theme.context";

// Noyau
import { SafeAreaView } from "react-native";

// Composants
import EarningsMain from "../../screen-components/earnings/view/main";

export default function EarningsScreen() {
  // Hooks
  const { appTheme } = useApptheme();
  return (
    <SafeAreaView style={{ backgroundColor: appTheme.screenBackground }}>
      <EarningsMain />
    </SafeAreaView>
  );
}
