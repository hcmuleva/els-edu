import { AppBar } from 'react-admin';
// We override the default AppBar or use a custom div if we want complete control.
// React Admin's <AppBar> provides functionality like Sidebar toggle.
// To fully remove MUI, we might need a completely custom Layout, but <AppBar> is convenient.
// For now, we clean it up to use Tailwind classes and remove explicit MUI Typography.

const MyAppBar = (props) => (
    <AppBar 
        {...props} 
        className="!bg-white/80 backdrop-blur-md !shadow-sm border-b border-border sticky top-0 z-50"
        container={undefined}
        sx={{
            '& .RaAppBar-toolbar': {
                padding: 0,
            }
        }}
    >
        <div className="flex-1 flex items-center px-6 h-16">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-black text-xl">
                    K
                </div>
                <span className="text-xl font-heading font-bold text-foreground tracking-tight">
                    ELS Kids
                </span>
            </div>
        </div>
        
        <div className="mr-6 flex items-center gap-4">
             <div className="h-8 w-8 rounded-full bg-secondary/20 border-2 border-white ring-2 ring-primary/10" />
        </div>
    </AppBar>
);

export default MyAppBar;
