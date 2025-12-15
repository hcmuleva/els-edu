import { Title } from 'react-admin';
import { cn } from '../lib/utils';
import { Users, BookOpen, Trophy, Sparkles, ArrowRight } from 'lucide-react';

const Card = ({ className, children }) => (
    <div className={cn("bg-card rounded-2xl shadow-sm border border-border/50 p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group", className)}>
        {children}
    </div>
);

const StatCard = ({ title, value, subtitle, icon: Icon, gradient }) => (
    <Card className="relative overflow-hidden">
        <div className={cn("absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-10 rounded-bl-full transition-transform duration-500 group-hover:scale-150", gradient)} />
        <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-xl bg-gradient-to-br text-white shadow-inner", gradient)}>
                  {Icon && <Icon className="w-6 h-6" />}
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Stats</span>
            </div>
            <div>
                <h3 className="text-3xl font-heading font-black text-foreground mb-1">{value}</h3>
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
            </div>
        </div>
    </Card>
);

const Dashboard = () => (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Title title="Dashboard | ELS Kids" />
        
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-primary-600 p-8 md:p-12 text-white shadow-2xl shadow-primary/20">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-secondary opacity-20 rounded-full blur-2xl" />
            
            <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium text-white mb-6">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>Welcome back, Explorer!</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-heading font-black mb-6 leading-tight">
                    Ready to start your <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">Learning Adventure?</span>
                </h1>
                <p className="text-lg md:text-xl text-primary-100 mb-8 max-w-lg leading-relaxed">
                    Discover new worlds of knowledge today. Your journey to becoming a genius starts here.
                </p>
                <div className="flex flex-wrap gap-4">
                    <button className="bg-white text-primary-600 px-8 py-4 rounded-xl font-bold hover:bg-yellow-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 flex items-center gap-2 group">
                        Start Learning
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="bg-primary-700/50 backdrop-blur-sm text-white border border-white/20 px-8 py-4 rounded-xl font-bold hover:bg-primary-700 transition-all">
                        View Progress
                    </button>
                </div>
            </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
                title="Active Learners" 
                value="1,234" 
                icon={Users}
                gradient="from-blue-500 to-cyan-400"
            />
            <StatCard 
                title="Quizzes Mastered" 
                value="856" 
                icon={Trophy}
                gradient="from-yellow-500 to-orange-400"
            />
            <StatCard 
                title="Lessons Completed" 
                value="12k" 
                icon={BookOpen}
                gradient="from-pink-500 to-rose-400"
            />
        </div>

        {/* Recent Activity / Content Area placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="min-h-[300px] flex flex-col justify-center items-center text-center p-12 border-dashed border-2 border-border bg-transparent hover:bg-card/50">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                   <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Continue Learning</h3>
                <p className="text-muted-foreground max-w-xs">Your recent lessons will appear here properly formatted soon.</p>
            </Card>
             <Card className="min-h-[300px] flex flex-col justify-center items-center text-center p-12 border-dashed border-2 border-border bg-transparent hover:bg-card/50">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                   <Trophy className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Leaderboard</h3>
                <p className="text-muted-foreground max-w-xs">Compete with friends and see who's leading the pack!</p>
            </Card>
        </div>
    </div>
);

export default Dashboard;
