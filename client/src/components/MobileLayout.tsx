import { Outlet } from 'react-router-dom';
import { BottomTabBar } from './BottomTabBar';

const MobileLayout = () => {
  return (
    <div className="min-h-screen bg-background pb-16">
      <main className="mx-auto max-w-md">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  );
};

export default MobileLayout;
