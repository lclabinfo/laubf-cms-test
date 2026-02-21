import type { BibleStudy } from "@/lib/types/bible-study";

/* ================================================================
 * MOCK DATA — Bible Study Resources
 * In production, this data comes from PostgreSQL via CMS API.
 *
 * Each bible study has:
 *  - metadata (title, dates, series, passage, messenger)
 *  - questions (rich text HTML — from TinyMCE)
 *  - answers (rich text HTML)
 *  - transcript (rich text HTML)
 *  - attachments (PDFs, DOCXs, images)
 * ================================================================ */

export const MOCK_BIBLE_STUDIES: BibleStudy[] = [
  {
    id: "john-21",
    slug: "do-you-truly-love-me",
    title: "Do You Truly Love Me More Than These?",
    book: "John",
    passage: "John 21:1-25",
    datePosted: "2026-04-10",
    dateFor: "2026-04-12",
    series: "Sunday Message",
    messenger: "P. Kevin Albright",
    keyVerse: {
      verse: "John 21:15",
      text: "When they had finished eating, Jesus said to Simon Peter, \u201CSimon son of John, do you truly love me more than these?\u201D \u201CYes, Lord,\u201D he said, \u201Cyou know that I love you.\u201D Jesus said, \u201CFeed my lambs.\u201D",
    },
    bibleText: `<h4>John 21:1-25 (ESV)</h4>
<p>1 Afterward Jesus appeared again to his disciples, by the Sea of Tiberias. It happened this way: 2 Simon Peter, Thomas (called Didymus), Nathanael from Cana in Galilee, the sons of Zebedee, and two other disciples were together. 3 \u201CI\u2019m going out to fish,\u201D Simon Peter told them, and they said, \u201CWe\u2019ll go with you.\u201D So they went out and got into the boat, but that night they caught nothing.</p>
<p>4 Early in the morning, Jesus stood on the shore, but the disciples did not realize that it was Jesus. 5 He called out to them, \u201CFriends, haven\u2019t you any fish?\u201D \u201CNo,\u201D they answered. 6 He said, \u201CThrow your net on the right side of the boat and you will find some.\u201D When they did, they were unable to haul the net in because of the large number of fish.</p>
<p>7 Then the disciple whom Jesus loved said to Peter, \u201CIt is the Lord!\u201D As soon as Simon Peter heard him say, \u201CIt is the Lord,\u201D he wrapped his outer garment around him (for he had taken it off) and jumped into the water. 8 The other disciples followed in the boat, towing the net full of fish, for they were not far from shore, about a hundred yards. 9 When they landed, they saw a fire of burning coals there with fish on it, and some bread. 10 Jesus said to them, \u201CBring some of the fish you have just caught.\u201D</p>
<p>11 Simon Peter climbed aboard and dragged the net ashore. It was full of large fish, 153, but even with so many the net was not torn. 12 Jesus said to them, \u201CCome and have breakfast.\u201D None of the disciples dared ask him, \u201CWho are you?\u201D They knew it was the Lord. 13 Jesus came, took the bread and gave it to them, and did the same with the fish. 14 This was now the third time Jesus appeared to his disciples after he was raised from the dead.</p>
<p>15 When they had finished eating, Jesus said to Simon Peter, \u201CSimon son of John, do you truly love me more than these?\u201D \u201CYes, Lord,\u201D he said, \u201Cyou know that I love you.\u201D Jesus said, \u201CFeed my lambs.\u201D 16 Again Jesus said, \u201CSimon son of John, do you truly love me?\u201D He answered, \u201CYes, Lord, you know that I love you.\u201D Jesus said, \u201CTake care of my sheep.\u201D 17 The third time he said to him, \u201CSimon son of John, do you love me?\u201D Peter was hurt because Jesus asked him the third time, \u201CDo you love me?\u201D He said, \u201CLord, you know all things; you know that I love you.\u201D Jesus said, \u201CFeed my sheep.\u201D</p>
<p>18 Very truly I tell you, when you were younger you dressed yourself and went where you wanted; but when you are old you will stretch out your hands, and someone else will dress you and lead you where you do not want to go.\u201D 19 Jesus said this to indicate the kind of death by which Peter would glorify God. Then he said to him, \u201CFollow me!\u201D</p>
<p>20 Peter turned and saw that the disciple whom Jesus loved was following them. (This was the one who had leaned back against Jesus at the supper and had said, \u201CLord, who is going to betray you?\u201D) 21 When Peter saw him, he asked, \u201CLord, what about him?\u201D 22 Jesus answered, \u201CIf I want him to remain alive until I return, what is that to you? You must follow me.\u201D 23 Because of this, the rumor spread among the brothers that this disciple would not die. But Jesus did not say that he would not die; he only said, \u201CIf I want him to remain alive until I return, what is that to you?\u201D</p>
<p>24 This is the disciple who testifies to these things and who wrote them down. We know that his testimony is true. 25 Jesus did many other things as well. If every one of them were written down, I suppose that even the whole world would not have room for the books that would be written.</p>`,
    questions: `<h3>Read verses 1-6</h3>
<ul>
<li>Where and to whom did the risen Jesus appear again? (1-2, 14; Mt 26:32)</li>
<li>What did Peter and the disciples want to do and what was the result? (3)</li>
<li>How might they have felt when they caught nothing? How did Jesus help to restore them after their failure? (4-6)</li>
</ul>
<h3>Read verses 7-14</h3>
<ul>
<li>Who recognized Jesus first? (7a; Lk 5:1-11)</li>
<li>What did Peter and the other disciples do? (7b-8)</li>
<li>How did Jesus serve the disciples? (9-13)</li>
<li>How successful was their fishing? (11)</li>
<li>How might they have felt when Jesus served them? (12-13)</li>
</ul>
<h3>Read verses 15-17</h3>
<ul>
<li>After eating, to whom did Jesus speak and why? (15)</li>
<li>What did Jesus ask Peter? (15-17)</li>
<li>What did he mean by, \u201CDo you truly love me more than these\u201D?</li>
<li>Why did Jesus ask Peter three times? What was Peter\u2019s response and Jesus\u2019 command each time? (15-17)</li>
</ul>
<h3>Read verses 18-25</h3>
<ul>
<li>What will happen to Peter when he is old? (18,19a)</li>
<li>What did Jesus say to Peter? (19b)</li>
<li>Why did Peter ask about John? (20-21)</li>
<li>What was Jesus\u2019 answer? (22-23)</li>
<li>How did the author conclude? (24-25)</li>
</ul>`,
    answers: `<h3>Verses 1-6</h3>
<p>Jesus appeared by the Sea of Tiberias to seven disciples. Peter said he was going fishing and the others followed. They caught nothing all night. Jesus called from shore and told them to cast the net on the right side. They caught an enormous number of fish.</p>
<p>The disciples did not know what to do, so they did what was necessary. In taking this initiative they put themselves in a place where Christ met them. When we are uncertain what to do, we should simply do our duty and God will guide.</p>
<h3>Verses 7-14</h3>
<p>It was the Beloved Disciple (John) who recognized the stranger on the shore. Peter wrapped his outer garment around him and jumped into the water. Jesus had already prepared a charcoal fire with bread and fish for them. He knew the disciples were very hungry after a long night of work. He served them breakfast\u2014another sign of his grace and provision.</p>
<h3>Verses 15-17</h3>
<p>Jesus asked Peter three times \u201CDo you love me?\u201D corresponding to Peter\u2019s three denials. Each time Peter affirmed his love, Jesus commanded him to feed/care for his sheep. The key qualification for this task is a true love for Jesus.</p>
<p>Peter\u2019s pride was cut to the quick. The light was shining in the darkness of Peter\u2019s heart, bringing life. Without such brokenness we are full of self and unable to hear the guidance of the Chief Shepherd.</p>
<h3>Verses 18-25</h3>
<p>Jesus contrasts Peter\u2019s youth with what is coming. He has been able to go wherever he wanted, but when he is old, someone else will lead him where he does not want to go. This indicated the kind of death by which Peter would glorify God.</p>
<p>The call to follow is personal. We follow based on his love and calling, not based on other people.</p>`,
    transcript: `<p><strong>Then he said to him, \u201CFollow me!\u201D</strong></p>

<p>Today\u2019s passage is our final Easter/resurrection message. It is also the final chapter of John\u2019s gospel. What is the concluding message of the gospel? We see that God has loved us; he became flesh, he taught us, he suffered and died for us, and now calls us to follow him, to love him and feed his sheep.</p>

<p><strong>First, we can learn about the kind of love Jesus has; Jesus invited his disciples to breakfast (1-14).</strong></p>

<p>Jesus appeared \u201Cagain\u201D to his disciples at the sea of Tiberias, which is the sea of Galilee. They had gone there because Jesus told them he would meet them in Galilee after he had risen. But they really didn\u2019t know what they were doing. Peter said he was going out to fish and the others followed him. They fished all night but caught nothing.</p>

<p>Then Jesus appeared. He called out from shore, \u201CFriends, haven\u2019t you any fish?\u201D He told them to throw their net on the right side of the boat. When they did, they were unable to haul the net in because of the large number of fish. John recognized Jesus right away because what happened was just like what happened when he had first called them.</p>

<p>When they got to shore, Jesus had already prepared a fire with fish and bread. He served them breakfast. This was the third time he appeared to his disciples after he was raised from the dead.</p>

<p><strong>Second, Jesus asked Peter if he truly loved him (15-17).</strong></p>

<p>After breakfast, Jesus asked Simon Peter, \u201CDo you truly love me more than these?\u201D He asked three times, corresponding to Peter\u2019s three denials. Peter was hurt because Jesus asked him the third time. But this was a necessary surgery to heal Peter\u2019s heart.</p>

<p>Each time Peter affirmed his love, Jesus gave him a command: \u201CFeed my lambs,\u201D \u201CTake care of my sheep,\u201D \u201CFeed my sheep.\u201D Jesus showed Peter how to express his love: by caring for others.</p>

<p><strong>Third, follow me (18-25).</strong></p>

<p>Jesus finished by saying, \u201CFollow me!\u201D Following Jesus involves denying ourselves and doing what we do not want to do. The call to follow is personal. We follow based on his love and calling, not based on other people.</p>

<p>This passage shows us that Jesus loved us and calls us, and his love is the same. His love did not change although theirs had faltered. He wants us to accept his love and follow him, caring for his sheep with the same level of his love.</p>`,
    attachments: [
      { name: "John 21 Study Guide.pdf", url: "#", type: "pdf" },
      { name: "John 21 Study Guide.docx", url: "#", type: "docx" },
      { name: "John 21 Message Transcript.docx", url: "#", type: "docx" },
    ],
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
  },
  {
    id: "psalms-23",
    slug: "the-lord-is-my-shepherd",
    title: "The Lord is My Shepherd",
    book: "Psalms",
    passage: "Psalms 23:1-6",
    datePosted: "2026-02-20",
    dateFor: "2026-02-22",
    series: "Sunday Message",
    messenger: "P. Samuel Lee",
    keyVerse: {
      verse: "Psalms 23:1",
      text: "The Lord is my shepherd, I lack nothing.",
    },
    bibleText: `<h4>Psalms 23:1-6 (ESV)</h4>
<p>1 The Lord is my shepherd; I shall not want. 2 He makes me lie down in green pastures. He leads me beside still waters. 3 He restores my soul. He leads me in paths of righteousness for his name\u2019s sake.</p>
<p>4 Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me; your rod and your staff, they comfort me.</p>
<p>5 You prepare a table before me in the presence of my enemies; you anoint my head with oil; my cup overflows. 6 Surely goodness and mercy shall follow me all the days of my life, and I shall dwell in the house of the Lord forever.</p>`,
    questions: `<h3>Look at verse 1</h3><ul><li>What does it mean that the Lord is my shepherd?</li><li>What does \u201CI lack nothing\u201D really mean in the context of our daily lives?</li></ul><h3>Look at verses 2-3</h3><ul><li>Where does the shepherd lead his sheep and why?</li><li>What does it mean that he restores my soul?</li></ul><h3>Look at verses 4-6</h3><ul><li>What is the valley of the shadow of death?</li><li>Why does the psalmist fear no evil?</li><li>What is the significance of the prepared table?</li></ul>`,
    answers: `<h3>Verse 1</h3>
<p>The Lord as shepherd means he personally cares for and guides each of us. \u201CI shall not want\u201D does not mean we will have everything we desire, but that we will have everything we need. When the Lord is our shepherd, we can trust that he provides for all our true needs.</p>
<h3>Verses 2-3</h3>
<p>He leads us to green pastures and quiet waters \u2014 places of nourishment and peace. These are not places we find on our own; the shepherd leads us there. \u201CHe restores my soul\u201D means he renews our inner life when we are weary, discouraged, or spiritually dry. He leads us in right paths \u2014 not for our merit, but for his name\u2019s sake.</p>
<h3>Verses 4-6</h3>
<p>The valley of the shadow of death represents the darkest, most frightening experiences of life. Yet even there, we fear no evil because the shepherd is with us. His rod protects from enemies; his staff guides and rescues. The prepared table shows that God provides abundantly even in the midst of adversity. The overflowing cup represents abundant blessings. Goodness and mercy follow us \u2014 not occasionally, but all the days of our life.</p>`,
    transcript: `<p><strong>The Lord is my shepherd, I lack nothing.</strong></p>
<p>Psalm 23 is perhaps the most beloved psalm. David, a former shepherd himself, describes God as the perfect shepherd who provides, protects, and guides.</p>
<p><strong>First, the shepherd provides (1-3).</strong></p>
<p>David begins with a bold confession: \u201CThe Lord is my shepherd.\u201D This is deeply personal. He does not say \u201CThe Lord is a shepherd\u201D but \u201Cmy shepherd.\u201D When we make this personal confession, we can also say \u201CI shall not want.\u201D The shepherd provides green pastures for nourishment, still waters for refreshment, and right paths for direction. He restores our soul when we are broken.</p>
<p><strong>Second, the shepherd protects (4).</strong></p>
<p>Even in the darkest valley, we need not fear because the shepherd is with us. His rod and staff \u2014 instruments of protection and guidance \u2014 comfort us. The key is not the absence of danger but the presence of the shepherd.</p>
<p><strong>Third, the shepherd blesses abundantly (5-6).</strong></p>
<p>God prepares a table in the presence of our enemies. He anoints our head with oil. Our cup overflows. These images speak of God\u2019s generous, abundant provision. And the psalm ends with the promise that goodness and mercy will follow us all the days of our life, and we will dwell in God\u2019s house forever.</p>`,
    attachments: [
      { name: "Psalm 23 Study Guide.pdf", url: "#", type: "pdf" },
    ],
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
  },
  {
    id: "matthew-5",
    slug: "blessed-are-the-poor-in-spirit",
    title: "The Sermon on the Mount: Blessed Are the Poor in Spirit",
    book: "Matthew",
    passage: "Matthew 5:1-12",
    datePosted: "2026-02-13",
    dateFor: "2026-02-15",
    series: "Sunday Message",
    messenger: "P. David Kim",
    keyVerse: {
      verse: "Matthew 5:3",
      text: "Blessed are the poor in spirit, for theirs is the kingdom of heaven.",
    },
    bibleText: `<h4>Matthew 5:1-12 (ESV)</h4>
<p>1 Seeing the crowds, he went up on the mountain, and when he sat down, his disciples came to him. 2 And he opened his mouth and taught them, saying:</p>
<p>3 \u201CBlessed are the poor in spirit, for theirs is the kingdom of heaven.</p>
<p>4 Blessed are those who mourn, for they shall be comforted.</p>
<p>5 Blessed are the meek, for they shall inherit the earth.</p>
<p>6 Blessed are those who hunger and thirst for righteousness, for they shall be satisfied.</p>
<p>7 Blessed are the merciful, for they shall receive mercy.</p>
<p>8 Blessed are the pure in heart, for they shall see God.</p>
<p>9 Blessed are the peacemakers, for they shall be called sons of God.</p>
<p>10 Blessed are those who are persecuted for righteousness\u2019 sake, for theirs is the kingdom of heaven.</p>
<p>11 Blessed are you when others revile you and persecute you and utter all kinds of evil against you falsely on my account. 12 Rejoice and be glad, for your reward is great in heaven, for so they persecuted the prophets who were before you.\u201D</p>`,
    questions: `<h3>Look at verses 1-2</h3><ul><li>Where did Jesus go and what did he do?</li><li>Who were his audience?</li></ul><h3>Look at verses 3-6</h3><ul><li>What does it mean to be \u201Cpoor in spirit\u201D?</li><li>Why are those who mourn blessed?</li><li>What does it mean to hunger and thirst for righteousness?</li></ul><h3>Look at verses 7-12</h3><ul><li>What does it mean to be pure in heart?</li><li>Why are peacemakers called sons of God?</li><li>How should we respond when persecuted for righteousness?</li></ul>`,
    answers: `<h3>Verses 1-2</h3>
<p>Jesus went up on a mountain and sat down to teach. His disciples came to him, though crowds were also present. The mountain setting echoes Moses receiving the law on Mount Sinai. Jesus, as the new Moses, gives the new law of the kingdom.</p>
<h3>Verses 3-6</h3>
<p>\u201CPoor in spirit\u201D means recognizing our spiritual bankruptcy before God. It is the opposite of spiritual pride. Those who mourn are blessed because they will be comforted by God. This mourning includes grief over sin and the brokenness of the world. To hunger and thirst for righteousness means to desperately desire to live rightly before God, like a starving person desires food.</p>
<h3>Verses 7-12</h3>
<p>The pure in heart are those whose inner motives are sincere before God. Peacemakers are those who work to reconcile broken relationships. They are called sons of God because they reflect God\u2019s own character as the great Reconciler. When persecuted, we should rejoice because our reward in heaven is great, and we share in the experience of the prophets before us.</p>`,
    transcript: `<p><strong>Blessed are the poor in spirit, for theirs is the kingdom of heaven.</strong></p>
<p>The Sermon on the Mount is the greatest sermon ever preached. In it, Jesus describes the character of citizens of the kingdom of heaven. The Beatitudes are not a checklist of virtues to achieve, but a description of the transforming work of God\u2019s grace in a believer\u2019s life.</p>
<p><strong>First, the inward qualities of kingdom citizens (3-6).</strong></p>
<p>Jesus begins with \u201Cpoor in spirit\u201D \u2014 those who recognize their spiritual need. This is the gateway to the kingdom. Those who mourn grieve over sin. The meek are not weak but are strong people under God\u2019s control. Those who hunger and thirst for righteousness have an intense desire for God\u2019s kingdom values.</p>
<p><strong>Second, the outward qualities of kingdom citizens (7-9).</strong></p>
<p>The merciful show compassion. The pure in heart have undivided loyalty to God. The peacemakers actively work for reconciliation. These qualities flow naturally from the inward transformation described in verses 3-6.</p>
<p><strong>Third, the cost and reward of kingdom living (10-12).</strong></p>
<p>Following Jesus brings persecution. But Jesus says we should rejoice because our reward is great in heaven. The prophets before us also suffered. Our suffering connects us to a great lineage of faith.</p>`,
    attachments: [
      { name: "Matthew 5 Study Guide.pdf", url: "#", type: "pdf" },
    ],
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
  },
  {
    id: "romans-8",
    slug: "more-than-conquerors",
    title: "More Than Conquerors",
    book: "Romans",
    passage: "Romans 8:31-39",
    datePosted: "2026-02-06",
    dateFor: "2026-02-08",
    series: "Sunday Message",
    messenger: "P. William Larsen",
    keyVerse: {
      verse: "Romans 8:37",
      text: "No, in all these things we are more than conquerors through him who loved us.",
    },
    bibleText: `<h4>Romans 8:31-39 (ESV)</h4>
<p>31 What then shall we say to these things? If God is for us, who can be against us? 32 He who did not spare his own Son but gave him up for us all, how will he not also with him graciously give us all things? 33 Who shall bring any charge against God\u2019s elect? It is God who justifies. 34 Who is to condemn? Christ Jesus is the one who died\u2014more than that, who was raised\u2014who is at the right hand of God, who indeed is interceding for us.</p>
<p>35 Who shall separate us from the love of Christ? Shall tribulation, or distress, or persecution, or famine, or nakedness, or danger, or sword? 36 As it is written, \u201CFor your sake we are being killed all the day long; we are regarded as sheep to be slaughtered.\u201D</p>
<p>37 No, in all these things we are more than conquerors through him who loved us. 38 For I am sure that neither death nor life, nor angels nor rulers, nor things present nor things to come, nor powers, 39 nor height nor depth, nor anything else in all creation, will be able to separate us from the love of God in Christ Jesus our Lord.</p>`,
    questions: `<h3>Look at verses 31-34</h3><ul><li>What does Paul mean by \u201CIf God is for us, who can be against us?\u201D</li><li>How does God\u2019s giving of his own Son prove his love?</li><li>Who can bring a charge against us or condemn us? Why?</li></ul><h3>Look at verses 35-39</h3><ul><li>What are the things that cannot separate us from the love of Christ?</li><li>What does it mean to be \u201Cmore than conquerors\u201D?</li><li>How comprehensive is the list in verses 38-39?</li></ul>`,
    answers: `<h3>Verses 31-34</h3>
<p>\u201CIf God is for us, who can be against us?\u201D is not saying no one will oppose us, but that no opposition can ultimately prevail against us. God proved he is for us by not sparing his own Son. Since God gave us the greatest gift (Jesus), we can trust him to provide everything else we need. No one can bring a charge against us because God himself has justified us. No one can condemn us because Christ died for us, was raised, and now intercedes for us at God\u2019s right hand.</p>
<h3>Verses 35-39</h3>
<p>Paul lists seven forms of suffering that might seem to separate us from Christ\u2019s love, but none of them can. \u201CMore than conquerors\u201D means we don\u2019t just barely survive \u2014 we triumph overwhelmingly through Christ\u2019s love. The list in verses 38-39 covers every possible category: death and life, supernatural powers, time (present and future), space (height and depth), and \u201Canything else in all creation.\u201D Nothing in all existence can separate us from God\u2019s love in Christ Jesus.</p>`,
    transcript: `<p><strong>More than conquerors through him who loved us.</strong></p>
<p>Romans 8 is the pinnacle of Paul\u2019s letter to the Romans. After explaining the problem of sin and the solution of grace, Paul reaches a triumphant conclusion.</p>
<p><strong>First, God is for us (31-34).</strong></p>
<p>Paul asks a series of rhetorical questions. If God is for us, who can be against us? God proved he is for us by giving his own Son. This is the ultimate proof of God\u2019s love. And since he gave us the greatest gift, he will surely give us all things. No one can accuse us because God has declared us righteous. No one can condemn us because Christ died, rose, and intercedes for us.</p>
<p><strong>Second, nothing can separate us from God\u2019s love (35-39).</strong></p>
<p>Paul lists every possible hardship \u2014 tribulation, distress, persecution, famine, nakedness, danger, sword. None of them can separate us from Christ\u2019s love. In fact, in all these things we are more than conquerors. We don\u2019t just survive; we triumph. Paul concludes with one of the most comprehensive statements in all of Scripture: neither death nor life, nor angels nor rulers, nor present nor future, nor powers, nor height nor depth, nor anything in all creation can separate us from the love of God in Christ Jesus our Lord.</p>`,
    attachments: [
      { name: "Romans 8 Study Guide.pdf", url: "#", type: "pdf" },
    ],
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
  },
  {
    id: "john-15",
    slug: "remain-in-my-love",
    title: "Remain in My Love",
    book: "John",
    passage: "John 15:9-17",
    datePosted: "2026-01-30",
    dateFor: "2026-02-01",
    series: "Sunday Message",
    messenger: "P. Kevin Albright",
    keyVerse: {
      verse: "John 15:12",
      text: "My command is this: Love each other as I have loved you.",
    },
    bibleText: `<h4>John 15:9-17 (ESV)</h4>
<p>9 As the Father has loved me, so have I loved you. Abide in my love. 10 If you keep my commandments, you will abide in my love, just as I have kept my Father\u2019s commandments and abide in his love. 11 These things I have spoken to you, that my joy may be in you, and that your joy may be full.</p>
<p>12 \u201CThis is my commandment, that you love one another as I have loved you. 13 Greater love has no one than this, that someone lay down his life for his friends. 14 You are my friends if you do what I command you. 15 No longer do I call you servants, for the servant does not know what his master is doing; but I have called you friends, for all that I have heard from my Father I have made known to you.</p>
<p>16 You did not choose me, but I chose you and appointed you that you should go and bear fruit and that your fruit should abide, so that whatever you ask the Father in my name, he may give it to you. 17 These things I command you, so that you will love one another.\u201D</p>`,
    questions: `<h3>Look at verses 9-11</h3><ul><li>How has Jesus loved us?</li><li>What is the condition for remaining in his love?</li><li>Why did Jesus tell us these things?</li></ul><h3>Look at verses 12-17</h3><ul><li>What is Jesus\u2019 command?</li><li>What is the greatest love?</li><li>What does Jesus call us and why?</li></ul>`,
    answers: `<h3>Verses 9-11</h3>
<p>Jesus loved us as the Father loved him \u2014 unconditionally and sacrificially. We remain in his love by keeping his commands. This is not earning his love, but living in the awareness and experience of it. Jesus told us these things so that his joy would be in us and our joy would be full. True joy comes from abiding in Christ\u2019s love.</p>
<h3>Verses 12-17</h3>
<p>Jesus\u2019 command is to love one another as he has loved us. The greatest expression of love is laying down one\u2019s life for friends. Jesus elevated his disciples from servants to friends \u2014 servants don\u2019t know the master\u2019s plans, but friends are trusted with the master\u2019s heart. We did not choose Jesus; he chose us. He appointed us to bear lasting fruit and to love one another.</p>`,
    transcript: `<p><strong>Remain in my love.</strong></p>
<p>In John 15, Jesus uses the imagery of the vine and branches. Here in verses 9-17, he focuses on the theme of love \u2014 his love for us, and our love for one another.</p>
<p><strong>First, abide in my love (9-11).</strong></p>
<p>Jesus says, \u201CAs the Father has loved me, so have I loved you.\u201D The love of God flows from Father to Son to us. We are invited to abide in this love. The condition is keeping his commandments \u2014 not as a burden, but as a natural response to being loved. The purpose is joy: \u201Cthat my joy may be in you, and that your joy may be full.\u201D</p>
<p><strong>Second, love one another (12-15).</strong></p>
<p>The command is clear: love each other as Jesus loved us. The measure of love is self-sacrifice \u2014 \u201Cgreater love has no one than this, that someone lay down his life for his friends.\u201D Jesus calls us friends, not servants. He has shared everything with us from the Father.</p>
<p><strong>Third, chosen to bear fruit (16-17).</strong></p>
<p>We did not choose Jesus; he chose us and appointed us to bear fruit that lasts. The foundation and goal of everything is love for one another.</p>`,
    attachments: [
      { name: "John 15 Study Guide.pdf", url: "#", type: "pdf" },
      { name: "John 15 Study Guide.docx", url: "#", type: "docx" },
    ],
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
  },
  {
    id: "genesis-12",
    slug: "the-call-of-abram",
    title: "The Call of Abram",
    book: "Genesis",
    passage: "Genesis 12:1-9",
    datePosted: "2026-01-23",
    dateFor: "2026-01-25",
    series: "Sunday Message",
    messenger: "P. Abraham Kim",
    keyVerse: {
      verse: "Genesis 12:2",
      text: "I will make you into a great nation, and I will bless you; I will make your name great, and you will be a blessing.",
    },
    bibleText: `<h4>Genesis 12:1-9 (ESV)</h4>
<p>1 Now the Lord said to Abram, \u201CGo from your country and your kindred and your father\u2019s house to the land that I will show you. 2 And I will make of you a great nation, and I will bless you and make your name great, so that you will be a blessing. 3 I will bless those who bless you, and him who dishonors you I will curse, and in you all the families of the earth shall be blessed.\u201D</p>
<p>4 So Abram went, as the Lord had told him, and Lot went with him. Abram was seventy-five years old when he departed from Haran. 5 And Abram took Sarai his wife, and Lot his brother\u2019s son, and all their possessions that they had gathered, and the people that they had acquired in Haran, and they set out to go to the land of Canaan. When they came to the land of Canaan, 6 Abram passed through the land to the place at Shechem, to the oak of Moreh. At that time the Canaanites were in the land.</p>
<p>7 Then the Lord appeared to Abram and said, \u201CTo your offspring I will give this land.\u201D So he built there an altar to the Lord, who had appeared to him. 8 From there he moved to the hill country on the east of Bethel and pitched his tent, with Bethel on the west and Ai on the east. And there he built an altar to the Lord and called upon the name of the Lord. 9 And Abram journeyed on, still going toward the Negeb.</p>`,
    questions: `<h3>Look at verses 1-3</h3><ul><li>What did God command Abram to do?</li><li>What promises did God make to Abram?</li><li>What is the significance of \u201CAll peoples on earth will be blessed through you\u201D?</li></ul><h3>Look at verses 4-9</h3><ul><li>How did Abram respond to God\u2019s call?</li><li>What did Abram do when he arrived in Canaan?</li></ul>`,
    answers: `<h3>Verses 1-3</h3>
<p>God commanded Abram to leave his country, his people, and his father\u2019s household. This was a call to leave behind everything familiar and secure. God made seven promises: a great nation, blessing, a great name, being a blessing, blessing those who bless him, cursing those who dishonor him, and all peoples being blessed through him. The promise that all families of the earth would be blessed through Abram points to the coming of Jesus Christ, through whom salvation comes to all nations.</p>
<h3>Verses 4-9</h3>
<p>Abram obeyed. At 75 years old, he left Haran and went to Canaan as God directed. When he arrived, God appeared again and promised the land to his offspring. Abram\u2019s response was to build altars and call on the name of the Lord. Building altars was an act of worship and a declaration of faith. Abram lived as a pilgrim, journeying through the land, trusting God\u2019s promise even though the Canaanites still occupied the land.</p>`,
    transcript: `<p><strong>The call of Abram.</strong></p>
<p>Genesis 12 marks a turning point in the Bible. After the stories of creation, the fall, the flood, and the tower of Babel, God now calls one man, Abram, through whom he will work to bless all nations.</p>
<p><strong>First, God\u2019s command and promise (1-3).</strong></p>
<p>God told Abram to leave everything \u2014 his country, his kindred, his father\u2019s house. This was not easy. But with the command came an extraordinary promise: God would make him a great nation, bless him, make his name great, and through him bless all families of the earth. The promise of blessing to all nations finds its ultimate fulfillment in Jesus Christ.</p>
<p><strong>Second, Abram\u2019s obedience (4-9).</strong></p>
<p>The response was simple and beautiful: \u201CSo Abram went, as the Lord had told him.\u201D At seventy-five years old, he left everything behind and set out for an unknown land. When he arrived in Canaan, he built altars to the Lord. His life became a journey of faith, worship, and obedience. He teaches us that faith is not understanding everything but trusting God enough to obey.</p>`,
    attachments: [
      { name: "Genesis 12 Study Guide.pdf", url: "#", type: "pdf" },
    ],
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
  },
  {
    id: "acts-2",
    slug: "the-day-of-pentecost",
    title: "The Day of Pentecost",
    book: "Acts",
    passage: "Acts 2:1-21",
    datePosted: "2026-01-16",
    dateFor: "2026-01-18",
    series: "Sunday Message",
    messenger: "P. Samuel Lee",
    keyVerse: {
      verse: "Acts 2:17",
      text: "In the last days, God says, I will pour out my Spirit on all people. Your sons and daughters will prophesy, your young men will see visions, your old men will dream dreams.",
    },
    bibleText: `<h4>Acts 2:1-21 (ESV)</h4>
<p>1 When the day of Pentecost arrived, they were all together in one place. 2 And suddenly there came from heaven a sound like a mighty rushing wind, and it filled the entire house where they were sitting. 3 And divided tongues as of fire appeared to them and rested on each one of them. 4 And they were all filled with the Holy Spirit and began to speak in other tongues as the Spirit gave them utterance.</p>
<p>5 Now there were dwelling in Jerusalem Jews, devout men from every nation under heaven. 6 And at this sound the multitude came together, and they were bewildered, because each one was hearing them speak in his own language. 7 And they were amazed and astonished, saying, \u201CAre not all these who are speaking Galileans? 8 And how is it that we hear, each of us in his own native language? 9 Parthians and Medes and Elamites and residents of Mesopotamia, Judea and Cappadocia, Pontus and Asia, 10 Phrygia and Pamphylia, Egypt and the parts of Libya belonging to Cyrene, and visitors from Rome, 11 both Jews and proselytes, Cretans and Arabians\u2014we hear them telling in our own tongues the mighty works of God.\u201D 12 And all were amazed and perplexed, saying to one another, \u201CWhat does this mean?\u201D 13 But others mocking said, \u201CThey are filled with new wine.\u201D</p>
<p>14 But Peter, standing with the eleven, lifted up his voice and addressed them: \u201CMen of Judea and all who dwell in Jerusalem, let this be known to you, and give ear to my words. 15 For these people are not drunk, as you suppose, since it is only the third hour of the day. 16 But this is what was uttered through the prophet Joel:</p>
<p>17 \u201CAnd in the last days it shall be, God declares, that I will pour out my Spirit on all flesh, and your sons and your daughters shall prophesy, and your young men shall see visions, and your old men shall dream dreams; 18 even on my male servants and female servants in those days I will pour out my Spirit, and they shall prophesy. 19 And I will show wonders in the heavens above and signs on the earth below, blood, and fire, and vapor of smoke; 20 the sun shall be turned to darkness and the moon to blood, before the day of the Lord comes, the great and magnificent day. 21 And it shall come to pass that everyone who calls upon the name of the Lord shall be saved.\u201D</p>`,
    questions: `<h3>Look at verses 1-4</h3><ul><li>What happened on the day of Pentecost?</li><li>What were the signs of the Holy Spirit\u2019s coming?</li></ul><h3>Look at verses 5-13</h3><ul><li>Who was present and how did they react?</li><li>What did the crowd think was happening?</li></ul><h3>Look at verses 14-21</h3><ul><li>How did Peter explain the event?</li><li>What Old Testament prophecy did he quote?</li></ul>`,
    answers: `<h3>Verses 1-4</h3>
<p>The Holy Spirit came with the sound of a mighty rushing wind and tongues of fire resting on each person. They were all filled with the Holy Spirit and began to speak in other tongues. The wind symbolizes the Spirit\u2019s power; the fire symbolizes purification and God\u2019s presence. Speaking in tongues enabled the disciples to proclaim God\u2019s works to people of every language.</p>
<h3>Verses 5-13</h3>
<p>Devout Jews from every nation were in Jerusalem for the feast. They were amazed to hear Galileans speaking in their native languages about God\u2019s mighty works. Some were perplexed; others mocked, saying the disciples were drunk. The list of nations shows the universal scope of God\u2019s work.</p>
<h3>Verses 14-21</h3>
<p>Peter stood up and explained that this was the fulfillment of Joel\u2019s prophecy. God was pouring out his Spirit on all people \u2014 sons and daughters, young and old, servants and free. The prophecy concludes with the promise that \u201Ceveryone who calls on the name of the Lord shall be saved.\u201D This is the birth of the church and the beginning of God\u2019s mission to all nations.</p>`,
    transcript: `<p><strong>The Day of Pentecost.</strong></p>
<p>Acts 2 describes the birth of the church. The Holy Spirit came upon the disciples, empowering them to be witnesses.</p>
<p><strong>First, the coming of the Holy Spirit (1-4).</strong></p>
<p>On the day of Pentecost, the disciples were together in one place. Suddenly a sound like a mighty wind filled the house, and tongues of fire rested on each of them. They were filled with the Holy Spirit and began to speak in other languages. This was the fulfillment of Jesus\u2019 promise that the Spirit would come and empower them.</p>
<p><strong>Second, the crowd\u2019s reaction (5-13).</strong></p>
<p>Jews from every nation heard the disciples speaking in their own languages. They were amazed and bewildered. Some asked sincerely, \u201CWhat does this mean?\u201D Others mocked. This is always the response to the work of the Spirit \u2014 some are drawn and some resist.</p>
<p><strong>Third, Peter\u2019s explanation (14-21).</strong></p>
<p>Peter stood up boldly \u2014 this was the same Peter who had denied Jesus three times. Now filled with the Spirit, he proclaimed that this was the fulfillment of Joel\u2019s prophecy. God is pouring out his Spirit on all people. And the great promise is this: everyone who calls on the name of the Lord shall be saved.</p>`,
    attachments: [
      { name: "Acts 2 Study Guide.pdf", url: "#", type: "pdf" },
    ],
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
  },
  {
    id: "ephesians-2",
    slug: "saved-by-grace-through-faith",
    title: "Saved by Grace Through Faith",
    book: "Ephesians",
    passage: "Ephesians 2:1-10",
    datePosted: "2026-01-09",
    dateFor: "2026-01-11",
    series: "Sunday Message",
    messenger: "P. David Kim",
    keyVerse: {
      verse: "Ephesians 2:8-9",
      text: "For it is by grace you have been saved, through faith\u2014and this is not from yourselves, it is the gift of God\u2014not by works, so that no one can boast.",
    },
    bibleText: `<h4>Ephesians 2:1-10 (ESV)</h4>
<p>1 And you were dead in the trespasses and sins 2 in which you once walked, following the course of this world, following the prince of the power of the air, the spirit that is now at work in the sons of disobedience\u2014 3 among whom we all once lived in the passions of our flesh, carrying out the desires of the body and the mind, and were by nature children of wrath, like the rest of mankind.</p>
<p>4 But God, being rich in mercy, because of the great love with which he loved us, 5 even when we were dead in our trespasses, made us alive together with Christ\u2014by grace you have been saved\u2014 6 and raised us up with him and seated us with him in the heavenly places in Christ Jesus, 7 so that in the coming ages he might show the immeasurable riches of his grace in kindness toward us in Christ Jesus.</p>
<p>8 For by grace you have been saved through faith. And this is not your own doing; it is the gift of God, 9 not a result of works, so that no one may boast. 10 For we are his workmanship, created in Christ Jesus for good works, which God prepared beforehand, that we should walk in them.</p>`,
    questions: `<h3>Look at verses 1-3</h3><ul><li>How does Paul describe our former condition?</li><li>What does it mean to be \u201Cdead in transgressions\u201D?</li></ul><h3>Look at verses 4-7</h3><ul><li>What motivated God to save us?</li><li>What did God do for us through Christ?</li></ul><h3>Look at verses 8-10</h3><ul><li>How are we saved?</li><li>What is the purpose of our salvation?</li></ul>`,
    answers: `<h3>Verses 1-3</h3>
<p>Paul describes our former condition as spiritual death. We were dead in trespasses and sins, following the ways of the world, the devil, and our own sinful nature. \u201CDead in transgressions\u201D means we were completely unable to save ourselves, just as a dead person cannot make themselves alive. We were by nature children of wrath \u2014 this applied to everyone without exception.</p>
<h3>Verses 4-7</h3>
<p>\u201CBut God\u201D \u2014 these two words change everything. What motivated God was his rich mercy and great love. Even when we were dead in sin, God made us alive with Christ, raised us up, and seated us with Christ in heavenly places. This is entirely by grace. God did this to display the immeasurable riches of his grace for all ages to come.</p>
<h3>Verses 8-10</h3>
<p>We are saved by grace through faith, not by works. Salvation is God\u2019s gift so no one can boast. Yet we are created for good works \u2014 works God prepared in advance. Grace and works are not opposed: grace saves us, and grace empowers us to do the good works God planned for us.</p>`,
    transcript: `<p><strong>Saved by grace through faith.</strong></p>
<p>Ephesians 2 contains the clearest summary of the gospel in Paul\u2019s letters. By grace you have been saved through faith \u2014 and this is not from yourselves, it is the gift of God.</p>
<p><strong>First, our hopeless condition (1-3).</strong></p>
<p>Paul paints a dark picture of our former state. We were dead in trespasses and sins. Not sick, not struggling \u2014 dead. We followed the world, the devil, and our own sinful desires. We were objects of wrath. This is the bad news that makes the good news so good.</p>
<p><strong>Second, God\u2019s rich mercy (4-7).</strong></p>
<p>\u201CBut God\u201D \u2014 the most important two words in the Bible. Rich in mercy, great in love, God made us alive with Christ even when we were dead. He raised us up and seated us with Christ. This is past, present, and future grace all at once. And God did this to show the coming ages the incredible riches of his grace.</p>
<p><strong>Third, saved for a purpose (8-10).</strong></p>
<p>By grace, through faith, not by works. This is God\u2019s gift. But verse 10 shows the other side: we are God\u2019s masterpiece, created in Christ Jesus for good works that God prepared beforehand. We are saved not by good works but for good works. Grace is both the foundation and the fuel of the Christian life.</p>`,
    attachments: [
      { name: "Ephesians 2 Study Guide.pdf", url: "#", type: "pdf" },
    ],
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
  },
  {
    id: "john-17",
    slug: "not-of-the-world",
    title: "Not Of The World",
    book: "John",
    passage: "John 17:14-26",
    datePosted: "2026-01-02",
    dateFor: "2026-01-04",
    series: "Sunday Message",
    messenger: "P. William Larsen",
    keyVerse: {
      verse: "John 17:14",
      text: "I have given them your word, and the world has hated them because they are not of the world, just as I am not of the world.",
    },
    bibleText: `<h4>John 17:14-26 (ESV)</h4>
<p>14 I have given them your word, and the world has hated them because they are not of the world, just as I am not of the world. 15 I do not ask that you take them out of the world, but that you keep them from the evil one. 16 They are not of the world, just as I am not of the world. 17 Sanctify them in the truth; your word is truth. 18 As you sent me into the world, so I have sent them into the world. 19 And for their sake I consecrate myself, that they also may be sanctified in truth.</p>
<p>20 I do not ask for these only, but also for those who will believe in me through their word, 21 that they may all be one, just as you, Father, are in me, and I in you, that they also may be in us, so that the world may believe that you have sent me. 22 The glory that you have given me I have given to them, that they may be one even as we are one, 23 I in them and you in me, that they may become perfectly one, so that the world may know that you sent me and loved them even as you loved me.</p>
<p>24 Father, I desire that they also, whom you have given me, may be with me where I am, to see my glory that you have given me because you loved me before the foundation of the world. 25 O righteous Father, even though the world does not know you, I know you, and these know that you have sent me. 26 I made known to them your name, and I will continue to make it known, that the love with which you have loved me may be in them, and I in them.\u201D</p>`,
    questions: `<h3>V14-19</h3><ul><li>What has Jesus given us? How does the world treat those who follow Jesus\u2019s words and why?</li><li>What did Jesus not ask God for? Instead, what did he ask God to do for his disciples and why?</li><li>What purpose does Jesus have for sending us into the world?</li></ul><h3>V20-23</h3><ul><li>For whom did Jesus also ask God for these things?</li><li>Why does Jesus want all believers to be united as one?</li></ul><h3>V24-26</h3><ul><li>What does Jesus desire and why?</li><li>What did Jesus make known to his disciples, and why does he continue to make it known?</li></ul>`,
    answers: `<h3>Verses 14-19</h3>
<p>Jesus gave them God\u2019s word. The world hates them because they are not of the world \u2014 their values, priorities, and allegiance have changed. Jesus does not pray to take them out of the world but to protect them from the evil one. He wants them sanctified \u2014 set apart \u2014 in truth, which is God\u2019s word. Just as the Father sent Jesus into the world, Jesus sends us into the world with a mission: to be agents of truth and grace.</p>
<h3>Verses 20-23</h3>
<p>Jesus prays not only for his immediate disciples but for all future believers \u2014 including us. He prays that we may be one, just as the Father and Son are one. The purpose of our unity is so that the world may believe and know that God sent Jesus. Our oneness is a powerful witness to the world. The glory Jesus received from the Father, he gave to us, so we might be perfectly united.</p>
<h3>Verses 24-26</h3>
<p>Jesus\u2019 deepest desire is that we be with him and see his glory. He wants us to know the Father\u2019s love and to have that same love dwelling in us. Jesus has made the Father\u2019s name known and will continue to do so, so that God\u2019s love fills us and Christ himself is in us.</p>`,
    transcript: `<p><strong>Not of the world.</strong></p>
<p>John 17 is Jesus\u2019 high priestly prayer. In this portion, Jesus prays for his disciples and all future believers.</p>
<p><strong>First, protection and sanctification (14-19).</strong></p>
<p>Jesus has given us God\u2019s word, and because of this, the world hates us. But Jesus does not ask God to take us out of the world. Instead, he asks for protection from the evil one and sanctification through truth. God\u2019s word is truth, and it sets us apart. We are sent into the world with a purpose \u2014 not to escape it but to be God\u2019s witnesses in it.</p>
<p><strong>Second, unity for witness (20-23).</strong></p>
<p>Jesus prays for all who will believe through the disciples\u2019 testimony \u2014 that includes us today. His prayer is for unity. Not organizational unity, but the deep spiritual oneness that mirrors the unity between Father and Son. This unity is the most powerful witness to the world that God sent Jesus.</p>
<p><strong>Third, the ultimate desire (24-26).</strong></p>
<p>Jesus\u2019 greatest desire is that we be with him and see his glory. He wants the Father\u2019s love to be in us and he himself to dwell in us. This is the goal of redemption: to bring us into the eternal love relationship between Father and Son.</p>`,
    attachments: [
      { name: "John 17 Study Guide.pdf", url: "#", type: "pdf" },
      { name: "John 17 Study Guide.docx", url: "#", type: "docx" },
    ],
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
  },
  {
    id: "psalm-136",
    slug: "his-steadfast-love-endures-forever",
    title: "His Steadfast Love Endures Forever",
    book: "Psalms",
    passage: "Psalms 136:1-26",
    datePosted: "2025-12-12",
    dateFor: "2025-12-14",
    series: "Sunday Message",
    messenger: "Paul Kim",
    keyVerse: {
      verse: "Psalms 136:1",
      text: "Give thanks to the Lord, for he is good, for his steadfast love endures forever.",
    },
    bibleText: `<h4>Psalms 136:1-26 (ESV)</h4>
<p>1 Give thanks to the Lord, for he is good, for his steadfast love endures forever. 2 Give thanks to the God of gods, for his steadfast love endures forever. 3 Give thanks to the Lord of lords, for his steadfast love endures forever;</p>
<p>4 to him who alone does great wonders, for his steadfast love endures forever; 5 to him who by understanding made the heavens, for his steadfast love endures forever; 6 to him who spread out the earth above the waters, for his steadfast love endures forever; 7 to him who made the great lights, for his steadfast love endures forever; 8 the sun to rule over the day, for his steadfast love endures forever; 9 the moon and stars to rule over the night, for his steadfast love endures forever;</p>
<p>10 to him who struck down the firstborn of Egypt, for his steadfast love endures forever; 11 and brought Israel out from among them, for his steadfast love endures forever; 12 with a strong hand and an outstretched arm, for his steadfast love endures forever; 13 to him who divided the Red Sea in two, for his steadfast love endures forever; 14 and made Israel pass through the midst of it, for his steadfast love endures forever; 15 but overthrew Pharaoh and his host in the Red Sea, for his steadfast love endures forever;</p>
<p>16 to him who led his people through the wilderness, for his steadfast love endures forever; 17 to him who struck down great kings, for his steadfast love endures forever; 18 and killed mighty kings, for his steadfast love endures forever; 19 Sihon, king of the Amorites, for his steadfast love endures forever; 20 and Og, king of Bashan, for his steadfast love endures forever; 21 and gave their land as a heritage, for his steadfast love endures forever; 22 a heritage to Israel his servant, for his steadfast love endures forever.</p>
<p>23 It is he who remembered us in our low estate, for his steadfast love endures forever; 24 and rescued us from our foes, for his steadfast love endures forever; 25 he who gives food to all flesh, for his steadfast love endures forever. 26 Give thanks to the God of heaven, for his steadfast love endures forever.</p>`,
    questions: `<h3>Look at verses 1-3</h3><ul><li>Why should we give thanks to the Lord?</li><li>What titles are given to God and what do they mean?</li></ul><h3>Look at verses 4-9</h3><ul><li>What does God\u2019s work of creation reveal about him?</li></ul><h3>Look at verses 10-22</h3><ul><li>What events from Israel\u2019s history does the psalmist recount?</li><li>What is the refrain and why is it repeated?</li></ul><h3>Look at verses 23-26</h3><ul><li>How does the psalm apply personally to us?</li><li>What is the significance of the ending?</li></ul>`,
    answers: `<h3>Verses 1-3</h3>
<p>The Lord is good, the God of gods and Lord of lords. His creation reveals his power and wisdom. These titles establish God\u2019s absolute sovereignty over all other powers and authorities.</p>
<h3>Verses 4-9</h3>
<p>God\u2019s creation \u2014 the heavens, earth, sun, moon, and stars \u2014 reveals his understanding, power, and care. Each act of creation is an expression of his steadfast love.</p>
<h3>Verses 10-22</h3>
<p>The psalmist recounts the Exodus: striking down Egypt\u2019s firstborn, bringing Israel out, dividing the Red Sea, leading through the wilderness, defeating kings, and giving the land as an inheritance. Each event demonstrates God\u2019s faithful love in action. The refrain \u201CHis steadfast love endures forever\u201D is repeated 26 times to emphasize that God\u2019s love is constant, unchanging, and eternal.</p>
<h3>Verses 23-26</h3>
<p>The psalm becomes personal: \u201CHe remembered us in our low estate.\u201D God notices us when we are at our lowest. He rescues and provides for all. The psalm ends as it began \u2014 with thanksgiving to the God of heaven whose love endures forever.</p>`,
    transcript: `<p><strong>His steadfast love endures forever.</strong></p>
<p>Psalm 136 is a psalm of thanksgiving. The psalmist invites God\u2019s people to give thanks to the Lord because he is good and his steadfast love endures forever.</p>
<p><strong>First, God the Creator (1-9).</strong></p>
<p>The psalm begins by calling us to give thanks. God is the God of gods and Lord of lords. He made the heavens, spread out the earth, and set the sun, moon, and stars in place. Every act of creation is motivated by his steadfast love.</p>
<p><strong>Second, God the Redeemer (10-22).</strong></p>
<p>The psalmist recounts the great story of the Exodus \u2014 striking Egypt, parting the Red Sea, leading through the wilderness, defeating kings, giving the Promised Land. Each event shows God\u2019s powerful, faithful love in action. The refrain echoes 26 times: his steadfast love endures forever.</p>
<p><strong>Third, God our Provider (23-26).</strong></p>
<p>The psalm concludes personally: God remembered us in our lowest moments, rescued us from our enemies, and gives food to all living things. He is not a distant God but a near and caring one. Give thanks to the God of heaven, for his steadfast love endures forever.</p>`,
    attachments: [
      { name: "Psalm 136 Study Guide.pdf", url: "#", type: "pdf" },
    ],
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
  },
  {
    id: "advent-3",
    slug: "to-worship-him",
    title: "To Worship Him: Joy for a Broken World",
    book: "Matthew",
    passage: "Matthew 2:1-12",
    datePosted: "2025-12-05",
    dateFor: "2025-12-07",
    series: "Advent 2025",
    messenger: "Theo Woessner",
    keyVerse: {
      verse: "Matthew 2:11",
      text: "On coming to the house, they saw the child with his mother Mary, and they bowed down and worshiped him. Then they opened their treasures and presented him with gifts of gold, frankincense and myrrh.",
    },
    bibleText: `<h4>Matthew 2:1-12 (ESV)</h4>
<p>1 Now after Jesus was born in Bethlehem of Judea in the days of Herod the king, behold, wise men from the east came to Jerusalem, 2 saying, \u201CWhere is he who has been born king of the Jews? For we saw his star when it rose and have come to worship him.\u201D 3 When Herod the king heard this, he was troubled, and all Jerusalem with him; 4 and assembling all the chief priests and scribes of the people, he inquired of them where the Christ was to be born. 5 They told him, \u201CIn Bethlehem of Judea, for so it is written by the prophet:</p>
<p>6 \u201CAnd you, O Bethlehem, in the land of Judah, are by no means least among the rulers of Judah; for from you shall come a ruler who will shepherd my people Israel.\u201D</p>
<p>7 Then Herod summoned the wise men secretly and ascertained from them what time the star had appeared. 8 And he sent them to Bethlehem, saying, \u201CGo and search diligently for the child, and when you have found him, bring me word, that I too may come and worship him.\u201D 9 After listening to the king, they went on their way. And behold, the star that they had seen when it rose went before them until it came to rest over the place where the child was. 10 When they saw the star, they rejoiced exceedingly with great joy.</p>
<p>11 And going into the house, they saw the child with Mary his mother, and they fell down and worshiped him. Then, opening their treasures, they offered him gifts, gold and frankincense and myrrh. 12 And being warned in a dream not to return to Herod, they departed to their own country by another way.</p>`,
    questions: `<h3>Look at verses 1-6</h3><ul><li>Who came to Jerusalem and why?</li><li>How did King Herod respond to the news?</li><li>What does Herod\u2019s reaction reveal about him?</li></ul><h3>Look at verses 7-12</h3><ul><li>What did Herod tell the wise men? What were his true intentions?</li><li>What did the Magi do when they found Jesus?</li><li>What is the significance of the gifts they brought?</li></ul>`,
    answers: `<h3>Verses 1-6</h3>
<p>The Magi came from the East, following a star, to worship the newborn King of the Jews. Herod was disturbed because he saw Jesus as a threat to his power. All Jerusalem was troubled with him. Herod consulted the chief priests and scribes, who quoted Micah 5:2 \u2014 the Christ was to be born in Bethlehem. Herod\u2019s reaction reveals his insecurity and desire to eliminate any rival to his throne.</p>
<h3>Verses 7-12</h3>
<p>Herod secretly summoned the wise men and told them to report back so he could \u201Cworship\u201D too \u2014 but his real intent was to kill the child. The star led the wise men to Jesus, and when they found him, they fell down and worshiped. They offered gifts: gold (kingship), frankincense (deity), and myrrh (suffering and death). Warned in a dream, they returned home by another route. The gifts prophetically point to who Jesus is: King, God, and Savior who would suffer for us.</p>`,
    transcript: `<p><strong>To Worship Him: Joy for a Broken World.</strong></p>
<p>In Advent we prepare our hearts for Christmas. Today we look at the Magi who traveled far to worship Jesus, bringing joy to a broken world.</p>
<p><strong>First, the search for the King (1-6).</strong></p>
<p>Wise men from the East saw a star and came to Jerusalem seeking the newborn King of the Jews. Their journey was long and costly. Herod was troubled \u2014 he feared any rival to his throne. The religious leaders knew the Scriptures pointed to Bethlehem but did not go themselves. Sometimes those closest to the truth are farthest from responding to it.</p>
<p><strong>Second, worship and joy (7-12).</strong></p>
<p>The star led the Magi to Jesus. When they saw it, they \u201Crejoiced exceedingly with great joy.\u201D They fell down and worshiped. They opened their treasures: gold for a king, frankincense for God, myrrh for one who would suffer and die. True worship involves giving our best to Jesus. The Magi teach us that seeking Jesus with all our heart leads to overwhelming joy, even in a broken world.</p>`,
    attachments: [
      { name: "Advent Week 3 Study Guide.pdf", url: "#", type: "pdf" },
    ],
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
  },
  {
    id: "advent-2",
    slug: "prepare-the-way",
    title: "Prepare the Way for the Lord",
    book: "Mark",
    passage: "Mark 1:1-8",
    datePosted: "2025-11-28",
    dateFor: "2025-11-30",
    series: "Advent 2025",
    messenger: "David Kim",
    keyVerse: {
      verse: "Mark 1:3",
      text: "A voice of one calling in the wilderness, \u2018Prepare the way for the Lord, make straight paths for him.\u2019",
    },
    bibleText: `<h4>Mark 1:1-8 (ESV)</h4>
<p>1 The beginning of the gospel of Jesus Christ, the Son of God.</p>
<p>2 As it is written in Isaiah the prophet, \u201CBehold, I send my messenger before your face, who will prepare your way, 3 the voice of one crying in the wilderness: \u2018Prepare the way of the Lord, make his paths straight,\u2019\u201D</p>
<p>4 John appeared, baptizing in the wilderness and proclaiming a baptism of repentance for the forgiveness of sins. 5 And all the country of Judea and all Jerusalem were going out to him and were being baptized by him in the river Jordan, confessing their sins. 6 Now John was clothed with camel\u2019s hair and wore a leather belt around his waist and ate locusts and wild honey. 7 And he preached, saying, \u201CAfter me comes he who is mightier than I, the strap of whose sandals I am not worthy to stoop down and untie. 8 I have baptized you with water, but he will baptize you with the Holy Spirit.\u201D</p>`,
    questions: `<h3>Look at verses 1-3</h3><ul><li>How does Mark begin his gospel?</li><li>What Old Testament prophecy does he quote?</li></ul><h3>Look at verses 4-8</h3><ul><li>Who was John the Baptist and what was his message?</li><li>How did John describe the one coming after him?</li><li>What is the difference between John\u2019s baptism and Jesus\u2019 baptism?</li></ul>`,
    answers: `<h3>Verses 1-3</h3>
<p>Mark begins with a bold declaration: this is the beginning of the gospel of Jesus Christ, the Son of God. He immediately quotes Isaiah\u2019s prophecy about a messenger who would prepare the way for the Lord. This connects Jesus to the long-awaited fulfillment of God\u2019s promises. The messenger is John the Baptist.</p>
<h3>Verses 4-8</h3>
<p>John appeared in the wilderness, preaching repentance and baptizing for the forgiveness of sins. Crowds from all over Judea and Jerusalem came to him. His simple lifestyle (camel\u2019s hair, locusts, wild honey) showed his radical dedication to God\u2019s mission. John described the coming one as far mightier \u2014 so great that John was not worthy even to untie his sandals. John baptized with water (an outward sign), but Jesus would baptize with the Holy Spirit (an inward transformation).</p>`,
    transcript: `<p><strong>Prepare the way for the Lord.</strong></p>
<p>Mark\u2019s gospel begins with urgency. There is no genealogy, no birth narrative \u2014 Mark plunges straight into the action with John the Baptist preparing the way for Jesus.</p>
<p><strong>First, the beginning of the gospel (1-3).</strong></p>
<p>Mark declares this is \u201Cthe beginning of the gospel of Jesus Christ, the Son of God.\u201D He quotes Isaiah\u2019s prophecy about a voice crying in the wilderness to prepare the Lord\u2019s way. Advent is about preparation \u2014 making our hearts ready for the coming King.</p>
<p><strong>Second, John the Baptist\u2019s ministry (4-8).</strong></p>
<p>John came baptizing and preaching repentance. His lifestyle was radical: camel\u2019s hair clothing, locusts and honey. People came from everywhere, confessing their sins. John\u2019s humility is remarkable: the one coming after him is so much greater that John is not worthy to be his servant. John baptized with water, but Jesus would baptize with the Holy Spirit. This Advent, let us prepare the way for the Lord in our hearts through repentance and humility.</p>`,
    attachments: [
      { name: "Advent Week 2 Study Guide.pdf", url: "#", type: "pdf" },
    ],
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
  },
  {
    id: "colossians-3",
    slug: "christ-is-all",
    title: "Christ is All, and is in All",
    book: "Colossians",
    passage: "Colossians 3:1-17",
    datePosted: "2025-11-21",
    dateFor: "2025-11-23",
    series: "Sunday Message",
    messenger: "Sarah Park",
    keyVerse: {
      verse: "Colossians 3:11",
      text: "Here there is no Gentile or Jew, circumcised or uncircumcised, barbarian, Scythian, slave or free, but Christ is all, and is in all.",
    },
    bibleText: `<h4>Colossians 3:1-17 (ESV)</h4>
<p>1 If then you have been raised with Christ, seek the things that are above, where Christ is, seated at the right hand of God. 2 Set your minds on things that are above, not on things that are on earth. 3 For you have died, and your life is hidden with Christ in God. 4 When Christ who is your life appears, then you also will appear with him in glory.</p>
<p>5 Put to death therefore what is earthly in you: sexual immorality, impurity, passion, evil desire, and covetousness, which is idolatry. 6 On account of these the wrath of God is coming. 7 In these you too once walked, when you were living in them. 8 But now you must put them all away: anger, wrath, malice, slander, and obscene talk from your mouth. 9 Do not lie to one another, seeing that you have put off the old self with its practices 10 and have put on the new self, which is being renewed in knowledge after the image of its creator. 11 Here there is not Greek and Jew, circumcised and uncircumcised, barbarian, Scythian, slave, free; but Christ is all, and in all.</p>
<p>12 Put on then, as God\u2019s chosen ones, holy and beloved, compassionate hearts, kindness, humility, meekness, and patience, 13 bearing with one another and, if one has a complaint against another, forgiving each other; as the Lord has forgiven you, so you also must forgive. 14 And above all these put on love, which binds everything together in perfect harmony. 15 And let the peace of Christ rule in your hearts, to which indeed you were called in one body. And be thankful. 16 Let the word of Christ dwell in you richly, teaching and admonishing one another in all wisdom, singing psalms and hymns and spiritual songs, with thankfulness in your hearts to God. 17 And whatever you do, in word or deed, do everything in the name of the Lord Jesus, giving thanks to God the Father through him.</p>`,
    questions: `<h3>Look at verses 1-4</h3><ul><li>What should we set our hearts and minds on?</li><li>What does it mean that our life is hidden with Christ in God?</li></ul><h3>Look at verses 5-11</h3><ul><li>What should we put to death and take off?</li><li>What is the new self?</li></ul><h3>Look at verses 12-17</h3><ul><li>What should we clothe ourselves with?</li><li>What is the \u201Cperfect bond of unity\u201D?</li></ul>`,
    answers: `<h3>Verses 1-4</h3>
<p>We should set our minds on things above because our life is now hidden with Christ. This means our true identity is in Christ, not in worldly status or achievements. When Christ appears in glory, we will appear with him. Living with an eternal perspective transforms how we handle daily life.</p>
<h3>Verses 5-11</h3>
<p>We put off the old self with its practices and put on the new self, being renewed in knowledge after the image of its creator. The old self includes sexual immorality, impurity, greed, anger, malice, slander, and lying. In the new self, all human distinctions are overcome \u2014 Christ is all and in all.</p>
<h3>Verses 12-17</h3>
<p>As God\u2019s chosen people, we clothe ourselves with compassion, kindness, humility, gentleness, and patience. We bear with each other and forgive as the Lord forgave us. Above all, we put on love, which is the perfect bond of unity. We let Christ\u2019s peace rule our hearts, his word dwell in us richly, and do everything in Jesus\u2019 name with thanksgiving.</p>`,
    transcript: `<p><strong>Christ is all, and is in all.</strong></p>
<p>Paul calls the Colossians to live out their new identity in Christ by setting their minds on things above and putting on the virtues of Christ.</p>
<p><strong>First, the new perspective (1-4).</strong></p>
<p>Since we have been raised with Christ, we are to seek things above. Our life is hidden with Christ in God. This gives us an entirely new perspective on life. We no longer define ourselves by earthly standards but by our union with Christ.</p>
<p><strong>Second, put off the old, put on the new (5-11).</strong></p>
<p>Paul lists the sins we must put to death: sexual immorality, impurity, greed, anger, malice, slander, lying. These belonged to our old self. The new self is being renewed in the image of its creator. In Christ, all human divisions are overcome \u2014 Christ is all and in all.</p>
<p><strong>Third, clothe yourselves in Christ\u2019s virtues (12-17).</strong></p>
<p>As God\u2019s chosen ones, we put on compassion, kindness, humility, gentleness, patience, forgiveness, and above all, love. Let Christ\u2019s peace rule in your hearts. Let his word dwell in you richly. Whatever you do, do it in Jesus\u2019 name. This is the picture of a life fully transformed by the gospel.</p>`,
    attachments: [
      { name: "Colossians 3 Study Guide.pdf", url: "#", type: "pdf" },
    ],
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
  },
  {
    id: "colossians-3b",
    slug: "set-your-minds-on-things-above",
    title: "Set Your Minds on Things Above",
    book: "Colossians",
    passage: "Colossians 3:1-4",
    datePosted: "2025-11-14",
    dateFor: "2025-11-16",
    series: "Sunday Message",
    messenger: "John Doe",
    keyVerse: {
      verse: "Colossians 3:2",
      text: "Set your minds on things that are above, not on things that are on earth.",
    },
    bibleText: `<h4>Colossians 3:1-4 (ESV)</h4>
<p>1 If then you have been raised with Christ, seek the things that are above, where Christ is, seated at the right hand of God. 2 Set your minds on things that are above, not on things that are on earth. 3 For you have died, and your life is hidden with Christ in God. 4 When Christ who is your life appears, then you also will appear with him in glory.</p>`,
    questions: `<h3>Look at verses 1-2</h3><ul><li>What is the condition: \u201CSince you have been raised with Christ\u201D?</li><li>What does it mean practically to set our hearts on things above?</li></ul><h3>Look at verses 3-4</h3><ul><li>What does it mean that we have died and our life is hidden with Christ?</li><li>What promise does verse 4 hold?</li></ul>`,
    answers: `<h3>Verses 1-2</h3>
<p>The condition \u201Csince you have been raised with Christ\u201D refers to our spiritual union with Christ through faith and baptism. Because we have been raised with him, we are to seek and set our minds on things above \u2014 where Christ is, seated at God\u2019s right hand. Practically, this means prioritizing eternal realities over temporary earthly concerns: pursuing God\u2019s kingdom, growing in faith, loving others, and keeping an eternal perspective in daily decisions.</p>
<h3>Verses 3-4</h3>
<p>\u201CYou have died\u201D means our old self died with Christ. Our true life is now hidden with Christ in God \u2014 secure, protected, and not yet fully revealed. The world may not see who we truly are, but when Christ appears in glory, our true identity will be revealed with him. Verse 4 holds the promise of future glory: we will share in Christ\u2019s glory when he returns. This hope sustains us through every difficulty.</p>`,
    transcript: `<p><strong>Set your minds on things above.</strong></p>
<p>These four verses are the foundation for everything that follows in Colossians 3. Paul gives us the reason and the method for Christian living.</p>
<p><strong>First, seek things above (1-2).</strong></p>
<p>\u201CIf you have been raised with Christ\u201D \u2014 this is the starting point. Our new life begins with what God has done. Because we are raised with Christ, we seek things above. This is not escapism but a radical reorientation of priorities. We set our minds on eternal realities: God\u2019s word, God\u2019s kingdom, God\u2019s purposes.</p>
<p><strong>Second, hidden with Christ (3-4).</strong></p>
<p>We have died with Christ, and our life is now hidden with him in God. This means our identity is secure in Christ, regardless of circumstances. The world may not understand us, but our life is kept safe in God. And the best is yet to come: when Christ appears, we will appear with him in glory. This future hope transforms how we live today.</p>`,
    attachments: [
      { name: "Colossians 3:1-4 Study Guide.pdf", url: "#", type: "pdf" },
    ],
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
  },
  {
    id: "exodus-2",
    slug: "watered-the-flock",
    title: "Watered The Flock",
    book: "Exodus",
    passage: "Exodus 2:11-22",
    datePosted: "2024-01-22",
    dateFor: "2024-01-24",
    series: "Sunday Message",
    messenger: "P. Abraham Kim",
    keyVerse: {
      verse: "Exodus 2:17",
      text: "The shepherds came and drove them away, but Moses stood up and saved them, and watered their flock.",
    },
    bibleText: `<h4>Exodus 2:11-22 (ESV)</h4>
<p>11 One day, when Moses had grown up, he went out to his people and looked on their burdens, and he saw an Egyptian beating a Hebrew, one of his people. 12 He looked this way and that, and seeing no one, he struck down the Egyptian and hid him in the sand.</p>
<p>13 When he went out the next day, behold, two Hebrews were struggling together. And he said to the man in the wrong, \u201CWhy do you strike your companion?\u201D 14 He answered, \u201CWho made you a prince and a judge over us? Do you mean to kill me as you killed the Egyptian?\u201D Then Moses was afraid, and thought, \u201CSurely the thing is known.\u201D</p>
<p>15 When Pharaoh heard of it, he sought to kill Moses. But Moses fled from Pharaoh and stayed in the land of Midian. And he sat down by a well. 16 Now the priest of Midian had seven daughters, and they came and drew water and filled the troughs to water their father\u2019s flock. 17 The shepherds came and drove them away, but Moses stood up and saved them, and watered their flock.</p>
<p>18 When they came home to their father Reuel, he said, \u201CHow is it that you have come home so soon today?\u201D 19 They said, \u201CAn Egyptian delivered us out of the hand of the shepherds and even drew water for us and watered the flock.\u201D 20 He said to his daughters, \u201CThen where is he? Why have you left the man? Call him, that he may eat bread.\u201D 21 And Moses was content to dwell with the man, and he gave Moses his daughter Zipporah. 22 She gave birth to a son, and he called his name Gershom, for he said, \u201CI have been a sojourner in a foreign land.\u201D</p>`,
    questions: `<h3>Look at verses 11-12</h3><ul><li>When Moses grew up, where did he go? What did he see?</li><li>What did he do when he saw this? Why do you think he did this?</li></ul><h3>Look at verses 13-14</h3><ul><li>What did Moses encounter the next day?</li><li>How did the man in the wrong respond to Moses?</li></ul><h3>Look at verses 15-17</h3><ul><li>Who else heard about what Moses did and how did he respond?</li><li>What happened at the well?</li></ul><h3>Reflection</h3><ul><li>Contrast the well and watering the flocks vs. striking down the Egyptian. What do you think Moses learned?</li></ul>`,
    answers: `<h3>Verses 11-12</h3>
<p>Moses went out to his people and saw their burdens. He struck down an Egyptian who was beating a Hebrew. Moses had a heart for his people, but he acted in his own strength and with violence. He looked around to make sure no one was watching, showing he knew his action was wrong. His zeal was right, but his method was wrong.</p>
<h3>Verses 13-14</h3>
<p>The next day, a Hebrew man rejected Moses\u2019 authority, saying, \u201CWho made you a prince and judge over us?\u201D Moses realized his deed was known and he was afraid. His attempt to help his people had failed and backfired.</p>
<h3>Verses 15-17</h3>
<p>Pharaoh sought to kill Moses, so he fled to Midian. At a well, Moses helped Reuel\u2019s daughters and watered their flock when shepherds drove them away. This time Moses helped in a different way \u2014 not with violence but with humble service.</p>
<h3>Reflection</h3>
<p>Striking the Egyptian represents human strength and anger. Watering the flock represents humble service and shepherding. God was training Moses through the experience in Midian, teaching him that human strength cannot achieve God\u2019s righteousness. God shapes us through the ordinary tasks of daily life, preparing us for his greater purposes.</p>`,
    transcript: `<p><strong>Watered the flock.</strong></p>
<p>Moses tried to help his people with his own strength by striking down the Egyptian. But God trained him through the experience of shepherding at the well in Midian, teaching him that human strength cannot achieve God\u2019s righteousness.</p>
<p><strong>First, Moses\u2019 failed attempt (11-14).</strong></p>
<p>Moses had grown up in Pharaoh\u2019s palace, but he went out to see his people\u2019s burdens. When he saw an Egyptian beating a Hebrew, he killed the Egyptian and hid him. The next day, he tried to mediate between two Hebrews, but was rejected. His deed was known. Moses learned that human power and violence cannot bring justice or deliverance.</p>
<p><strong>Second, Moses at the well (15-17).</strong></p>
<p>Moses fled to Midian and sat by a well. When shepherds drove away the priest\u2019s daughters, Moses stood up, helped them, and watered their flock. This is a beautiful contrast to striking the Egyptian. At the well, Moses served humbly and helped the vulnerable. God was reshaping Moses from a man of action into a shepherd.</p>
<p><strong>Third, a new beginning (18-22).</strong></p>
<p>Moses settled with Reuel\u2019s family and married Zipporah. He named his son Gershom, meaning \u201Ca sojourner in a foreign land.\u201D In this season of apparent exile, God was preparing Moses for his great calling. Sometimes God\u2019s training ground looks like a detour, but it is preparation for his purpose.</p>`,
    attachments: [
      { name: "Exodus 2 Study Guide.pdf", url: "#", type: "pdf" },
      { name: "Supplemental Map.png", url: "#", type: "image" },
    ],
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
  },
];
