import { getRatingStyles } from "@/helpers/getRatingStyles";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMediaQuery } from "react-responsive";

interface DistributionChartProps {
  data: { rating: string; count: number }[];
  resource: "albums" | "tracks" | "artists";
}

const DistributionChart = ({ data, resource = "albums" }: DistributionChartProps) => {
  const isSmall = useMediaQuery({ query: "(max-width: 640px)" });
  const isUltrawide = useMediaQuery({ query: "(min-width: 120.5rem)" });

  const chartHeight = isUltrawide ? 400 : 250;
  const tickFontSize = isUltrawide ? 14 : 11;
  const tickBoxWidth = isUltrawide ? 65 : 50;
  const tickBoxHeight = isUltrawide ? 24 : 18;

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 20, left: 20, bottom: 5 }}
        barCategoryGap="10%"
      >
        <CartesianGrid strokeDasharray="1 6" />
        <XAxis
          dataKey="rating"
          tick={({ x, y, payload }) => {
            const tier = getRatingStyles(payload.value);
            const label = payload.value;
            const boxWidth = tickBoxWidth;
            const boxHeight = tickBoxHeight;

            return (
              <g transform={`translate(${x}, ${(y as number) + 10})`}>
                <rect
                  x={-boxWidth / 2}
                  y={-boxHeight / 2}
                  width={boxWidth}
                  height={boxHeight}
                  fill={tier.backgroundColorLighterHex}
                  fillOpacity={0.2}
                  stroke={tier.backgroundColorHex}
                  strokeWidth={1.5}
                  rx={4}
                />
                <text
                  dy="0.35em"
                  fill={tier.backgroundColorHex}
                  fontSize={tickFontSize}
                  textAnchor="middle"
                >
                  {label}
                </text>
              </g>
            );
          }}
          axisLine={false}
          tickLine={false}
          height={30}
          hide={isSmall}
        />

        <YAxis tick={{ fill: "#d4d4d8", fontSize: 12 }} width={20} axisLine={false} />
        <Tooltip
          content={props => <CustomTooltip {...props} resource={resource} />}
          cursor={<CustomCursor />}
        />
        <Bar
          dataKey="count"
          isAnimationActive={true}
          animationDuration={800}
          animationEasing="ease-out"
        >
          {data?.map((entry, index) => {
            const tier = getRatingStyles(entry.rating);
            return (
              <Cell
                key={`bar-${index}`}
                fill={tier.backgroundColorHex}
                style={{
                  transition: "fill 0.3s ease",
                }}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DistributionChart;

interface ChartData {
  rating: string;
  count: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{
    payload: ChartData;
    value: number;
    dataKey: string;
  }>;
  label?: string | number;
  resource: "albums" | "tracks" | "artists";
}

const CustomTooltip = ({ active, payload, label, resource }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="rounded-lg px-4 py-3 border border-white/20 shadow-lg text-white backdrop-blur-sm bg-linear-to-b from-neutral-900/80 via-neutral-900/50 to-neutral-900/20">
        <h3
          style={{ color: getRatingStyles(label).backgroundColorHex }}
          className="font-semibold text-white mb-2"
        >
          {label}
        </h3>
        <div className="space-y-1">
          <p className="text-neutral-100">
            <span className="font-medium text-white">
              {resource.charAt(0).toUpperCase() + resource.slice(1)}:
            </span>{" "}
            {data.count.toLocaleString()}
          </p>
        </div>
      </div>
    );
  }

  return null;
};

interface CustomCursorProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: Array<{
    payload: ChartData;
  }>;
}

const CustomCursor = ({ x, y, width, height, payload }: CustomCursorProps) => {
  if (!x || !y || !width || !height) return null;
  const rating = payload?.[0]?.payload?.rating;
  const tier = getRatingStyles(rating);

  return (
    <g>
      {/* Main cursor rectangle with gradient */}
      <defs>
        <linearGradient id={`cursor-gradient-${rating}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={tier.backgroundColorHex} stopOpacity={0.3} />
          <stop offset="100%" stopColor={tier.backgroundColorHex} stopOpacity={0.1} />
        </linearGradient>
      </defs>

      {/* Background rectangle */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={`url(#cursor-gradient-${rating})`}
        stroke={tier.backgroundColorHex}
        strokeWidth={2}
        strokeOpacity={0.6}
        rx={4}
      />

      {/* Top border highlight */}
      <rect
        x={x}
        y={y}
        width={width}
        height={3}
        fill={tier.backgroundColorHex}
        opacity={0.8}
        rx={4}
      />

      {/* Side indicators */}
      <rect
        x={x - 2}
        y={y}
        width={2}
        height={height}
        fill={tier.backgroundColorHex}
        opacity={0.9}
      />
      <rect
        x={x + width}
        y={y}
        width={2}
        height={height}
        fill={tier.backgroundColorHex}
        opacity={0.9}
      />
    </g>
  );
};
