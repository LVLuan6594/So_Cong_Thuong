import { useEffect, useRef, useState } from "react";
import { Bot, Maximize2, MessageSquare, Minimize2, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatMsg {
  id: number;
  from: "bot" | "user";
  text: string;
}

const WELCOME: ChatMsg = {
  id: 0,
  from: "bot",
  text: "Xin chào! Tôi là trợ lý ảo ngành Công Thương Tây Ninh. Tôi có thể hỗ trợ tra cứu doanh nghiệp, cụm công nghiệp, giấy phép và báo cáo. Bạn cần gì ạ?",
};

const BOT_REPLIES = [
  "Để tôi kiểm tra dữ liệu mới nhất, xin chờ chút… Tỉnh Tây Ninh quy hoạch 108 cụm công nghiệp (~6.228 ha), trong đó 24 cụm đang hoạt động với 533 dự án đầu tư (92 dự án FDI).",
  "Theo CSDL ngành, có 2.486 doanh nghiệp đang hoạt động trên địa bàn tỉnh.",
  "Tôi đã ghi nhận yêu cầu. Bạn có thể tra cứu chi tiết tại phân hệ CSDL ngành hoặc bản đồ GIS cụm công nghiệp.",
  "Chỉ số sản xuất công nghiệp (IIP) quý gần nhất đạt 113,6% so với cùng kỳ năm trước.",
  "Bạn có thể đặt câu hỏi về: doanh nghiệp, cụm công nghiệp, năng lượng, xuất nhập khẩu hoặc thủ tục hành chính.",
];

function botReply(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("cụm công nghiệp") || q.includes("ccn") || q.includes("gis")) {
    return "Tỉnh Tây Ninh quy hoạch 108 cụm công nghiệp (6.228 ha) theo QĐ 2968/QĐ-UBND; 24 cụm đang hoạt động (1.179 ha, 533 dự án, 92 FDI, tỷ lệ lấp đầy ~84%), 30 cụm đang đầu tư hạ tầng, 54 cụm mời gọi đầu tư. Xem chi tiết trên bản đồ GIS phân hệ Cụm công nghiệp.";
  }
  if (q.includes("doanh nghiệp") || q.includes("dn")) {
    return "CSDL ngành hiện quản lý 2.486 doanh nghiệp, 3.174 cơ sở SXKD. Tỷ lệ dữ liệu chính thức đạt hơn 74%.";
  }
  if (q.includes("giấy phép") || q.includes("phép")) {
    return "Hệ thống đang quản lý 1.827 giấy phép, 37 giấy phép sắp hết hạn trong 30 ngày tới.";
  }
  if (q.includes("xuất khẩu") || q.includes("xuat khau") || q.includes("xnc")) {
    return "Kim ngạch xuất khẩu gần nhất đạt 246 triệu USD, nhập khẩu 151 triệu USD. Hoa Kỳ là thị trường xuất khẩu lớn nhất (34%).";
  }
  if (q.includes("năng lượng") || q.includes("dien")) {
    return "Có 48 dự án năng lượng, 31 đang hoạt động, 17 đang triển khai. Sản lượng điện thương phẩm khoảng 531 triệu kWh.";
  }
  return BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)]!;
}

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([WELCOME]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    return () => clearTimeout(t);
  }, [messages, open, typing]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { id: Date.now(), from: "user", text }]);
    setInput("");
    setTyping(true);
    const reply = botReply(text);
    setTimeout(
      () => {
        setMessages((m) => [...m, { id: Date.now() + 1, from: "bot", text: reply }]);
        setTyping(false);
      },
      900 + Math.random() * 700,
    );
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div
          className={cn(
            "flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-panel",
            maximized
              ? "fixed bottom-0 right-0 top-0 z-50 h-screen w-screen rounded-none sm:bottom-4 sm:right-4 sm:top-auto sm:h-[calc(100vh-2rem)] sm:w-[min(40rem,calc(100vw-2rem))] sm:rounded-2xl"
              : "h-[32rem] max-h-[calc(100vh-2rem)] w-[calc(100vw-2.5rem)] max-w-sm",
          )}
        >
          <div className="flex items-center gap-2.5 bg-navy px-4 py-3 text-navy-foreground">
            <span className="flex size-8 items-center justify-center rounded-full bg-white/15">
              <Bot className="size-4.5" strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-sm font-semibold">Trợ lý ảo ngành Công Thương</p>
              <p className="flex items-center gap-1.5 text-[11px] text-white/70">
                <span className="size-1.5 rounded-full bg-success" />
                Đang trực tuyến · AI
              </p>
            </div>
            <Sparkles className="size-4 text-warning" />
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-white hover:bg-white/10"
              onClick={() => setMaximized((m) => !m)}
              title={maximized ? "Thu nhỏ" : "Phóng to"}
            >
              {maximized ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-white hover:bg-white/10"
              onClick={() => {
                setOpen(false);
                setMaximized(false);
              }}
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto bg-background p-3.5">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                    m.from === "user"
                      ? "rounded-br-sm bg-gov text-white"
                      : "rounded-bl-sm border border-border bg-card text-foreground",
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-border bg-card px-3.5 py-2.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <div className="flex items-end gap-2 border-t border-border bg-card p-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Nhập câu hỏi..."
              className="min-h-9 max-h-24 flex-1 resize-none bg-surface py-2"
              rows={1}
            />
            <Button
              size="icon"
              className="size-9 shrink-0 rounded-lg bg-gov text-white hover:bg-gov/90"
              onClick={send}
              disabled={!input.trim() || typing}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <button
        onClick={() => setOpen((o) => !o)}
        className="chatbot-btn group relative flex size-14 items-center justify-center rounded-full bg-gov text-white shadow-panel transition-colors hover:bg-gov/90"
        aria-label="Mở trợ lý ảo"
      >
        <MessageSquare
          className="size-6 transition-transform group-hover:scale-110"
          strokeWidth={1.8}
        />
        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-warning text-[9px] font-bold text-white">
          1
        </span>
      </button>
    </div>
  );
}
