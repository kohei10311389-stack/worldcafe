import { HashRouter, Routes, Route, Link } from "react-router-dom";
import Home from "./routes/Home";
import QrCodes from "./routes/QrCodes";
import Camera from "./routes/Camera";
import Photos from "./routes/Photos";
import Export from "./routes/Export";

export default function App() {
  return (
    <HashRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/qrcodes" element={<QrCodes />} />
          <Route path="/camera" element={<Camera />} />
          <Route path="/photos" element={<Photos />} />
          <Route path="/export" element={<Export />} />
          <Route path="*" element={<Home />} />
        </Routes>
        <Link to="/" className="muted" style={{ display: "block", marginTop: 24 }}>← ホーム</Link>
      </div>
    </HashRouter>
  );
}
