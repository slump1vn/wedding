"use client";

import { useEffect, useState } from "react";
import { FaPhoneAlt } from "react-icons/fa";

type ScheduleItem = {
  time: string;
  at: string; // ISO, giờ Việt Nam (+07:00)
  text: string;
  link?: { label: string; href: string };
  highlight?: boolean;
};

const schedule: { day: string; items: ScheduleItem[]; note?: string }[] = [
  {
    day: "Thứ Bảy, 17/10/2026",
    items: [
      { time: "7h45", at: "2026-10-17T07:45:00+07:00", text: "XUẤT PHÁT TẠI 180 ĐÌNH THÔN (xe 45 chỗ). Không ăn sáng dọc đường, đi thẳng tới Uông Bí", highlight: true, link: { label: "Xem bản đồ", href: "https://maps.app.goo.gl/9P2pWRUsH6YGKoVAA" } },
      {
        time: "11h00", at: "2026-10-17T11:00:00+07:00",
        text: "Ăn trưa tại nhà hàng Lê Vân, 171 Nam Khê, TP. Uông Bí, Quảng Ninh",
        link: { label: "Xem bản đồ", href: "https://maps.app.goo.gl/xMMpby9mt8DySstCA" },
      },
      {
        time: "12h00", at: "2026-10-17T12:00:00+07:00",
        text: "Lấy phòng nghỉ, chỉnh trang trang phục tại Khách sạn Lê Vân",
        link: { label: "Xem bản đồ", href: "https://maps.app.goo.gl/HEURkredZVSE8vZs5" },
      },
      {
        time: "13h00", at: "2026-10-17T13:00:00+07:00",
        text: "Di chuyển tới nhà cô dâu (Trưng Vương, Uông Bí), thực hiện lễ ăn hỏi",
        link: { label: "Xem bản đồ", href: "https://maps.app.goo.gl/oeUtKcNDmkFtVSAL9" },
      },
      {
        time: "15h30", at: "2026-10-17T15:30:00+07:00",
        text: "Di chuyển tới Khách sạn Lê Vân (Phố Lê Hoàn, Vàng Danh, Quảng Ninh), dự lễ cưới",
        link: { label: "Xem bản đồ", href: "https://maps.app.goo.gl/HEURkredZVSE8vZs5" },
      },
      { time: "Tối", at: "2026-10-17T18:00:00+07:00", text: "Sau bữa cơm, mọi người sinh hoạt tự do, nghỉ đêm tại Khách sạn Lê Vân" },
    ],
  },
  {
    day: "Chủ Nhật, 18/10/2026",
    note: "Mọi người thu xếp trả phòng ở Lê Vân từ sáng sớm, vì 6h10 phải có mặt ở nhà gái để đón dâu.",
    items: [
      { time: "6h10", at: "2026-10-18T06:10:00+07:00", text: "Có mặt tại nhà gái (Trưng Vương, Uông Bí) để làm lễ đón dâu", highlight: true },
      { time: "6h50", at: "2026-10-18T06:50:00+07:00", text: "Xuất phát từ Uông Bí về Hà Nội" },
      {
        time: "10h30", at: "2026-10-18T10:30:00+07:00",
        text: "Dự kiến về tới 180 Đình Thôn",
        link: { label: "Xem bản đồ", href: "https://maps.app.goo.gl/9P2pWRUsH6YGKoVAA" },
      },
      { time: "11h00", at: "2026-10-18T11:00:00+07:00", text: "Ăn cơm thân mật tại nhà hàng Vạn Hoa, 79 Lê Đức Thọ" },
    ],
  },
];

const duties: { title: string; items: { task: string; who: string }[] }[] = [
  { title: "Xe chung", items: [{ task: "Phụ trách xe (đi, đón, số lượng)", who: "Anh Cường – 0935 539 133" }] },
  {
    title: "Lễ ăn hỏi",
    items: [
      { task: "Xe cưới", who: "Đỗ Chính" },
      { task: "Dẫn đầu đoàn bê tráp nhà trai", who: "Sơn em" },
      { task: "Bắn pháo hoa", who: "Tú em, Quân Giấy" },
    ],
  },
  {
    title: "Lễ cưới",
    items: [
      { task: "Dẫn khách vào nhà trai (đội bóng & bạn bè)", who: "Anh Cường, Đỗ Chính, Vũ" },
      { task: "Trình chiếu, phát nhạc", who: "Quân Giấy" },
    ],
  },
  {
    title: "Lễ đón dâu",
    items: [
      { task: "Bắn pháo hoa", who: "Tú em, Quân Giấy" },
      { task: "Lái xe dâu", who: "Anh Lâm" },
    ],
  },
  {
    title: "Tại 180 Đình Thôn",
    items: [
      { task: "Bắn pháo hoa (nếu còn)", who: "Tú em, Quân Giấy" },
      { task: "Rót nước chè", who: "Tú em, Sơn em" },
      { task: "Chụp ảnh", who: "Vũ" },
    ],
  },
];

// Lịch trình (tự đẩy mục đã qua xuống dưới, đánh dấu mục sắp tới) và bảng phân công
const Schedule = () => {
  const [now, setNow] = useState<number | null>(null);

  // Cập nhật theo thời gian thực để sắp xếp lại lịch trình
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const isPast = (it: ScheduleItem) => now !== null && new Date(it.at).getTime() < now;
  const orderedSchedule = schedule
    .map((d) => {
      const upcoming = d.items.filter((it) => !isPast(it));
      const past = d.items.filter(isPast);
      return { ...d, items: [...upcoming, ...past], hasUpcoming: upcoming.length > 0 };
    })
    .sort((x, y) => Number(y.hasUpcoming) - Number(x.hasUpcoming));
  const nextItem = orderedSchedule
    .flatMap((d) => d.items)
    .find((it) => !isPast(it));

  return (
    <section className="px-6 pt-6 pb-6">
      <h2 className="font-playfair font-bold text-2xl text-center uppercase text-[#232323] mb-5">
        Lịch Trình
      </h2>
      <a
        href="tel:0935539133"
        className="mb-5 flex items-center justify-center gap-2 rounded-2xl border border-sage/50 bg-sage/15 px-4 py-3 font-vietnam text-sm text-[#232323]"
      >
        <FaPhoneAlt className="text-sage" />
        <span>
          Liên hệ xe đón: <strong>Anh Cường – 0935 539 133</strong>
        </span>
      </a>
      {orderedSchedule.map((d) => (
        <div key={d.day} className="mb-6 rounded-3xl border border-sage/25 bg-white/50 p-5">
          <h3 className="font-playfair font-bold text-lg text-sage mb-3">{d.day}</h3>
          <ul className="space-y-3">
            {d.items.map((it) => (
              <li
                key={it.time + it.text}
                className={`flex gap-3 transition-all duration-500 ${
                  isPast(it) ? "opacity-40 grayscale" : ""
                } ${
                  it === nextItem ? "ring-2 ring-sage/70 rounded-2xl p-2 -mx-2" : ""
                } ${
                  it.highlight
                    ? "rounded-2xl bg-sage/15 border border-sage/50 p-3 -mx-2 shadow-sm"
                    : ""
                }`}
              >
                <span className="w-14 shrink-0 font-quicksand font-bold text-sm text-[#232323]">
                  {it.time}
                  {it === nextItem && (
                    <span className="block text-[10px] uppercase tracking-wider text-sage">
                      Sắp tới
                    </span>
                  )}
                </span>
                <span
                  className={`font-vietnam text-sm leading-relaxed ${
                    it.highlight ? "font-bold text-[#232323]" : "text-[#343434]"
                  }`}
                >
                  {isPast(it) && <span className="mr-1">✓</span>}
                  {it.text}
                  {it.link && (
                    <>
                      {" "}
                      <a
                        href={it.link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sage underline"
                      >
                        {it.link.label}
                      </a>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {d.note && (
            <p className="font-vietnam text-xs italic text-[#6E6E6E] mt-4 border-t border-sage/20 pt-3">
              Lưu ý: {d.note}
            </p>
          )}
        </div>
      ))}

      <h2 className="font-playfair font-bold text-2xl text-center uppercase text-[#232323] mt-8 mb-5">
        Phân Công
      </h2>
      <div className="rounded-3xl border border-sage/25 bg-white/50 p-5 space-y-5">
        {duties.map((g) => (
          <div key={g.title}>
            <h3 className="font-playfair font-bold text-base text-sage mb-2">{g.title}</h3>
            <ul className="space-y-1">
              {g.items.map((it) => (
                <li
                  key={it.task}
                  className="flex justify-between gap-3 font-vietnam text-sm text-[#343434]"
                >
                  <span>{it.task}</span>
                  <span className="font-bold text-right shrink-0">{it.who}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="font-vietnam text-xs text-[#6E6E6E] border-t border-sage/20 pt-3">
          Link phát nhạc:{" "}
          <a
            href="https://ss.digifusion.vn/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sage underline"
          >
            ss.digifusion.vn
          </a>
        </p>
      </div>
    </section>
  );
};

export default Schedule;
