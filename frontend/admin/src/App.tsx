import { RouterProvider } from 'react-router';
import { router } from './routes.tsx';
import { BackgroundAnimation } from './components/BackgroundAnimation';
import { ParticleField } from './components/ParticleField';
import { MobileOptimizer } from './components/MobileOptimizer';

export default function App() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      <BackgroundAnimation />
      <ParticleField />
      <MobileOptimizer />
      
      <div className="relative z-10">
        <RouterProvider router={router} />
      </div>
    </div>
  );
}
