import React from 'react';
import { Color } from '@src/styles/colors';
import { Text } from 'react-native';
import { VStack } from '@components/CoreComponents';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { LineChart, lineDataItem } from 'react-native-gifted-charts';
import { MeasurementChartDataItem } from '@src/utils/chartsHelper';

export type MeasurementChartProps = {
  data: MeasurementChartDataItem[];
  onDataPointPress?: (measurementId: number) => void;
}

export const MeasurementChart = ({ data, onDataPointPress }: MeasurementChartProps) => {
  // Use per-point colors if available; fall back to the semantic measurement color
  const hasCustomColors = data.some(d => (d as any).dataPointColor);

  return (
    <LineChart
      data={data}
      thickness={3}
      width={300}
      height={240}
      maxValue={Math.max(...data.map(d => d.value)) * 1.1}
      noOfSections={5}
      isAnimated
      animationDuration={1200}
      showVerticalLines
      verticalLinesColor={Color.Gray.v100}
      rulesColor={Color.Gray.v100}
      xAxisLabelTextStyle={{
        color: Color.Gray.v400,
        fontSize: FontSize.bodysmall_14,
        fontFamily: FontFamily.medium
      }}
      yAxisTextStyle={{
        color: Color.Gray.v400,
        fontSize: FontSize.bodysmall_14,
        fontFamily: FontFamily.medium
      }}
      yAxisColor={Color.Gray.v200}
      xAxisColor={Color.Gray.v200}
      // Global fallback — overridden per-point by dataPointColor on each item
      dataPointsColor1={Color.Semantic.measurements}
      color={Color.Semantic.measurements}
      dataPointsHeight={10}
      dataPointsWidth={10}
      dataPointsRadius={5}
      textFontSize={FontSize.bodysmall_14}
      curved
      curvature={0.2}
      areaChart
      startFillColor={Color.Semantic.measurements}
      endFillColor={Color.Semantic.measurements}
      startOpacity={0.1}
      endOpacity={0.02}
      spacing={60}
      initialSpacing={20}
      endSpacing={20}
      pointerConfig={onDataPointPress ? {
        pointerStripUptoDataPoint: true,
        pointerStripColor: Color.Semantic.measurements,
        pointerStripWidth: 2,
        strokeDashArray: [2, 5],
        pointerColor: Color.Semantic.measurements,
        radius: 6,
        pointerLabelWidth: 100,
        pointerLabelHeight: 90,
        activatePointersOnLongPress: false,
        autoAdjustPointerLabelPosition: true,
        pointerLabelComponent: (items: any) => {
          const item = items[0];
          const dataPoint = data.find(d => d.value === item.value && d.label === item.label);
          if (dataPoint?.measurementId) {
            setTimeout(() => onDataPointPress(dataPoint.measurementId!), 100);
          }
          return null;
        },
      } : undefined}
    />
  );
};


export type MeasurementChartProps = {
  data: MeasurementChartDataItem[];
  onDataPointPress?: (measurementId: number) => void;
}

export const MeasurementChart = ({ data, onDataPointPress }: MeasurementChartProps) => {
  return (
    <LineChart
      data={data}
      thickness={3}
      width={300}
      height={240}
      maxValue={Math.max(...data.map(d => d.value)) * 1.1}
      noOfSections={5}
      isAnimated
      animationDuration={1200}
      showVerticalLines
      verticalLinesColor={Color.Gray.v100}
      rulesColor={Color.Gray.v100}
      xAxisLabelTextStyle={{
        color: Color.Gray.v400,
        fontSize: FontSize.bodysmall_14,
        fontFamily: FontFamily.medium
      }}
      yAxisTextStyle={{
        color: Color.Gray.v400,
        fontSize: FontSize.bodysmall_14,
        fontFamily: FontFamily.medium
      }}
      yAxisColor={Color.Gray.v200}
      xAxisColor={Color.Gray.v200}
      dataPointsColor1={Color.Semantic.measurements}
      color={Color.Semantic.measurements}
      dataPointsHeight={8}
      dataPointsWidth={8}
      dataPointsRadius={4}
      textFontSize={FontSize.bodysmall_14}
      curved
      curvature={0.2}
      areaChart
      startFillColor={Color.Semantic.measurements}
      endFillColor={Color.Semantic.measurements}
      startOpacity={0.1}
      endOpacity={0.02}
      spacing={60}
      initialSpacing={20}
      endSpacing={20}
      pointerConfig={onDataPointPress ? {
        pointerStripUptoDataPoint: true,
        pointerStripColor: Color.Semantic.measurements,
        pointerStripWidth: 2,
        strokeDashArray: [2, 5],
        pointerColor: Color.Semantic.measurements,
        radius: 6,
        pointerLabelWidth: 100,
        pointerLabelHeight: 90,
        activatePointersOnLongPress: false,
        autoAdjustPointerLabelPosition: true,
        pointerLabelComponent: (items: any) => {
          const item = items[0];
          const dataPoint = data.find(d => d.value === item.value && d.label === item.label);
          if (dataPoint?.measurementId) {
            setTimeout(() => onDataPointPress(dataPoint.measurementId!), 100);
          }
          return null;
        },
      } : undefined}
    />
  );
};
