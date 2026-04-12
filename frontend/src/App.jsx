import {Routes,Route,Navigate} from 'react-router-dom'
import UploadDatasetPage from './pages/UploadDatasetPage'
import DashboardPage from './pages/DashboardPage'
import DataInsights from './pages/DataInsights'
import MlPlayground from './pages/MlPlayground'
import ModelComparison from './pages/ModelComparison'
import Settings from './pages/Settings'
import AppLayout from "./components/AppLayout";

const App = () => {
  return (
    <AppLayout>
    <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path='/upload' element={<UploadDatasetPage />} />
    <Route path='/dashboard' element={<DashboardPage />} />
    <Route path='/insights/:dataset_id' element={<DataInsights />} />
    <Route path='/playground/:dataset_id' element={<MlPlayground />} />
    <Route path='/comparison/:dataset_id' element={<ModelComparison />} />
    <Route path='/settings' element={<Settings/>} />
    <Route path='/new-experiment' element={ <h1>new-experiment  </h1> } />
    <Route path='/documentation' element={<h1>documentation</h1>} />
    <Route path='/support' element={<h1>support</h1>} />
  </Routes>
  </AppLayout>
  )
}

export default App