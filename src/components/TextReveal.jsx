import React, { useEffect, useState } from "react";
import "./TextReveal.css";

const TextReveal = ({ text, onFinish }) => {
  const words = text.split(" ");
  const [isFadingOut, setIsFadingOut] = useState(false);

  // WAKTU JEDA setelah animasi fade-in SELESAI
  const holdTime = 3000; // ubah angka ini supaya lebih lama

  useEffect(() => {


    const fadeInDuration = words.length * 150 + 800;

    // Fade-out dimulai setelah fade-in selesai + holdTime
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, fadeInDuration + holdTime);

    // Total waktu fade-out = fadeInDuration + holdTime + fadeOutDuration
    const finishTimer = setTimeout(() => {
      onFinish && onFinish();
    }, fadeInDuration + holdTime + (words.length * 150) + 800);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(finishTimer);
    };
  }, [text, words.length, onFinish]);

  return (
    <h1 className="reveal-container">
      {words.map((word, i) => (
        <span
          key={i}
          className={isFadingOut ? "fade-out" : "fade-in"}
          style={{ animationDelay: `${i * 0.15}s` }}
        >
          {word}&nbsp;
        </span>
      ))}
    </h1>
  );
};

export default TextReveal;
