import { useState } from "react";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Formular from "./components/Formular/Formular";


import Sidebar from "./components/Sidebar";
import MapView from "./components/MapComponent/MapComponent";
import objects from "./data/objects";

export default function App() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="app">
      <Header />
      <main>
        <Formular />
      </main>
      {/* <Footer /> */}
    </div>
  );
}