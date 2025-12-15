import React from 'react';
import { useListContext } from 'react-admin';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { Users, UserCheck, UserX, Shield } from 'lucide-react';
import { getUserStats } from '../services/user';

const StatCard = ({ title, value, subValue, subLabel, icon: Icon, colorClass, bgClass }) => (
    <div className="bg-white p-6 rounded-3xl border border-border/50 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-gray-500 font-medium text-sm mb-1">{title}</h3>
                <h2 className="text-3xl font-black text-gray-800">{value}</h2>
            </div>
            <div className={`p-3 rounded-2xl ${bgClass}`}>
                <Icon className={`w-6 h-6 ${colorClass}`} />
            </div>
        </div>
        
        {subValue && (
            <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg w-fit ${bgClass} ${colorClass}`}>
                <span>{subValue}</span>
                <span className="opacity-70 font-normal">{subLabel}</span>
            </div>
        )}
    </div>
);

const UserCharts = () => {
    const { data: listData, isLoading: listLoading } = useListContext();
    const [stats, setStats] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchStats = async () => {
             try {
                const data = await getUserStats();
                setStats(data);
             } catch (error) {
                 console.error("Failed to fetch user stats", error);
             } finally {
                 setLoading(false);
             }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="h-64 flex items-center justify-center text-muted-foreground">Loading stats...</div>;
    if (!stats) return null;

    // --- Data Processing ---
    const { totalUsers, status, roles } = stats;
    
    // Process Role Data
    const roleData = Object.keys(roles).map((key, index) => ({
        id: index,
        value: roles[key],
        label: key,
        color: ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981'][index % 4] 
    }));

    // Process Status Data for Bar Chart
    const statusData = [status.active, status.pending, status.blocked];
    const statusLabels = ['Active', 'Pending', 'Blocked'];

    return (
        <div className="space-y-6">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Users" 
                    value={totalUsers} 
                    subValue={`+${listData ? listData.length : 0}`} // Showing current page count as "recent" for now
                    subLabel="visible"
                    icon={Users}
                    colorClass="text-violet-600"
                    bgClass="bg-violet-50"
                />
                <StatCard 
                    title="Active Users" 
                    value={status.active}
                    subValue={`${Math.round((status.active/totalUsers)*100)}%`}
                    subLabel="of total"
                    icon={UserCheck}
                    colorClass="text-emerald-600"
                    bgClass="bg-emerald-50"
                />
                 <StatCard 
                    title="Blocked Users" 
                    value={status.blocked}
                    subValue="Action needed"
                    subLabel=""
                    icon={UserX}
                    colorClass="text-rose-600"
                    bgClass="bg-rose-50"
                />
                <StatCard 
                    title="User Roles" 
                    value={Object.keys(roles).length}
                    subValue="Types"
                    subLabel="defined"
                    icon={Shield}
                    colorClass="text-amber-600"
                    bgClass="bg-amber-50"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Role Distribution (Pie) */}
                <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-border/50 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-800">User Roles Distribution</h3>
                        <button className="text-gray-400 hover:text-primary">...</button>
                    </div>
                    <div className="flex-1 flex items-center justify-center relative">
                        {/* Center Text Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                            <span className="text-3xl font-black text-gray-800">{totalUsers}</span>
                            <span className="text-xs text-gray-500 uppercase tracking-wide font-bold">Users</span>
                        </div>
                        <PieChart
                            series={[{
                                data: roleData,
                                innerRadius: 60,
                                outerRadius: 85,
                                paddingAngle: 4,
                                cornerRadius: 6,
                            }]}
                            height={250}
                            slotProps={{
                                legend: { hidden: true } 
                            }}
                            margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        />
                    </div>
                    {/* Custom Legend */}
                    <div className="mt-4 space-y-3">
                        {roleData.map(item => (
                            <div key={item.label} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-gray-600 font-medium">{item.label}</span>
                                </div>
                                <span className="font-bold text-gray-800">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Status Overview (Bar) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-border/50 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <h3 className="font-bold text-gray-800">Employment Status Statistics</h3>
                            <p className="text-sm text-gray-500 mt-1">Breakdown of user account statuses</p>
                        </div>
                        <div className="flex gap-2">
                            <select className="bg-gray-50 border-none text-xs font-bold text-gray-500 py-2 px-4 rounded-lg cursor-pointer outline-none">
                                <option>This Year</option>
                                <option>Last Year</option>
                            </select>
                        </div>
                    </div>
                    
                    <BarChart
                        xAxis={[{ scaleType: 'band', data: statusLabels, categoryGapRatio: 0.4 }]}
                        series={[{ 
                            data: statusData, 
                            color: '#6366f1',
                            borderRadius: 8,
                        }]}
                        height={350}
                        grid={{ horizontal: true }}
                        sx={{
                            '.MuiBarElement-root': {
                                fillOpacity: 0.9,
                                transition: 'all 0.3s',
                            },
                             '.MuiBarElement-root:hover': {
                                fillOpacity: 1,
                                filter: 'brightness(1.1)',
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default UserCharts;
