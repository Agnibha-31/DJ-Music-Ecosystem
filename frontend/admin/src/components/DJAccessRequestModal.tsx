import { useAdmin } from '../context/AdminContext';

export function DJAccessRequestModal() {
  // This modal is disabled - DJ requests are managed in the System Config page
  // where they are already properly displayed and accessible to admins
  useAdmin(); // Keep the hook to prevent unused variable warnings
  return null;
}
