import type { Event, MinistryTag } from "@/lib/types/events";

const MOCK_EVENTS: Event[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // 1. Friday Night Bible Study (RECURRING)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "friday-night-bible-study",
    title: "[Mock] Friday Night Bible Study",
    type: "meeting",
    dateStart: "2026-01-30",
    time: "7:00 PM - 9:00 PM",
    location: "LA UBF Main Center",
    description:
      "Weekly Bible study for young adults. We study the Gospel of Mark together and share fellowship over snacks.",
    body: `<p>Join us every Friday evening for our cornerstone weekly Bible study. We gather to study God's word together, share what we are learning, and encourage one another in faith.</p>
<h3>What to Expect</h3>
<p>Each session opens with a time of worship and prayer, followed by inductive Bible study in small groups. We are currently working through the <strong>Gospel of Mark</strong>, exploring how Jesus called His disciples and revealed the Kingdom of God.</p>
<p>After the study we share fellowship over snacks and drinks. Whether you have been walking with God for years or are exploring faith for the first time, you are welcome here.</p>`,
    image: { src: "", alt: "Friday night Bible study group discussion" },
    tags: ["#YAM", "#RECURRING", "#BIBLE STUDY", "#OPEN EVENT"],
    ministry: "young-adult",
    campus: "all",
    isRecurring: false,
    meetingUrl: "https://zoom.us/j/1234567890",
    isFeatured: true,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Sunday Livestream (RECURRING)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "sunday-livestream",
    title: "Sunday Livestream",
    type: "meeting",
    dateStart: "2026-02-01",
    time: "11:00 AM",
    location: "LA UBF Main Center / YouTube Live",
    description:
      "Join our Sunday worship service in person or watch the livestream on YouTube. All are welcome.",
    body: `<p>Our Sunday Worship Service is the heartbeat of LA UBF. We gather each Lord's Day to worship God through song, hear His word preached, and fellowship as the body of Christ.</p>
<h3>Service Order</h3>
<ul>
<li>Praise and worship (20 minutes)</li>
<li>Announcements and prayer</li>
<li>Scripture message</li>
<li>Responsive prayer and benediction</li>
</ul>
<p>Communion is observed on the first Sunday of each month. Childcare and a children's program are available during the service. We look forward to welcoming you this Sunday.</p>`,
    image: { src: "", alt: "Sunday worship livestream" },
    tags: ["#CHURCH-WIDE", "#RECURRING", "#WORSHIP", "#OPEN EVENT"],
    ministry: "church-wide",
    campus: "all",
    isRecurring: true,
    meetingUrl: "https://www.youtube.com/@LAUBF/streams",
    recurrenceType: "weekly" as const,
    recurrenceDays: ["SUN"] as const,
    recurrenceSchedule: "Every Sunday",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. New Year Prayer Meeting (EVENT)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "new-year-prayer-meeting-2026",
    title: "[Mock] New Year Prayer Meeting",
    type: "event",
    dateStart: "2026-01-01",
    time: "10:00 AM - 12:00 PM",
    location: "LA UBF Main Center",
    description:
      "Begin 2026 in prayer as we seek God's vision and blessings for the year ahead.",
    body: `<p>Start the new year on the right foot by gathering with your church family for a dedicated time of prayer. We will reflect on God's faithfulness in 2025 and seek His guidance for the year ahead.</p>
<h3>Prayer Focus Areas</h3>
<ul>
<li>Gratitude for God's provision and protection</li>
<li>Vision for campus ministry and world mission</li>
<li>Personal spiritual growth and discipleship</li>
<li>Our local community and the nation</li>
</ul>
<p>Light refreshments will be served. This is a wonderful way to commit 2026 to the Lord from the very first day.</p>`,
    image: { src: "", alt: "New Year prayer meeting" },

    tags: ["#CHURCH-WIDE", "#WORSHIP", "#OPEN EVENT"],
    ministry: "church-wide",
    isRecurring: false,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. CSULB Welcome Week Outreach (EVENT)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "csulb-welcome-week-spring-2026",
    title: "[Mock] CSULB Welcome Week Outreach",
    type: "event",
    dateStart: "2026-02-12",
    dateEnd: "2026-02-14",
    time: "10:00 AM - 2:00 PM",
    location: "CSULB Student Union Lawn",
    description:
      "Meet us at the CSULB campus for our spring semester welcome week with free food, games, and Bible study invitations.",
    body: `<p>It is the start of a new semester and we want every student at Cal State Long Beach to know they have a home at LA UBF. Stop by our welcome table for free boba, snacks, and a chance to connect with fellow students who love Jesus.</p>
<h3>Activities</h3>
<p>We will have lawn games, a photo booth, and short testimonies from students about how campus Bible study has impacted their college experience. Sign up for a one-to-one Bible study and receive a free study Bible.</p>
<p>Bring your friends and come hungry. We cannot wait to meet you!</p>`,
    image: { src: "", alt: "Students at CSULB welcome week outreach table" },

    tags: ["#YAM", "#CAMPUS", "#OUTREACH", "#OPEN EVENT"],
    ministry: "young-adult",
    campus: "csulb",
    isRecurring: false,
    isFeatured: true,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. CSULB Campus Bible Study (RECURRING)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "csulb-campus-bible-study",
    title: "[Mock] CSULB Campus Bible Study",
    type: "meeting",
    dateStart: "2026-02-03",
    time: "12:00 PM - 1:00 PM",
    location: "CSULB Library, Room 204",
    description:
      "Weekly lunchtime Bible study on the CSULB campus. Bring your lunch and study God's word with fellow students.",
    body: `<p>Every Tuesday during the semester we gather in CSULB Library Room 204 for a lunchtime Bible study. This is a relaxed, discussion-based study perfect for busy students who want to grow in their faith during the school week.</p>
<h3>Current Study</h3>
<p>We are studying the <strong>Book of Genesis</strong>, discovering how God created the world, called Abraham, and began His redemptive work in history. No prior Bible knowledge is needed.</p>
<p>Bring your lunch and a curious heart. Bibles and study materials are provided. Contact us if you need help finding the room.</p>`,
    image: { src: "", alt: "CSULB campus Bible study group" },
    tags: ["#YAM", "#CAMPUS", "#RECURRING", "#BIBLE STUDY"],
    ministry: "young-adult",
    campus: "csulb",
    isRecurring: false,
    meetingUrl: "https://zoom.us/j/1112223334",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Marriage & Family Seminar (EVENT)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "marriage-family-seminar-spring-2026",
    title: "[Mock] Marriage & Family Seminar",
    type: "event",
    dateStart: "2026-02-21",
    time: "9:00 AM - 3:00 PM",
    location: "LA UBF Main Center",
    description:
      "A one-day seminar on building God-centered marriages and families, led by Pastor James and guest speakers.",
    body: `<p>Strong families build a strong church. This seminar is designed for married couples and those preparing for marriage to learn biblical principles for a thriving, God-centered home.</p>
<h3>Topics Covered</h3>
<ul>
<li>Communication and conflict resolution rooted in Scripture</li>
<li>Parenting with grace and intentionality</li>
<li>Financial stewardship as a couple</li>
<li>Keeping Christ at the center of your marriage</li>
</ul>
<p>Lunch will be provided. Childcare is available for children ages 2-10. Please register so we can prepare adequate materials and meals.</p>`,
    image: { src: "", alt: "Couples at the marriage and family seminar" },
    tags: ["#ADULT", "#HBF", "#FELLOWSHIP", "#OPEN EVENT"],
    ministry: "adult",
    isRecurring: false,
    registrationUrl: "https://forms.google.com/marriage-seminar-2026",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Children's Sunday School (RECURRING)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "childrens-sunday-school",
    title: "[Mock] Children's Sunday School",
    type: "meeting",
    dateStart: "2026-02-01",
    time: "10:30 AM - 12:00 PM",
    location: "LA UBF Main Center, Room B",
    description:
      "Weekly Sunday school for children ages 4-12. Bible stories, crafts, songs, and snacks in a fun, safe environment.",
    body: `<p>Children are a precious gift from God, and we are passionate about helping them grow in faith from an early age. Our Sunday School runs concurrently with the adult worship service so parents can worship while their children learn.</p>
<h3>Age Groups</h3>
<ul>
<li><strong>Little Lambs (ages 4-6)</strong>: Bible stories with puppets, coloring, and songs</li>
<li><strong>Bible Explorers (ages 7-9)</strong>: Interactive Bible lessons with crafts and memory verses</li>
<li><strong>Young Disciples (ages 10-12)</strong>: Discussion-based Bible study with application activities</li>
</ul>
<p>All teachers have completed background checks and are trained in child safety. Snacks are provided each week. Please let us know about any allergies when you register your child.</p>`,
    image: { src: "", alt: "Children participating in Sunday school activities" },
    tags: ["#CHILDREN", "#RECURRING", "#BIBLE STUDY", "#OPEN EVENT"],
    ministry: "children",
    isRecurring: false,
    meetingUrl: "https://zoom.us/j/5556667778",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 9. UCLA Campus Outreach (EVENT)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "ucla-spring-outreach-2026",
    title: "[Mock] UCLA Spring Campus Outreach",
    type: "event",
    dateStart: "2026-02-09",
    dateEnd: "2026-02-11",
    time: "11:00 AM - 3:00 PM",
    location: "UCLA Bruin Walk",
    description:
      "Three days of outreach at UCLA with free coffee, conversations about faith, and Bible study sign-ups.",
    body: `<p>Our UCLA ministry team sets up on Bruin Walk each spring to connect with students who are searching for community and purpose. If you have ever wondered what it means to follow Jesus, stop by and chat with us.</p>
<h3>What We Offer</h3>
<p>Free pour-over coffee from a local roaster, copies of the Gospel of John, and genuine conversation. No pressure, no gimmicks, just students who want to share what God has done in their lives.</p>
<p>If you are a UCLA student interested in volunteering at the outreach table, contact our campus coordinator. Training will be provided the week before the event.</p>`,
    image: { src: "", alt: "Students at UCLA campus outreach table" },
    tags: ["#YAM", "#CAMPUS", "#OUTREACH", "#OPEN EVENT"],
    ministry: "young-adult",
    campus: "ucla",
    isRecurring: false,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 10. Easter Celebration Service (EVENT)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "easter-celebration-2026",
    title: "[Mock] Easter Celebration Service",
    type: "event",
    dateStart: "2026-03-01",
    time: "10:00 AM - 12:30 PM",
    location: "LA UBF Main Center",
    description:
      "Celebrate the resurrection of Jesus Christ with special worship, choir performance, and a shared Easter meal.",
    body: `<p>He is risen! Join us for our most joyful service of the year as we celebrate the resurrection of our Lord Jesus Christ. This special service features extended praise and worship, a powerful Easter message, and a performance by our combined choir.</p>
<h3>Service Highlights</h3>
<ul>
<li>Resurrection praise and worship with full band</li>
<li>Combined adult and children's choir performance</li>
<li>Easter message: "The Empty Tomb Changes Everything"</li>
<li>Shared Easter meal following the service</li>
</ul>
<p>Invite your friends, family, and neighbors. This is a wonderful opportunity to introduce someone to the hope of the Gospel. A special children's Easter program with an egg hunt will take place simultaneously.</p>`,
    image: { src: "", alt: "Easter celebration worship service" },

    tags: ["#CHURCH-WIDE", "#WORSHIP", "#FELLOWSHIP", "#OPEN EVENT"],
    ministry: "church-wide",
    isRecurring: false,
    isFeatured: true,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 11. Spring Leadership Training (PROGRAM)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "spring-leadership-training-2026",
    title: "[Mock] Spring Leadership Training",
    type: "program",
    dateStart: "2026-03-07",
    dateEnd: "2026-03-08",
    time: "9:00 AM - 5:00 PM",
    location: "LA UBF Main Center",
    description:
      "Two-day intensive training for small group leaders, Bible study teachers, and those interested in serving.",
    body: `<p>Effective ministry begins with equipped leaders. This two-day training program is designed for current and aspiring small group leaders, Bible study teachers, and anyone called to serve in a leadership capacity at LA UBF.</p>
<h3>Training Modules</h3>
<ul>
<li>Inductive Bible study methodology</li>
<li>Leading a small group with confidence and humility</li>
<li>Shepherding and pastoral care basics</li>
<li>Cross-cultural ministry on campus</li>
</ul>
<h3>Who Should Attend</h3>
<p>This training is open to all members who feel called to serve. Whether you are already leading a group or simply exploring what leadership might look like, you will gain practical skills and spiritual encouragement. Lunch is provided both days.</p>`,
    image: { src: "", alt: "Leadership training workshop in session" },
    tags: ["#CHURCH-WIDE", "#CONFERENCE"],
    ministry: "church-wide",
    isRecurring: false,
    registrationUrl: "https://forms.google.com/leadership-training-2026",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 12. Saturday Morning Prayer Meeting (RECURRING)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "saturday-morning-prayer-meeting",
    title: "[Mock] Saturday Morning Prayer Meeting",
    type: "meeting",
    dateStart: "2026-02-01",
    time: "6:00 AM - 7:00 AM",
    location: "LA UBF Main Center",
    description:
      "Weekly early morning prayer meeting to start the weekend seeking God's presence and interceding for our community.",
    body: `<p>There is something powerful about beginning your Saturday in prayer. Each week, a faithful group gathers early to pray for our church, our campuses, our families, and the world.</p>
<h3>Prayer Format</h3>
<ul>
<li>Opening Scripture reading and meditation</li>
<li>Corporate prayer for church ministries</li>
<li>Small group intercession for personal needs</li>
<li>Closing with the Lord's Prayer</li>
</ul>
<p>Coffee is always ready by 5:45 AM. Whether you are a morning person or making a sacrifice to be here, God honors the commitment. Join us in person or via Zoom.</p>`,
    image: { src: "", alt: "Early morning prayer meeting" },
    tags: ["#CHURCH-WIDE", "#RECURRING", "#WORSHIP"],
    ministry: "church-wide",
    isRecurring: false,
    meetingUrl: "https://zoom.us/j/7778889990",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 11. Adult Bible Study - Book of Romans (RECURRING)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "adult-bible-study-romans",
    title: "[Mock] Adult Bible Study: Book of Romans",
    type: "meeting",
    dateStart: "2026-01-28",
    time: "7:30 PM - 9:00 PM",
    location: "LA UBF Main Center",
    description:
      "Wednesday evening Bible study for adults diving deep into the Book of Romans. Led by senior fellowship leaders.",
    body: `<p>The Apostle Paul's letter to the Romans is one of the most profound theological works ever written. In this weekly study, we work verse by verse through this masterpiece, exploring justification by faith, the role of the law, and life in the Spirit.</p>
<h3>Study Format</h3>
<p>Each session includes a short lecture from one of our senior leaders, followed by group discussion and personal application. Homework questions are provided for those who want to dig deeper during the week.</p>
<p>This study is geared toward adults of all ages who want a more in-depth engagement with Scripture. Childcare is available with advance notice. Coffee and tea are always on hand.</p>`,
    image: { src: "", alt: "Adult Bible study group discussing Romans" },
    tags: ["#ADULT", "#HBF", "#RECURRING", "#BIBLE STUDY"],
    ministry: "adult",
    isRecurring: false,
    meetingUrl: "https://zoom.us/j/4445556667",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 15. Mother's Day Appreciation Brunch (MEETING)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "mothers-day-brunch-2026",
    title: "[Mock] Mother's Day Appreciation Brunch",
    type: "meeting",
    dateStart: "2025-10-12",
    time: "11:00 AM - 1:00 PM",
    location: "LA UBF Main Center",
    description:
      "A special brunch honoring the mothers and mother figures in our church family with food, tributes, and gifts.",
    body: `<p>Proverbs 31:28 says, "Her children rise up and call her blessed." Join us as we honor the incredible mothers, grandmothers, and mother figures who shape our families and our church.</p>
<h3>Brunch Program</h3>
<ul>
<li>Catered brunch with Korean and American dishes</li>
<li>Tribute video featuring messages from church families</li>
<li>Special musical performance by the children's choir</li>
<li>Gift bags for all mothers in attendance</li>
</ul>
<p>Children are encouraged to prepare a card or letter for their mothers. All women in the church are invited, whether you are a mother or a spiritual mother to someone in the congregation.</p>`,
    image: { src: "", alt: "Mothers being honored at appreciation brunch" },
    tags: ["#CHURCH-WIDE", "#FELLOWSHIP", "#OPEN EVENT"],
    ministry: "church-wide",
    isRecurring: false,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 16. High School Summer Bible Academy (PROGRAM)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "hs-summer-bible-academy-2026",
    title: "[Mock] High School Summer Bible Academy",
    type: "program",
    dateStart: "2025-10-20",
    dateEnd: "2025-10-24",
    time: "9:00 AM - 3:00 PM",
    location: "LA UBF Main Center",
    description:
      "A week-long intensive Bible academy for high school students featuring study, workshops, sports, and mentoring.",
    body: `<p>This summer, challenge yourself to grow deeper in God's word through our annual High School Summer Bible Academy. Designed for students in grades 9-12, this program combines serious Bible study with fun activities and meaningful mentoring relationships.</p>
<h3>Daily Schedule</h3>
<ul>
<li>Morning devotion and worship</li>
<li>Bible study sessions (Genesis through Revelation overview)</li>
<li>Lunch and recreation (basketball, volleyball, games)</li>
<li>Afternoon workshops: apologetics, prayer life, sharing your faith</li>
</ul>
<h3>Mentoring Component</h3>
<p>Each student will be paired with a college-age mentor who will walk alongside them throughout the week and continue meeting monthly after the academy ends. This mentoring relationship has been one of the most impactful parts of the program for past participants.</p>`,
    image: { src: "", alt: "High school students at summer Bible academy" },
    tags: ["#JBF", "#BIBLE STUDY", "#FELLOWSHIP"],
    ministry: "high-school",
    isRecurring: false,
    registrationUrl: "https://forms.google.com/hs-bible-academy-2026",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 17. Church Picnic & Sports Day (EVENT)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "church-picnic-sports-day-2026",
    title: "[Mock] Church Picnic & Sports Day",
    type: "event",
    dateStart: "2025-11-01",
    time: "10:00 AM - 4:00 PM",
    location: "El Dorado Park, Long Beach, CA",
    description:
      "Annual church picnic with BBQ, sports tournaments, games for all ages, and a great time of outdoor fellowship.",
    body: `<p>It is time for our favorite annual tradition. The whole LA UBF family gathers at El Dorado Park for a day of food, fun, and fellowship under the California sun.</p>
<h3>Activities</h3>
<ul>
<li>Korean BBQ and potluck spread</li>
<li>Volleyball and soccer tournaments (sign up your team!)</li>
<li>Relay races and tug-of-war</li>
<li>Children's zone with face painting, water balloons, and crafts</li>
<li>Watermelon-eating contest</li>
</ul>
<p>Each family is asked to bring one side dish or dessert to share. The church will provide meat, drinks, and supplies. Wear comfortable clothes and bring sunscreen. Rain date is May 30th.</p>`,
    image: { src: "", alt: "Church families enjoying outdoor picnic and sports" },
    tags: ["#CHURCH-WIDE", "#FELLOWSHIP", "#OPEN EVENT"],
    ministry: "church-wide",
    isRecurring: false,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 18. USC Campus Bible Study Launch (EVENT)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "usc-campus-bible-study-launch-2026",
    title: "[Mock] USC Campus Bible Study Launch",
    type: "event",
    dateStart: "2025-10-28",
    time: "6:00 PM - 8:00 PM",
    location: "USC Taper Hall, Room 101",
    description:
      "Launching a new Bible study group at USC. Join us for the first meeting with pizza and an introduction to the study.",
    body: `<p>God is opening doors at the University of Southern California. We are launching a brand new Bible study group on campus and we want you to be part of it from the beginning.</p>
<h3>First Meeting Details</h3>
<p>Our inaugural meeting will feature free pizza, introductions, and a short preview study from the <strong>Book of Acts</strong>. We will discuss what the early church looked like and how those same principles apply to our lives as students today.</p>
<p>If you are a USC student, graduate student, or faculty member looking for meaningful community on campus, this is your invitation. Help us build something lasting at USC for God's glory.</p>`,
    image: { src: "", alt: "Students gathering for USC Bible study launch" },

    tags: ["#YAM", "#CAMPUS", "#BIBLE STUDY", "#OPEN EVENT"],
    ministry: "young-adult",
    campus: "usc",
    isRecurring: false,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 19. Summer Mission Conference (PROGRAM)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "summer-mission-conference-2026",
    title: "[Mock] Summer Mission Conference",
    type: "program",
    dateStart: "2025-12-05",
    dateEnd: "2025-12-07",
    time: "Friday 5:00 PM - Sunday 2:00 PM",
    location: "UC Riverside Conference Center, Riverside, CA",
    description:
      "Annual multi-church mission conference with keynote speakers, workshops, and a call to world campus mission.",
    body: `<p>The Summer Mission Conference is the highlight of our ministry calendar. Churches from across the West Coast gather for a weekend of powerful messages, deep fellowship, and renewed commitment to God's world mission calling.</p>
<h3>Conference Theme: "To the Ends of the Earth" (Acts 1:8)</h3>
<p>This year's keynote speakers include missionaries serving in Central Asia and East Africa who will share stories of God's faithfulness on the mission field. Workshops cover topics from cross-cultural ministry to tentmaking careers and short-term mission trip preparation.</p>
<h3>Schedule Overview</h3>
<ul>
<li>Friday: Registration, dinner, opening worship, and keynote address</li>
<li>Saturday: Morning Bible study, workshops, afternoon fellowship, evening celebration</li>
<li>Sunday: Closing message, commissioning prayer, group lunch</li>
</ul>
<p>Registration includes lodging, meals, and conference materials. Early bird pricing is available through June 1st. Group discounts for 5+ from the same church.</p>`,
    image: { src: "", alt: "Worship at summer mission conference" },
    tags: ["#CHURCH-WIDE", "#CONFERENCE", "#WORSHIP", "#OUTREACH"],
    ministry: "church-wide",
    isRecurring: false,
    registrationUrl: "https://forms.google.com/smc-2026",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 21. Golden West College Outreach (EVENT)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "golden-west-fall-outreach-2026",
    title: "[Mock] Golden West College Fall Outreach",
    type: "event",
    dateStart: "2025-10-06",
    dateEnd: "2025-10-08",
    time: "10:00 AM - 2:00 PM",
    location: "Golden West College, Main Quad",
    description:
      "Welcoming new and returning students at Golden West College with free snacks, conversations, and Bible study invitations.",
    body: `<p>Golden West College is a vibrant community college in Huntington Beach, and we want every student there to know about the hope found in Jesus Christ. Our outreach team will be on the main quad for three days during the first week of classes.</p>
<h3>What to Expect</h3>
<p>Stop by for free snacks, cold drinks, and a chance to meet other students who are exploring faith. We will have information about our weekly Bible study, one-to-one study opportunities, and upcoming events.</p>
<p>Volunteers from LA UBF will be available to share their testimonies and answer questions about Christianity in a friendly, no-pressure environment. If you are a Golden West student interested in helping with outreach, reach out to our campus coordinator.</p>`,
    image: { src: "", alt: "Outreach table at Golden West College" },
    tags: ["#YAM", "#CAMPUS", "#OUTREACH", "#OPEN EVENT"],
    ministry: "young-adult",
    campus: "golden-west",
    isRecurring: false,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 22. Back to School Prayer Night (MEETING)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "back-to-school-prayer-night-2026",
    title: "[Mock] Back to School Prayer Night",
    type: "meeting",
    dateStart: "2025-10-15",
    time: "7:00 PM - 9:00 PM",
    location: "LA UBF Main Center",
    description:
      "A dedicated evening of prayer for students, teachers, and campus ministries as the fall semester begins.",
    body: `<p>Before the new academic year begins, we gather as a church to lift up every student, teacher, and campus minister in prayer. This is a powerful evening where we ask God to prepare hearts on campuses across Los Angeles for the Gospel.</p>
<h3>Prayer Focus</h3>
<ul>
<li>Students returning to campus: wisdom, courage, and faith</li>
<li>New freshmen: smooth transitions and open hearts</li>
<li>Bible study leaders: boldness and shepherding grace</li>
<li>Campus coordinators: vision and perseverance</li>
<li>Specific campuses: CSULB, UCLA, USC, CSUF, and community colleges</li>
</ul>
<p>We will pray in small groups organized by campus. Even if you are not a student, your prayers make a difference. Light refreshments will be available.</p>`,
    image: { src: "", alt: "Church members praying together" },
    tags: ["#CHURCH-WIDE", "#WORSHIP", "#CAMPUS"],
    ministry: "church-wide",
    isRecurring: false,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 23. Cal Poly Pomona Welcome BBQ (EVENT)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "cal-poly-pomona-welcome-bbq-2026",
    title: "[Mock] Cal Poly Pomona Welcome BBQ",
    type: "event",
    dateStart: "2025-10-25",
    time: "5:00 PM - 8:00 PM",
    location: "Cal Poly Pomona, Bronco Commons Lawn",
    description:
      "Welcome BBQ for Cal Poly Pomona students to kick off the fall semester with food, fellowship, and fun.",
    body: `<p>Welcome back, Broncos! Whether you are a brand new freshman or a seasoned senior, you are invited to our fall semester kickoff BBQ at Cal Poly Pomona.</p>
<h3>Menu</h3>
<p>Burgers, hot dogs, veggie options, Korean side dishes, chips, drinks, and dessert. We go all out because we believe great food brings people together.</p>
<h3>Why Come?</h3>
<p>College is better with community. Come meet other Christian students, learn about our weekly Bible study on campus, and enjoy a relaxing evening before classes ramp up. We will also have a sign-up sheet for our small group Bible studies that meet throughout the week at various times to fit your schedule.</p>`,
    image: { src: "", alt: "Students enjoying BBQ at Cal Poly Pomona" },
    tags: ["#YAM", "#CAMPUS", "#FELLOWSHIP", "#OPEN EVENT"],
    ministry: "young-adult",
    campus: "cal-poly-pomona",
    isRecurring: false,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 24. CSUDH Campus Ministry Info Session (EVENT)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "csudh-info-session-fall-2026",
    title: "[Mock] CSUDH Campus Ministry Info Session",
    type: "event",
    dateStart: "2025-11-05",
    time: "12:00 PM - 1:30 PM",
    location: "CSUDH Loker Student Union, Room 202",
    description:
      "Learn about LA UBF's campus ministry at CSUDH. Free lunch provided for all attendees.",
    body: `<p>Curious about what a campus Bible study looks like? Come to our info session at Cal State Dominguez Hills and find out. We will share our heart for campus ministry, introduce our study leaders, and answer any questions you have.</p>
<h3>Session Agenda</h3>
<ul>
<li>Who is LA UBF and what do we believe?</li>
<li>What does a typical Bible study look like?</li>
<li>Testimonies from current CSUDH students</li>
<li>Q&A and sign-up for weekly studies</li>
</ul>
<p>Free boxed lunches will be provided. No commitment required. Just come, eat, listen, and decide if this is something you want to explore further.</p>`,
    image: { src: "", alt: "Students at CSUDH campus ministry info session" },
    tags: ["#YAM", "#CAMPUS", "#OUTREACH", "#OPEN EVENT"],
    ministry: "young-adult",
    campus: "csudh",
    isRecurring: false,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 25. Fall Bible Conference (PROGRAM - multi-day)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "fall-bible-conference-2026",
    title: "[Mock] Fall Bible Conference: Walking by Faith",
    type: "program",
    dateStart: "2025-12-27",
    dateEnd: "2025-12-29",
    time: "Friday 6:00 PM - Sunday 1:00 PM",
    location: "Arrowhead Conference Center, Lake Arrowhead, CA",
    description:
      "Our annual fall conference exploring the theme of faith through the Book of Hebrews with worship, study, and mountain fellowship.",
    body: `<p>Each fall, LA UBF retreats to the mountains for an extended time of Bible study, worship, and spiritual renewal. This year's conference theme is <strong>"Walking by Faith"</strong> based on Hebrews 11.</p>
<h3>Conference Highlights</h3>
<ul>
<li>In-depth study of Hebrews 11: the hall of faith</li>
<li>Small group discussions and personal reflection time</li>
<li>Worship sessions led by our music team</li>
<li>Testimony sharing and prayer partnerships</li>
<li>Free time for hiking, lake activities, and cabin fellowship</li>
</ul>
<h3>Practical Information</h3>
<p>Registration covers lodging (shared cabins), all meals, and conference materials. Transportation will be arranged from LA UBF center. The conference is open to all members and regular attendees. Financial assistance is available; please speak with a pastor confidentially.</p>`,
    image: { src: "", alt: "Worship at fall Bible conference in the mountains" },
    tags: ["#CHURCH-WIDE", "#CONFERENCE", "#WORSHIP", "#BIBLE STUDY"],
    ministry: "church-wide",
    isRecurring: false,
    registrationUrl: "https://forms.google.com/fall-conference-2026",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 26. Harvest Festival (MEETING)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "harvest-festival-2026",
    title: "[Mock] Harvest Festival",
    type: "meeting",
    dateStart: "2025-10-31",
    time: "4:00 PM - 8:00 PM",
    location: "LA UBF Main Center & Parking Lot",
    description:
      "Family-friendly harvest celebration with trunk-or-treat, carnival games, food trucks, and a Gospel message for the community.",
    body: `<p>Instead of Halloween, we celebrate the harvest. Our annual Harvest Festival is one of the biggest outreach events of the year, drawing families from across the Long Beach community.</p>
<h3>Festival Attractions</h3>
<ul>
<li>Trunk-or-treat: decorated car trunks with candy and prizes</li>
<li>Carnival games with prizes for children of all ages</li>
<li>Bounce house and face painting</li>
<li>Food trucks and a bake sale</li>
<li>Live music and a short Gospel message</li>
</ul>
<p>We need 30+ volunteers to make this event a success. Sign up to decorate a trunk, run a game booth, or help with setup and cleanup. This is our chance to be a light in the community and show the love of Christ to our neighbors.</p>`,
    image: { src: "", alt: "Families enjoying the harvest festival" },
    tags: ["#CHURCH-WIDE", "#OUTREACH", "#FELLOWSHIP", "#CHILDREN", "#OPEN EVENT"],
    ministry: "church-wide",
    isRecurring: false,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 27. Mt. SAC Campus Outreach Week (EVENT)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "mt-sac-outreach-week-2026",
    title: "[Mock] Mt. SAC Campus Outreach Week",
    type: "event",
    dateStart: "2025-11-03",
    dateEnd: "2025-11-05",
    time: "10:00 AM - 1:00 PM",
    location: "Mt. San Antonio College, Student Life Center",
    description:
      "Three-day outreach at Mt. SAC with free refreshments, faith conversations, and Bible study sign-ups.",
    body: `<p>Mt. San Antonio College is one of the largest community colleges in California, and we believe God has a purpose for every student there. Our outreach team will be on campus for three days to connect with students.</p>
<h3>Outreach Activities</h3>
<p>We will have a welcoming table near the Student Life Center with free coffee, baked goods, and conversation. Our team members will share their personal stories of how God has worked in their lives and invite students to explore faith through a no-pressure Bible study.</p>
<p>If you are a Mt. SAC student or know someone who attends, please pray for open hearts and meaningful conversations during this outreach. Volunteer sign-ups are available through the link below.</p>`,
    image: { src: "", alt: "Outreach table at Mt. SAC campus" },
    tags: ["#YAM", "#CAMPUS", "#OUTREACH", "#OPEN EVENT"],
    ministry: "young-adult",
    campus: "mt-sac",
    isRecurring: false,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 28. Thanksgiving Worship & Potluck (MEETING)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "thanksgiving-worship-potluck-2026",
    title: "[Mock] Thanksgiving Worship & Potluck",
    type: "meeting",
    dateStart: "2025-11-22",
    time: "10:30 AM - 2:00 PM",
    location: "LA UBF Main Center",
    description:
      "A special Thanksgiving worship service followed by a shared meal celebrating God's blessings and our church community.",
    body: `<p>"Give thanks to the Lord, for He is good; His love endures forever" (Psalm 107:1). As Thanksgiving approaches, we gather to express our gratitude to God for His abundant blessings throughout the year.</p>
<h3>Service & Meal</h3>
<p>Our worship service will feature songs of thanksgiving, testimonies of God's faithfulness, and a message on cultivating a grateful heart. Following the service, we will share a potluck feast together.</p>
<h3>Potluck Guidelines</h3>
<ul>
<li>Last names A-H: Main dishes</li>
<li>Last names I-P: Side dishes and salads</li>
<li>Last names Q-Z: Desserts and drinks</li>
</ul>
<p>Turkey and ham will be provided by the church. This is a wonderful time to invite friends and neighbors who may be spending the holiday alone. Everyone deserves a seat at the table.</p>`,
    image: { src: "", alt: "Church family sharing Thanksgiving meal" },
    tags: ["#CHURCH-WIDE", "#FELLOWSHIP", "#WORSHIP", "#OPEN EVENT"],
    ministry: "church-wide",
    isRecurring: false,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 29. Young Adult Friendsgiving (EVENT)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "ya-friendsgiving-2026",
    title: "[Mock] Young Adult Friendsgiving",
    type: "event",
    dateStart: "2025-11-08",
    time: "6:00 PM - 9:00 PM",
    location: "LA UBF Main Center",
    description:
      "A Friendsgiving celebration for college students and young professionals with a potluck dinner and gratitude sharing.",
    body: `<p>For many college students, Thanksgiving break means being away from family. Friendsgiving is our way of making sure no one celebrates alone. Gather with your church family for an evening of warmth, food, and thankfulness.</p>
<h3>Evening Plan</h3>
<ul>
<li>Potluck dinner: bring your best dish (or your best attempt)</li>
<li>Gratitude circle: share what God has done in your life this year</li>
<li>Friendsgiving awards: best dish, most creative, funniest presentation</li>
<li>Worship and prayer time</li>
</ul>
<p>Whether you are a culinary expert or can barely boil water, your presence is what matters most. Sign up in the group chat and let us know what you are bringing so we do not end up with 20 mac-and-cheese dishes.</p>`,
    image: { src: "", alt: "Young adults at Friendsgiving dinner" },
    tags: ["#YAM", "#FELLOWSHIP", "#OPEN EVENT"],
    ministry: "young-adult",
    campus: "all",
    isRecurring: false,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 30. Christmas Cantata & Celebration (EVENT)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "christmas-cantata-celebration-2026",
    title: "[Mock] Christmas Cantata & Celebration",
    type: "event",
    dateStart: "2025-12-20",
    time: "10:00 AM - 1:00 PM",
    location: "LA UBF Main Center",
    description:
      "A festive Christmas worship service featuring the church choir cantata, nativity drama, and a celebration meal.",
    body: `<p>Celebrate the birth of our Savior with the LA UBF family at our annual Christmas Cantata and Celebration. This is one of the most beautiful and meaningful services of the year.</p>
<h3>Program</h3>
<ul>
<li>Church choir Christmas cantata: "O Holy Night"</li>
<li>Children's nativity drama performance</li>
<li>Christmas message: "The Word Became Flesh" (John 1:14)</li>
<li>Candlelight singing of "Silent Night"</li>
<li>Christmas feast and gift exchange</li>
</ul>
<p>For the gift exchange, please bring a wrapped gift valued at $15 or less. Invite your friends and loved ones to experience the joy and peace of Christmas in a warm church family setting.</p>`,
    image: { src: "", alt: "Church choir performing Christmas cantata" },

    tags: ["#CHURCH-WIDE", "#WORSHIP", "#FELLOWSHIP", "#OPEN EVENT"],
    ministry: "church-wide",
    isRecurring: false,
    isFeatured: true,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 31. End of Year Testimony Sharing (MEETING)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "end-of-year-testimony-sharing-2026",
    title: "[Mock] End of Year Testimony Sharing",
    type: "meeting",
    dateStart: "2025-12-30",
    time: "7:00 PM - 9:30 PM",
    location: "LA UBF Main Center",
    description:
      "Hear powerful testimonies from members reflecting on how God worked in their lives throughout 2026.",
    body: `<p>As we close out 2026, we gather to hear how God has been at work in the lives of our brothers and sisters. The End of Year Testimony Sharing is one of the most encouraging evenings of our church calendar.</p>
<h3>Testimony Categories</h3>
<ul>
<li><strong>Campus testimonies</strong>: Students share about God's work on their campus</li>
<li><strong>Family testimonies</strong>: Parents share about raising children in faith</li>
<li><strong>Ministry testimonies</strong>: Leaders reflect on shepherding and growth</li>
<li><strong>New believer testimonies</strong>: Those who came to faith this year share their journey</li>
</ul>
<p>If you would like to share a testimony, please submit a written draft to your fellowship leader by December 20th. Testimonies should be 5-7 minutes in length. Dessert and coffee will be served throughout the evening.</p>`,
    image: { src: "", alt: "Member sharing testimony at year-end gathering" },
    tags: ["#CHURCH-WIDE", "#FELLOWSHIP", "#WORSHIP"],
    ministry: "church-wide",
    isRecurring: false,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 32. Cypress College Lunch Fellowship (MEETING)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "cypress-college-lunch-fellowship-2026",
    title: "[Mock] Cypress College Lunch Fellowship",
    type: "meeting",
    dateStart: "2025-10-22",
    time: "12:00 PM - 1:30 PM",
    location: "Cypress College, Student Center Patio",
    description:
      "Casual lunch gathering for Cypress College students to connect over food and learn about our campus Bible study.",
    body: `<p>If you attend Cypress College, come join us for a casual lunch on the Student Center Patio. This is a relaxed gathering where you can meet other Christian students, enjoy some free food, and learn about our weekly Bible study.</p>
<h3>What We Are About</h3>
<p>LA UBF's Cypress College ministry exists to help students encounter Jesus through the Bible. We believe that studying God's word together in community is one of the most transformative things a college student can do.</p>
<p>No experience with the Bible is needed. No church background required. Just bring your appetite and your questions. We will bring the tacos and the answers (or at least the honest conversation). Hope to see you there!</p>`,
    image: { src: "", alt: "Students at Cypress College lunch fellowship" },
    tags: ["#YAM", "#CAMPUS", "#FELLOWSHIP", "#OPEN EVENT"],
    ministry: "young-adult",
    campus: "cypress",
    isRecurring: false,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 33. Winter Bible Academy (PROGRAM)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "winter-bible-academy-2026",
    title: "[Mock] Winter Bible Academy",
    type: "program",
    dateStart: "2026-01-09",
    dateEnd: "2026-01-11",
    time: "9:00 AM - 4:00 PM",
    location: "LA UBF Main Center",
    description:
      "A three-day intensive study of the Book of Romans, designed to deepen understanding of the Gospel and Christian identity.",
    body: `<p>The Winter Bible Academy is our annual deep-dive into Scripture. This year we will study the Book of Romans, one of the most foundational texts for understanding the Gospel.</p>
<h3>Schedule</h3>
<ul>
<li><strong>Day 1</strong>: Romans 1-4 — The problem of sin and justification by faith</li>
<li><strong>Day 2</strong>: Romans 5-8 — New life in Christ and the work of the Holy Spirit</li>
<li><strong>Day 3</strong>: Romans 9-16 — God's plan for Israel and practical Christian living</li>
</ul>
<p>Each day includes lecture sessions, small group discussions, and Q&A with the teaching team. Lunch will be provided. Open to all ages and spiritual backgrounds.</p>`,
    image: { src: "", alt: "Students studying during Winter Bible Academy" },
    tags: ["#CHURCH-WIDE", "#CONFERENCE", "#BIBLE STUDY"],
    ministry: "church-wide",
    isRecurring: false,
    registrationUrl: "https://forms.google.com/winter-bible-academy-2026",
    isFeatured: true,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 34. Young Adult Discipleship Program (PROGRAM)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "ya-discipleship-program-spring-2026",
    title: "[Mock] Young Adult Discipleship Program",
    type: "program",
    dateStart: "2026-02-21",
    dateEnd: "2026-05-16",
    time: "10:00 AM - 12:00 PM",
    location: "LA UBF Main Center",
    description:
      "A 12-week discipleship track for young adults covering foundational Christian disciplines including prayer, Scripture study, evangelism, and servant leadership.",
    body: `<p>Are you ready to go deeper in your faith? The Young Adult Discipleship Program is a structured 12-week journey that equips believers with practical tools for spiritual growth.</p>
<h3>Program Modules</h3>
<ul>
<li>Weeks 1-3: Foundations of Faith — understanding the Gospel and assurance of salvation</li>
<li>Weeks 4-6: Spiritual Disciplines — daily Bible reading, prayer life, and fasting</li>
<li>Weeks 7-9: Community & Accountability — building authentic relationships in Christ</li>
<li>Weeks 10-12: Mission & Calling — discovering your gifts and sharing the Gospel</li>
</ul>
<p>Participants will be paired with a mentor and meet weekly on Saturday mornings. Space is limited to 20 participants to ensure personal attention.</p>`,
    image: { src: "", alt: "Young adults in discipleship small group" },
    tags: ["#YAM", "#DISCIPLESHIP", "#BIBLE STUDY"],
    ministry: "young-adult",
    campus: "all",
    isRecurring: false,
    registrationUrl: "https://forms.google.com/ya-discipleship-2026",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 35. Children's Vacation Bible School (PROGRAM)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "vacation-bible-school-2026",
    title: "[Mock] Vacation Bible School",
    type: "program",
    dateStart: "2026-06-22",
    dateEnd: "2026-06-26",
    time: "9:00 AM - 12:30 PM",
    location: "LA UBF Main Center",
    description:
      "A week-long summer program for children ages 5-12 featuring Bible stories, crafts, games, music, and snacks.",
    body: `<p>Vacation Bible School is the highlight of the summer for our children's ministry. This year's theme is "God's Amazing Creation" — exploring the wonders of Genesis 1-2.</p>
<h3>Daily Schedule</h3>
<ul>
<li>9:00 AM — Opening worship and singing</li>
<li>9:30 AM — Bible story time with drama and visuals</li>
<li>10:15 AM — Crafts and hands-on activities</li>
<li>11:00 AM — Outdoor games and recreation</li>
<li>11:45 AM — Snack time and small group review</li>
<li>12:15 PM — Closing prayer and pickup</li>
</ul>
<p>We need 15+ volunteers for the week — teachers, craft helpers, game leaders, and kitchen helpers. Register your children or sign up to volunteer through the link below.</p>`,
    image: { src: "", alt: "Children participating in Vacation Bible School activities" },
    tags: ["#CHILDREN", "#FELLOWSHIP", "#OPEN EVENT"],
    ministry: "children",
    isRecurring: false,
    registrationUrl: "https://forms.google.com/vbs-2026",
    isFeatured: true,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 36. Marriage & Family Enrichment Weekend (PROGRAM)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "marriage-family-enrichment-2026",
    title: "[Mock] Marriage & Family Enrichment Weekend",
    type: "program",
    dateStart: "2026-04-18",
    dateEnd: "2026-04-19",
    time: "9:00 AM - 5:00 PM",
    location: "LA UBF Main Center",
    description:
      "A two-day retreat for married couples and families focused on strengthening relationships through Biblical principles.",
    body: `<p>Strong families are the foundation of a strong church. This two-day program brings together married couples and parents for encouragement, practical teaching, and fellowship.</p>
<h3>Topics</h3>
<ul>
<li>Communication in marriage: speaking the truth in love</li>
<li>Parenting with purpose: raising children in the Lord</li>
<li>Managing conflict God's way</li>
<li>Building a Christ-centered home</li>
</ul>
<p>Childcare will be provided for children ages 3-12. Lunch is included both days. Couples are encouraged to attend together but individuals are welcome as well.</p>`,
    image: { src: "", alt: "Couples at the marriage enrichment weekend" },
    tags: ["#ADULT", "#CONFERENCE", "#FELLOWSHIP"],
    ministry: "adult",
    isRecurring: false,
    registrationUrl: "https://forms.google.com/marriage-enrichment-2026",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 37. Campus Evangelism Training (PROGRAM)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "campus-evangelism-training-2026",
    title: "[Mock] Campus Evangelism Training",
    type: "program",
    dateStart: "2026-03-21",
    dateEnd: "2026-03-22",
    time: "10:00 AM - 3:00 PM",
    location: "LA UBF Main Center",
    description:
      "Hands-on training for campus ministry leaders on how to share the Gospel effectively, invite students to Bible study, and build lasting connections on campus.",
    body: `<p>How do you start a conversation about faith on a college campus? This two-day training equips campus ministers and student leaders with practical skills for campus evangelism.</p>
<h3>Training Sessions</h3>
<ul>
<li>Understanding today's college students: culture, questions, and openness</li>
<li>Starting spiritual conversations naturally</li>
<li>The one-to-one Bible study invitation approach</li>
<li>Following up and building discipleship relationships</li>
<li>Practicum: role-play and real-world scenarios</li>
</ul>
<p>Open to all campus ministry leaders, Bible teachers, and students interested in outreach. Lunch provided both days.</p>`,
    image: { src: "", alt: "Campus evangelism training session" },
    tags: ["#YAM", "#CAMPUS", "#OUTREACH", "#CONFERENCE"],
    ministry: "young-adult",
    campus: "all",
    isRecurring: false,
    registrationUrl: "https://forms.google.com/evangelism-training-2026",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // RECURRING: Daily Bread & Prayer Meeting (Mon-Fri, ongoing)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "daily-bread-meeting",
    title: "Daily Bread & Prayer Meeting",
    type: "meeting",
    dateStart: "2026-02-01",
    time: "6:00 AM",
    location: "LA UBF Main Center",
    description:
      "Start your morning in the Word. A short daily devotional and prayer time open to everyone, Monday through Friday.",
    body: `<p>Daily Bread is a morning devotional gathering where we read a passage of Scripture together, share reflections, and pray to start the day grounded in God's word.</p>
<p>No preparation is needed — just come with an open heart. Coffee is ready by 5:45 AM.</p>`,
    image: { src: "", alt: "Morning devotional gathering" },
    tags: ["#CHURCH-WIDE", "#RECURRING", "#DEVOTIONAL"],
    ministry: "church-wide",
    isRecurring: true,
    meetingUrl: "https://us02web.zoom.us/j/86540458764?pwd=ZDVUUjZDOVZ4WlJFc1VvNVlzd2tkQT09",
    recurrenceType: "weekly" as const,
    recurrenceDays: ["MON", "TUE", "WED", "THU", "FRI"] as const,
    recurrenceSchedule: "Mon\u2013Fri @ 6 AM",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // RECURRING: Men's Bible Study (Every Saturday, ongoing)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "mens-bible-study",
    title: "Men\u2019s Bible Study",
    type: "meeting",
    dateStart: "2026-02-01",
    time: "8:00 AM",
    location: "LA UBF Main Center",
    description:
      "A weekly gathering for men to study Scripture, share life, and hold one another accountable in faith.",
    body: `<p>Men's Bible Study meets every Saturday morning for an in-depth study of God's word. We are currently working through the Book of Proverbs, exploring practical wisdom for daily life.</p>
<p>Breakfast is provided. All men are welcome regardless of where you are in your faith journey.</p>`,
    image: { src: "", alt: "Men's Bible study group" },
    tags: ["#CHURCH-WIDE", "#RECURRING", "#BIBLE STUDY"],
    ministry: "church-wide",
    isRecurring: true,
    meetingUrl: "https://zoom.us",
    recurrenceType: "weekly" as const,
    recurrenceDays: ["SAT"] as const,
    recurrenceSchedule: "Sat @ 8 AM",
  },

  // ──────────────────────────────────────────────────────────────────────────
  // RECURRING: Evening Prayer Meeting (Daily, ongoing)
  // ──────────────────────────────────────────────────────────────────────────
  {
    slug: "evening-prayer-meeting",
    title: "Evening Prayer Meeting",
    type: "meeting",
    dateStart: "2026-02-01",
    time: "7:30 PM",
    location: "LA UBF Main Center",
    meetingUrl: "https://meet.google.com/pgm-trah-moc",
    description:
      "A daily evening prayer meeting to close the day in worship, reflection, and corporate prayer.",
    body: `<p>Join us every evening for a time of focused prayer. We gather to reflect on God's word, lift up prayer topics, and encourage one another in faith.</p>
<p>This is a daily commitment open to all members. Come as you are — no preparation needed.</p>`,
    image: { src: "", alt: "Evening prayer meeting" },
    tags: ["#CHURCH-WIDE", "#RECURRING", "#WORSHIP", "#PRAYER"],
    ministry: "church-wide",
    isRecurring: true,
    recurrenceType: "daily" as const,
    recurrenceDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const,
    recurrenceSchedule: "Every Day @ 7:30 PM",
  },
];

/* ── Sort by dateStart descending (latest first) ──────────────────────────── */
MOCK_EVENTS.sort(
  (a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime()
);

/* ── Derived collections ───────────────────────────────────────────────────── */
export const RECURRING_MEETINGS = MOCK_EVENTS.filter((e) => e.isRecurring);
export const FEATURED_EVENTS = MOCK_EVENTS.filter((e) => e.isFeatured);

/** Curated homepage recurring meetings — matches Quick Links FAB order */
const HOMEPAGE_RECURRING_SLUGS = [
  "daily-bread-meeting",
  "evening-prayer-meeting",
  "mens-bible-study",
  "sunday-livestream",
];
export const HOMEPAGE_RECURRING = HOMEPAGE_RECURRING_SLUGS
  .map((slug) => MOCK_EVENTS.find((e) => e.slug === slug)!)
  .filter(Boolean);

/* ── Lookup helpers ────────────────────────────────────────────────────────── */
export function getEventBySlug(slug: string): Event | undefined {
  return MOCK_EVENTS.find((e) => e.slug === slug);
}

export function getEventsByMinistry(ministry: MinistryTag): Event[] {
  return MOCK_EVENTS.filter(
    (e) => e.ministry === ministry || e.ministry === "church-wide"
  );
}

export { MOCK_EVENTS };
