import { atom } from "jotai";

export const pictures = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
];

export const pageAtom = atom(0);
export const pages = [
  {
    front: "1",
    back: pictures[0],
  },
];
for (let i = 1; i < pictures.length - 1; i += 2) {
  pages.push({
    front: pictures[i % pictures.length],
    back: pictures[(i + 1) % pictures.length],
  });
}

pages.push({
  front: pictures[pictures.length - 1],
  back: "10",
});
