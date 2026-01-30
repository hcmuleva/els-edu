import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ArrowUpRight, ArrowRight } from "lucide-react";

export default function TrendAnalysis({ trendData }) {
  if (!trendData || trendData.length === 0) return null;

  const first = trendData[0];
  const last = trendData[trendData.length - 1];

  const getDelta = (field) => (last[field] - first[field]).toFixed(1);

  const cards = [
    {
      key: "development",
      label: "Development",
      color: "text-blue-600",
    },
    {
      key: "testing",
      label: "Testing",
      color: "text-emerald-600",
    },
    {
      key: "devops",
      label: "DevOps",
      color: "text-orange-600",
    },
    {
      key: "agentic-ai",
      label: "Agentic AI",
      color: "text-pink-600",
    },
    {
      key: "mobile-app",
      label: "Mobile App",
      color: "text-indigo-600",
    },
    {
      key: "overallScore",
      label: "Overall",
      color: "text-purple-600",
    },
  ];

  const formatLabel = (d) => d.label;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            📈 Progress Trend – Last 2 Months
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Before joining ELS vs. current performance across all categories.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-full px-3 py-1">
          <span className="font-semibold">Timeframe:</span>
          <span>{first.label}</span>
          <ArrowRight className="w-3 h-3" />
          <span>{last.label}</span>
        </div>
      </div>

      {/* Line chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trendData}
            margin={{ top: 10, right: 30, left: 0, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timeframe"
              tickFormatter={(_, index) => formatLabel(trendData[index])}
              tick={{ fontSize: 12 }}
            />
            <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => value.toFixed(1)}
              labelFormatter={(timeframe, payload) =>
                formatLabel(payload[0]?.payload || { label: timeframe })
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="development"
              name="Development"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="testing"
              name="Testing"
              stroke="#059669"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="devops"
              name="DevOps"
              stroke="#ea580c"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="agentic-ai"
              name="Agentic AI"
              stroke="#ec4899"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="mobile-app"
              name="Mobile App"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="overallScore"
              name="Overall"
              stroke="#7c3aed"
              strokeWidth={2}
              strokeDasharray="4 2"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Improvement indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card) => {
          const delta = parseFloat(getDelta(card.key));
          const improved = delta > 0;
          return (
            <div
              key={card.key}
              className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex flex-col gap-1"
            >
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {card.label}
              </p>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${card.color}`}>
                  {last[card.key].toFixed(1)}
                </span>
                <span className="text-xs text-gray-500">
                  from {first[card.key].toFixed(1)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs mt-1">
                {improved ? (
                  <>
                    <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">
                      +{delta.toFixed(1)} pts improvement
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500">No change</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


