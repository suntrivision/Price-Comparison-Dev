
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "@/types";
import { calculateDiscount } from "@/lib/utils";

interface ProductDiscountChartProps {
  productId: string;
  productName: string;
}

// Mock data generator for product discount history
const generateDiscountHistory = (productId: string) => {
  const now = new Date();
  const history = [];
  
  // Generate 30 days of mock data
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate realistic discount variations based on product ID
    const baseDiscount = parseInt(productId.slice(-2), 16) % 40; // 0-40% base
    const variation = Math.sin(i * 0.2) * 10; // Seasonal variation
    const randomness = (Math.random() - 0.5) * 5; // Small random changes
    
    const discount = Math.max(0, Math.min(60, baseDiscount + variation + randomness));
    
    history.push({
      date: date.toISOString().split('T')[0],
      discount: Math.round(discount * 10) / 10
    });
  }
  
  return history;
};

export function ProductDiscountChart({ productId, productName }: ProductDiscountChartProps) {
  const discountHistory = generateDiscountHistory(productId);
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };
  
  const maxDiscount = Math.max(...discountHistory.map(d => d.discount));
  const currentDiscount = discountHistory[discountHistory.length - 1]?.discount || 0;
  
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Discount Magnitude Over Time</CardTitle>
        <div className="text-xs text-muted-foreground">
          Current: <span className="text-primary font-medium">{currentDiscount}%</span> | 
          Peak: <span className="text-green-600 font-medium">{maxDiscount}%</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-32 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={discountHistory}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#888888"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[0, 'dataMax + 5']}
                stroke="#888888"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                width={25}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  padding: "6px 8px",
                  fontSize: "12px"
                }}
                labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                formatter={(value) => [`${value}%`, "Discount"]}
              />
              <Line 
                type="monotone" 
                dataKey="discount" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={false}
                activeDot={{ 
                  r: 3, 
                  strokeWidth: 0,
                  fill: "#ef4444"
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
