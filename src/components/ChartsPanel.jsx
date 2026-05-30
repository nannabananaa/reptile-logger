import { memo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { tempUnitLabel, weightUnitLabel } from '../utils/storage';

const CHART_COLORS = {
  temperature: '#c4a44a',
  humidity: '#5b9a6b',
  weight: '#a67c52',
};

// Memoized so the parent re-rendering (modals, tab switches) doesn't force
// recharts to recompute its SVG.
const ChartCard = memo(function ChartCard({ title, dataKey, color, data, unit, convertFn }) {
  const filtered = data.filter((d) => d[dataKey] != null).map((d) => convertFn ? { ...d, [dataKey]: convertFn(d[dataKey]) } : d);
  if (filtered.length < 2) {
    return (
      <div className="chart-card">
        <h4 className="chart-title">{title}</h4>
        <p className="chart-nodata">Not enough data</p>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <h4 className="chart-title">{title}</h4>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={filtered} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#a8a090', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              minTickGap={24}
            />
            <YAxis
              tick={{ fill: '#a8a090', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={45}
            />
            <Tooltip
              contentStyle={{
                background: '#1a2e1a',
                border: '1px solid #2a4a2e',
                borderRadius: 10,
                fontSize: 13,
                color: '#e8e4dc',
              }}
              formatter={(value) => [`${value}${unit}`, title.split(' ')[0]]}
              labelStyle={{ color: '#a8a090' }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2.5}
              dot={{ fill: color, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: color, stroke: '#121a12', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default function ChartsPanel({ data }) {
  return (
    <>
      <ChartCard
        title={`Temperature (${tempUnitLabel()})`}
        dataKey="temperature"
        color={CHART_COLORS.temperature}
        data={data}
        unit={tempUnitLabel()}
        convertFn={tempUnitLabel() === '°C' ? (v) => Math.round(((v - 32) * 5 / 9) * 10) / 10 : null}
      />
      <ChartCard
        title="Humidity (%)"
        dataKey="humidity"
        color={CHART_COLORS.humidity}
        data={data}
        unit="%"
      />
      <ChartCard
        title={`Weight (${weightUnitLabel()})`}
        dataKey="weight"
        color={CHART_COLORS.weight}
        data={data}
        unit={weightUnitLabel()}
        convertFn={weightUnitLabel() === 'oz' ? (v) => Math.round((v / 28.3495) * 100) / 100 : null}
      />
    </>
  );
}
