import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CampusNavigator from './pages/CampusNavigator.jsx';
import ArchitectureSimulator from './pages/ArchitectureSimulator.jsx';
import WorkflowValidator from './pages/WorkflowValidator.jsx';
import RequestHistory from './pages/RequestHistory.jsx';
import ProjectGuide from './pages/ProjectGuide.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/navigator" element={<CampusNavigator />} />
          <Route path="/architecture" element={<ArchitectureSimulator />} />
          <Route path="/workflow" element={<WorkflowValidator />} />
          <Route path="/request-workflow" element={<WorkflowValidator />} />
          <Route path="/flat" element={<WorkflowValidator />} />
          <Route path="/request-history" element={<RequestHistory />} />
          <Route path="/history" element={<RequestHistory />} />
          <Route path="/requests" element={<RequestHistory />} />
          <Route path="/guide" element={<ProjectGuide />} />
          <Route path="/how-it-works" element={<ProjectGuide />} />
          <Route path="/project-guide" element={<ProjectGuide />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
