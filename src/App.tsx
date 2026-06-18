import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/Home'
import SimpleInterestPage from './pages/Calculators/SimpleInterest'
import CompoundInterestPage from './pages/Calculators/CompoundInterest'
import RateConversionPage from './pages/Calculators/RateConversion'
import AmortizationPage from './pages/Calculators/Amortization'
import AnnuitiesPage from './pages/Calculators/Annuities'
import InflationPage from './pages/Calculators/Inflation'
import WikiPage from './pages/Wiki'
import ResolverPage from './pages/Resolver'
import HistoryPage from './pages/History'
import PracticePage from './pages/Practice'
import ExamPage from './pages/Exam'
import ComparatorPage from './pages/Comparator'
import DashboardPage from './pages/Dashboard'
import VpnTirPage from './pages/Calculators/VpnTir'
import NotFoundPage from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/resolver" element={<ResolverPage />} />
          <Route path="/simple" element={<SimpleInterestPage />} />
          <Route path="/compuesto" element={<CompoundInterestPage />} />
          <Route path="/tasas" element={<RateConversionPage />} />
          <Route path="/amortizacion" element={<AmortizationPage />} />
          <Route path="/anualidades" element={<AnnuitiesPage />} />
          <Route path="/inflacion" element={<InflationPage />} />
          <Route path="/vpntir" element={<VpnTirPage />} />
          <Route path="/wiki" element={<WikiPage />} />
          <Route path="/historial" element={<HistoryPage />} />
          <Route path="/practica" element={<PracticePage />} />
          <Route path="/examen" element={<ExamPage />} />
          <Route path="/comparador" element={<ComparatorPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
