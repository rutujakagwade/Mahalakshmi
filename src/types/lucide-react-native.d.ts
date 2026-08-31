// Type declarations for lucide-react-native icons that are exported at runtime
// but TypeScript can't resolve due to the 158K-character export line in the d.ts
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import type { SvgProps } from 'react-native-svg';

interface LucideProps extends SvgProps {
  size?: string | number;
  absoluteStrokeWidth?: boolean;
}

type LucideIcon = ForwardRefExoticComponent<LucideProps & RefAttributes<SVGSVGElement>>;

declare module 'lucide-react-native' {
  export const IndianRupee: LucideIcon;
  export const HardHat: LucideIcon;
  export const Warehouse: LucideIcon;
  export const List: LucideIcon;
  export const Building: LucideIcon;
  export const Building2: LucideIcon;
  export const ClipboardList: LucideIcon;
  export const FilePlus: LucideIcon;
  export const CircleUser: LucideIcon;
  export const Briefcase: LucideIcon;
  export const UserRound: LucideIcon;
  export const WalletCards: LucideIcon;
  export const WalletMinimal: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Home: LucideIcon;
  export const StickyNote: LucideIcon;
  export const Phone: LucideIcon;
}
