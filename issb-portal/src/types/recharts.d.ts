// Type declarations to fix recharts compatibility with React 18+
// This resolves JSX component type incompatibilities
declare module 'recharts' {
  import { ComponentType, ReactElement } from 'react';

  // Export all original types
  export * from 'recharts/types';

  // Override problematic component types to be compatible with React 18
  export const ResponsiveContainer: ComponentType<any>;
  export const LineChart: ComponentType<any>;
  export const BarChart: ComponentType<any>;
  export const PieChart: ComponentType<any>;
  export const XAxis: ComponentType<any>;
  export const YAxis: ComponentType<any>;
  export const CartesianGrid: ComponentType<any>;
  export const Tooltip: ComponentType<any>;
  export const Legend: ComponentType<any>;
  export const Line: ComponentType<any>;
  export const Bar: ComponentType<any>;
  export const Pie: ComponentType<any>;
  export const Cell: ComponentType<any>;
}
