import { useMemo, useState } from 'react';
import { Box, Paper, Typography, IconButton } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Pie, Doughnut, Bar, Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ChartDataLabels
);

export interface ChartDataItem {
  label: string;
  value: number;
  drillDown?: ChartDataItem[];
}

interface ChartProps {
  type: 'pie' | 'doughnut' | 'bar' | 'line';
  title?: string;
  chartData: ChartDataItem[];
}

export function Chart({ type, title, chartData }: ChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('root');
  const isDrillDown = selectedCategory !== 'root';

  const currentData = useMemo(() => {
    if (selectedCategory === 'root') {
      return {
        labels: chartData.map((item) => item.label),
        datasets: [
          {
            data: chartData.map((item) => item.value),
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40',
            ],
          },
        ],
      };
    }

    const selectedItem = chartData.find((item) => item.label === selectedCategory);
    if (!selectedItem?.drillDown) {
      return null;
    }

    return {
      labels: selectedItem.drillDown.map((item) => item.label),
      datasets: [
        {
          data: selectedItem.drillDown.map((item) => item.value),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40',
          ],
        },
      ],
    };
  }, [chartData, selectedCategory]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'right' as const,
        labels: {
          color: '#166a8f',
          font: { size: 14 },
        },
        onClick: (_e: unknown, legendItem: { text: string }) => {
          if (!isDrillDown) {
            setSelectedCategory(legendItem.text);
          }
        },
      },
      datalabels: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (value: number, ctx: any) => {
          const total = (ctx.chart.data.datasets[0].data as number[]).reduce(
            (a: number, b: number) => a + b,
            0
          );
          const percentage = (value / total) * 100;
          return `${percentage.toFixed(1)}%`;
        },
        color: 'white',
        font: { size: 14 },
      },
    },
    onClick: (_event: unknown, elements: { index: number }[]) => {
      if (elements.length > 0 && !isDrillDown && currentData) {
        const index = elements[0].index;
        const label = currentData.labels[index];
        const item = chartData.find((d) => d.label === label);
        if (item?.drillDown) {
          setSelectedCategory(label);
        }
      }
    },
  };

  const ChartComponent = useMemo(() => {
    switch (type) {
      case 'pie':
        return Pie;
      case 'doughnut':
        return Doughnut;
      case 'bar':
        return Bar;
      case 'line':
        return Line;
      default:
        return Pie;
    }
  }, [type]);

  if (!currentData) {
    return null;
  }

  return (
    <Paper
      sx={{
        p: 2.5,
        borderRadius: 2,
        maxWidth: 800,
        mx: 'auto',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h6">{title}</Typography>
          {isDrillDown && (
            <Typography variant="subtitle2" color="text.secondary">
              {selectedCategory}
            </Typography>
          )}
        </Box>
        <Box>
          <IconButton size="small">
            <DownloadIcon />
          </IconButton>
          <IconButton size="small">
            <ShareIcon />
          </IconButton>
        </Box>
      </Box>

      <Box>
        {isDrillDown && (
          <IconButton size="small" onClick={() => setSelectedCategory('root')} sx={{ mb: 1 }}>
            <ArrowBackIcon />
          </IconButton>
        )}
        <ChartComponent data={currentData} options={chartOptions} />
      </Box>
    </Paper>
  );
}
