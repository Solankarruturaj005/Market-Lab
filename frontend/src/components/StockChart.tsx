import {
LineChart,
Line,
XAxis,
YAxis,
Tooltip,
CartesianGrid,
ResponsiveContainer
} from 'recharts';

interface Props {
data: any[];
}

export default function StockChart({ data }: Props) {
return (
    <div className="w-full h-[400px]">
    <ResponsiveContainer>
        <LineChart data={data}>
        <CartesianGrid stroke="#000000" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line
            type="monotone"
            dataKey="close"
            stroke="#6b65d1"
            strokeWidth={2}
        />
        </LineChart>
    </ResponsiveContainer>
    </div>
);
}