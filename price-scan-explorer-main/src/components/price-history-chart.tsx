
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceHistoryPoint } from "@/types";

interface PriceHistoryChartProps {
  data: PriceHistoryPoint[];
}

export function PriceHistoryChart({ data }: PriceHistoryChartProps) {
  const [timeFrame, setTimeFrame] = useState<"1m" | "3m" | "6m" | "1y">("3m");
  
  const filteredData = (): PriceHistoryPoint[] => {
    const now = new Date();
    let monthsAgo: Date;
    
    switch (timeFrame) {
      case "1m":
        monthsAgo = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case "3m":
        monthsAgo = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case "6m":
        monthsAgo = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case "1y":
        monthsAgo = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
    }
    
    return data.filter(point => new Date(point.date) >= monthsAgo);
  };
  
  const lowestPrice = Math.min(...filteredData().map(d => d.price));
  const highestPrice = Math.max(...filteredData().map(d => d.price));
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };
  
  const chartMargin = { top: 20, right: 20, left: 0, bottom: 20 };
  
  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Price History</CardTitle>
          <div className="flex gap-1">
            {(["1m", "3m", "6m", "1y"] as const).map((period) => (
              <Button
                key={period}
                variant={timeFrame === period ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setTimeFrame(period)}
              >
                {period}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-2 text-sm flex justify-between text-muted-foreground">
          <span>Lowest: <span className="text-green-600 font-medium">{lowestPrice} ฿</span></span>
          <span>Highest: <span className="text-red-600 font-medium">{highestPrice} ฿</span></span>
        </div>
        
        <div className="h-64 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={filteredData()}
              margin={chartMargin}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis 
                domain={['dataMin - 5', 'dataMax + 5']}
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  borderRadius: "8px",
                  border: "1px solid #eaeaea",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                  padding: "8px 12px",
                }}
                labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                formatter={(value) => [`${value} ฿`, "Price"]}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ 
                  r: 3, 
                  strokeWidth: 2, 
                  fill: "white",
                  stroke: "hsl(var(--primary))"
                }}
                activeDot={{ 
                  r: 5, 
                  strokeWidth: 0,
                  fill: "hsl(var(--primary))"
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
