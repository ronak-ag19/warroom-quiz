export const QUESTIONS = [
  {
    id: 1,
    topic: "Market Timings & Basics",
    question: "At what time does the NSE equity market open for regular trading?",
    options: ["9:00 AM", "9:15 AM", "9:30 AM", "10:00 AM"],
    answer: 1,
  },
  {
    id: 2,
    topic: "Taxation & Charges",
    question: "Intraday equity trading profits are classified under which income head for tax purposes?",
    options: ["Short-Term Capital Gains", "Long-Term Capital Gains", "Speculative Business Income", "Income from Other Sources"],
    answer: 2,
  },
  {
    id: 3,
    topic: "Order Types",
    question: "You place a Market Order to buy Reliance at 9:16 AM. What is guaranteed?",
    options: ["You get the price you saw on screen", "Your order executes, but price may differ", "Your order waits for the best price", "Your order executes only if price falls"],
    answer: 1,
  },
  {
    id: 4,
    topic: "Taxation & Charges",
    question: "STT on intraday equity is charged on which side?",
    options: ["Buy side only", "Sell side only", "Both buy and sell sides", "STT does not apply to intraday"],
    answer: 1,
  },
  {
    id: 5,
    topic: "Risk & Margin",
    question: "What is the maximum intraday leverage a broker can legally offer on equity?",
    options: ["0x", "10x", "5x", "2x"],
    answer: 2,
  },
  {
    id: 6,
    topic: "Taxation & Charges",
    question: "Your intraday loss is Rs. 50,000. You have salary income of Rs. 12 lakh. Can you offset the loss against salary?",
    options: ["Yes, fully", "Yes, up to Rs. 1.25 lakh", "No, speculative losses can only offset speculative gains", "No, intraday losses can never be carried forward"],
    answer: 2,
  },
  {
    id: 7,
    topic: "Market Timings & Basics",
    question: "You forget to square off your MIS position before 3:12 PM. What happens?",
    options: ["It converts to delivery automatically", "It gets cancelled with no P&L impact", "It is auto-squared off by the broker and a penalty is levied", "Your account gets blocked"],
    answer: 2,
  },
  {
    id: 8,
    topic: "Order Types",
    question: "You place a Limit Buy Order at Rs. 550 when the stock is at Rs. 530. When will it execute?",
    options: ["Immediately at Rs. 530", "Never, you cannot place a buy limit above current price", "Only when the stock rises to Rs. 550 and a seller exists", "At Rs. 540, midpoint between current and limit price"],
    answer: 2,
  },
];

export const GAME_CODE = "1947";
export const ADMIN_CODE = "1234";
export const QUIZ_DURATION_SECONDS = 90;
