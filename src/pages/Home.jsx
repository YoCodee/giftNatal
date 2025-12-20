import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // <-- NEW IMPORT
import TextReveal from "../components/TextReveal";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate(); // <-- NEW: Inisialisasi navigate
  
  const introTexts = [
    "Haloo Sendirian aja nih ?",
    "Natal gini masa sendirian aja",
    "Kalau boleh tahu siapa namamu :)",
  ];

  const getGreetingText = (name) => [
    `Halo ${name}, nama yang bagusss!`,
    `Karena ada hadiah natal buat muuuuuu!`,
  ];

  const [index, setIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [stage2, setStage2] = useState(false);
  const [fadeKey, setFadeKey] = useState(0); 
  const [modalClosing, setModalClosing] = useState(false);

  const currentTextArray = stage2 ? getGreetingText(name) : introTexts;
  const currentText = currentTextArray[index];

  const handleAnimationEnd = () => {
    // Fade out → tunggu sebentar → baru lanjut
    setTimeout(() => {
      if (index === currentTextArray.length - 1) {
        if (!stage2) {
          setShowModal(true);
        } else {
          // console.log("Siap ke halaman hadiah 🎁"); // OLD
          navigate("/main", { state: { name } }); // <-- NEW: Navigasi ke halaman 3D setelah opening selesai
        }
      } else {
        // ke kalimat berikutnya
        setIndex((i) => i + 1);
        setFadeKey((k) => k + 1); 
      }
    }, 400); // waktu transisi fade-out
  };

  const handleNext = () => {
    if (name.trim() === "") return;

    // Trigger fade-out animation
    setModalClosing(true);

    // Setelah animasi selesai → tutup modal + lanjut stage 2
    setTimeout(() => {
      setShowModal(false);
      setModalClosing(false);
      setStage2(true);
      setIndex(0);
      setFadeKey((k) => k + 1);
    }, 400); // durasi harus sama dengan CSS fade-out
  };

  return (
    <div className="h-screen flex flex-col justify-center bg-white items-center christmas-gradient text-black text-center p-4">
      <div className="max-w-lg w-full text-3xl">
        <TextReveal
          key={fadeKey}
          text={currentText}
          onFinish={handleAnimationEnd}
        />
      </div>

      {showModal && (
        <div
          className={`modal-overlay fixed inset-0 bg-opacity-60 backdrop-blur-sm flex items-center justify-center ${
            modalClosing ? "fade-out" : ""
          }`}
        >
          <div
            className={`modal-box bg-white text-black p-8 rounded-xl w-10/12 max-w-sm  ${
              modalClosing ? "fade-out" : ""
            }`}
          >
            <h2 className="text-3xl font-bold mb-6">Siapa Namamu?</h2>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kamu..."
              className="w-full p-3 mb-6 bg-transparent border-b-2 border-black outline-none"
              autoFocus
            />

            <button
              onClick={handleNext}
              className={`w-full py-3 rounded-lg text-xl font-bold ${
                name.trim()
                  ? "bg-black text-white hover:scale-105 transition"
                  : "bg-gray-300 text-gray-600 cursor-not-allowed"
              }`}
            >
              Lanjut
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;