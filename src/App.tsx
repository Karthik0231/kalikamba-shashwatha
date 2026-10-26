import React from 'react';
import { AppProvider } from './context/AppContext';
import { TempleWorkspace } from './pages/TempleWorkspace';

export function App() {
  return (
    <AppProvider>
      <TempleWorkspace />
    </AppProvider>
  );
}

export default App;
