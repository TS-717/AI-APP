import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function IncomeChart() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="lg:col-span-2 bg-card p-6 rounded-lg border border-border shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-48 mb-6"></div>
          <div className="h-80 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const monthlyIncome = dashboardData?.monthlyIncome || [];
  const labels = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Monthly Income',
        data: monthlyIncome,
        borderColor: 'hsl(214, 100%, 35%)',
        backgroundColor: 'hsla(214, 100%, 35%, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'hsl(214, 100%, 35%)',
        pointBorderColor: 'hsl(214, 100%, 35%)',
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        callbacks: {
          label: function(context: any) {
            return `Income: ₹${(context.parsed.y / 1000).toFixed(0)}K`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'hsl(214.3, 31.8%, 91.4%)',
        },
        ticks: {
          color: 'hsl(215.4, 16.3%, 46.9%)',
          callback: function(value: any) {
            return '₹' + (value / 1000) + 'K';
          }
        }
      },
      x: {
        grid: {
          color: 'hsl(214.3, 31.8%, 91.4%)',
        },
        ticks: {
          color: 'hsl(215.4, 16.3%, 46.9%)',
        }
      }
    }
  };

  return (
    <div className="lg:col-span-2 bg-card p-6 rounded-lg border border-border shadow-sm" data-testid="income-chart-container">
      <CardHeader className="p-0 mb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Monthly Income Trends</CardTitle>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md"
              data-testid="button-income-view"
            >
              Income
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              className="px-3 py-1 text-sm text-muted-foreground hover:bg-muted rounded-md"
              data-testid="button-tax-view"
            >
              Tax
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-80" data-testid="chart-income-trends">
          <Line data={chartData} options={options} />
        </div>
      </CardContent>
    </div>
  );
}
