import type { DailyBread } from "@/lib/types/daily-bread";

function formatBibleText(passage: string, verses: string[]): string {
  const lines = verses
    .map(
      (v, i) =>
        `<sup class="text-xs text-black-3 font-bold mr-1">${i + 1}</sup>${v}`
    )
    .join("<br/><br/>");
  return `<h4 class="text-lg font-medium mb-4">${passage} (ESV)</h4><p class="leading-relaxed">${lines}</p>`;
}

export const TODAYS_DAILY_BREAD: DailyBread = {
  id: "1",
  slug: "kiss-the-son",
  title: "Kiss The Son",
  date: "2026-02-09",
  passage: "Psalm 2:1\u201312",
  keyVerse: "12",
  author: "P. Abraham Kim",
  tags: ["Salvation", "Mission"],
  audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  body: `<p>The kings of this world rule as if they could control the world. But in reality, the One enthroned in heaven has power over all things. Jesus destroyed death and is exalted above every name (Ph 2:9).</p>
<p>The author advises us to \u201ckiss the Son\u201d (12). Jesus is our Friend and a personal God who delights in our humble and intimate expressions of thanks and praise (Lk 7:38). At the same time, he is a Mighty God who saves us from our sin and will come in power to judge this world.</p>
<p>As we serve the Lord, let us fear his greatness and rejoice in his victory over death. Let us enjoy the loving kindness and friendship in our relationship with Christ, for, \u201cBlessed are all who take refuge in him\u201d (12).</p>
<p><strong>Prayer:</strong> Father, thank you for giving us your Son Jesus to be our Savior and King. Please help me to devote myself to Jesus as my King.</p>
<p><strong>One Word:</strong> Kiss the Son, Jesus</p>`,
  bibleText: formatBibleText("Psalm 2:1\u201312", [
    "Why do the nations rage and the peoples plot in vain?",
    "The kings of the earth set themselves, and the rulers take counsel together, against the Lord and against his Anointed, saying,",
    "\u201cLet us burst their bonds apart and cast away their cords from us.\u201d",
    "He who sits in the heavens laughs; the Lord holds them in derision.",
    "Then he will speak to them in his wrath, and terrify them in his fury, saying,",
    "\u201cAs for me, I have set my King on Zion, my holy hill.\u201d",
    "I will tell of the decree: The Lord said to me, \u201cYou are my Son; today I have begotten you.",
    "Ask of me, and I will make the nations your heritage, and the ends of the earth your possession.",
    "You shall break them with a rod of iron and dash them in pieces like a potter\u2019s vessel.\u201d",
    "Now therefore, O kings, be wise; be warned, O rulers of the earth.",
    "Serve the Lord with fear, and rejoice with trembling.",
    "Kiss the Son, lest he be angry, and you perish in the way, for his wrath is quickly kindled. Blessed are all who take refuge in him.",
  ]),
};
