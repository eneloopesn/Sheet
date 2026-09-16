/** 烤食煮盒菜單 */
const MENU = {
  restaurant: {
    name: "烤食煮盒",
    nameEn: "Roast & Cook",
    note: "每盒含主餐、白飯、時令配菜四樣、炒物一樣，另有加購升飯服務",
  },
  categories: [
    {
      id: "bento",
      name: "飯盒",
      items: [
        { id: "b1", name: "招牌烤雞腿飯盒", price: 150, tags: ["大推"] },
        { id: "b2", name: "醬烤牛肉片飯盒", price: 150, tags: ["人氣"] },
        { id: "b3", name: "私房鹹豬肉飯盒", price: 150, tags: [] },
        { id: "b4", name: "挪威烤鯖魚飯盒", price: 130, tags: [] },
        { id: "b5", name: "原燒松阪豬飯盒", price: 180, tags: ["老饕最愛"] },
        { id: "b6", name: "醬烤梅花豬飯盒", price: 120, tags: [] },
        { id: "b7", name: "薄鹽烤鮭魚飯盒", price: 180, tags: ["人氣"] },
        { id: "b8", name: "蒲燒烤鯛魚飯盒", price: 120, tags: [] },
        { id: "b9", name: "頂級板腱牛排飯盒", price: 250, tags: ["大推"] },
        { id: "b10", name: "椒鹽杏鮑菇飯盒", price: 120, tags: ["素食可"] },
      ],
    },
    {
      id: "special",
      name: "特別餐點",
      items: [
        { id: "s1", name: "雞油拌飯盒／小菜飯盒", price: 80, tags: [] },
        { id: "s2", name: "每日例湯", price: 30, tags: [] },
        { id: "s3", name: "瓶裝冷泡茶 600cc", price: 60, tags: [] },
        {
          id: "s4",
          name: "隱藏版限量飯盒（需預訂）",
          price: 120,
          tags: ["限量"],
          priceNote: "120–390",
        },
      ],
    },
    {
      id: "addon",
      name: "人氣單點",
      items: [
        { id: "a1", name: "雞腿", price: 90, tags: [] },
        { id: "a2", name: "牛片", price: 90, tags: [] },
        { id: "a3", name: "鹹豬", price: 90, tags: [] },
        { id: "a4", name: "鮭魚", price: 100, tags: [] },
        { id: "a5", name: "松阪", price: 120, tags: [] },
        { id: "a6", name: "板腱牛排", price: 180, tags: [] },
        { id: "a7", name: "燙青菜", price: 50, tags: [] },
        { id: "a8", name: "杏鮑菇", price: 60, tags: [] },
        { id: "a9", name: "鯛魚", price: 60, tags: [] },
        { id: "a10", name: "梅豬", price: 60, tags: [] },
        { id: "a11", name: "雙腸", price: 70, tags: [] },
        { id: "a12", name: "鯖魚", price: 70, tags: [] },
        {
          id: "a13",
          name: "Minibox 水果杯",
          price: 50,
          tags: ["需提前一天預約"],
        },
      ],
    },
  ],
};
