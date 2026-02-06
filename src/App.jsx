import { BrowserRouter as Router } from "react-router-dom";
import AppContent from "./AppContent";
import Providers from "./Providers";
import "./App.css";
import ScrollToTop from "./utils/scrollToTop";

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <Providers>
        <AppContent />
      </Providers>
    </Router>
  );
};

export default App;
