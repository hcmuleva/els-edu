import { Layout } from 'react-admin';
import MyAppBar from './MyAppBar';
import MyMenu from './MyMenu';

const MyLayout = (props) => (
    <Layout
        {...props}
        appBar={MyAppBar}
        menu={MyMenu}
        className="bg-background min-h-screen font-sans"
    />
);

export default MyLayout;
