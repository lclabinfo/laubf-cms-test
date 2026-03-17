# Passage Audit — March 17, 2026

Audit of all `passage` values in `Message` and `BibleStudy` tables after the format fix deploy (`fix-passage-formats.mts`).

---

## Already Fixed (deploy script ran 2026-03-17)

| Issue | Count (Message) | Count (BibleStudy) |
|---|---|---|
| Missing space in numbered books (`1Kings` → `1 Kings`) | 264 | 261 |
| `Psalm` → `Psalms` | 10 | 10 |
| `Hebrew` → `Hebrews` | 4 | 4 |
| Trailing period (`1Samuel.` → `1 Samuel`) | 1 | 1 |

---

## Remaining Issues

### 1. Double-space between book and chapter (90 Message, 91 BibleStudy)

Legacy data from 2003–2011 has two spaces: `John  7:53-8:11`, `Luke  2:1-20`.

The parser's `normalizeInput` already collapses `\s+` → single space, so these **parse correctly at runtime**. The stored value is just cosmetically wrong. Should be cleaned up.

<details>
<summary>Full list (90 messages)</summary>

| Date | Title | Passage |
|---|---|---|
| 2011-08-21 | Go Now and Leave Your Life of Sin | `John  7:53-8:11` |
| 2011-07-24 | Come To Me and Drink | `John  7:25-52` |
| 2011-07-10 | If Anyone Chooses To Do God's Will | `John  7:1-24` |
| 2011-06-26 | I Am the Bread of Life | `John  6:25-71` |
| 2011-06-19 | It Is I, Don't Be Afraid | `John  6:16-24` |
| 2011-06-05 | Jesus Feeds the 5,000 | `John  6:1-15` |
| 2011-05-29 | How Are You Going To Believe? | `John  5:31-47` |
| 2011-05-22 | My Father Is Always at His Work | `John  5:1-30` |
| 2011-05-15 | You May Go, Your Son Will Live | `John  4:43-54` |
| 2011-05-08 | Open Your Eyes... | `John  4:27-42` |
| 2011-03-20 | I Who Speak to You Am He | `John  4:1-26` |
| 2011-03-13 | He Must Become Greater | `John  3:22-36` |
| 2011-03-06 | For God So Loved the World | `John  3:1-21` |
| 2011-02-27 | My Father's House | `John  2:12-25` |
| 2011-02-20 | He Revealed His Glory | `John  2:1-11` |
| 2011-02-13 | We Have Found the Messiah | `John  1:35-51` |
| 2011-02-06 | Look, the Lamb of God! | `John  1:19-34` |
| 2010-12-19 | But You, Bethlehem | `Matthew  2:1-12` |
| 2010-12-12 | God With Us | `Matthew  1:1-25` |
| 2010-08-01 | Seek First His Kingdom | `Matthew  6:19-34` |
| 2009-03-08 | The Harvest Is Plentiful | `Matthew  9:18-38` |
| 2009-03-01 | Jesus Came to Call Sinners | `Matthew  9:1-17` |
| 2009-02-22 | But, Follow Me | `Matthew  8:18-34` |
| 2009-02-15 | I Am Willing | `Matthew  8:1-17` |
| 2008-11-16 | Enter through the Narrow Gate | `Matthew  7:13-29` |
| 2008-11-09 | Do Not Judge | `Matthew  7:1-12` |
| 2008-11-02 | Treasures in Heaven | `Matthew  6:19-34` |
| 2008-10-19 | Acts of Righteousness | `Matthew  6:1-18` |
| 2008-10-12 | Be Perfect | `Matthew  5:17-48` |
| 2008-10-05 | The Light of the World | `Matthew  5:1-16` |
| 2008-09-14 | Come and You Will See | `John  1:35-51` |
| 2008-09-07 | Come, Follow Me | `Matthew  4:18-25` |
| 2008-08-31 | The Temptation of Jesus | `Matthew  4:1-17` |
| 2008-08-24 | Repent, the Kingdom is Near | `Matthew  3:1-17` |
| 2008-08-17 | King of the Jews | `Matthew  2:1-23` |
| 2008-08-10 | He Will Save Them from Their Sins | `Matthew  1:1-25` |
| 2007-12-23 | For God So Loved the World | `John  3:1-21` |
| 2007-12-16 | Worship the New Born King | `Matthew  2:1-12` |
| 2007-12-09 | Immanuel | `Matthew  1:18-25` |
| 2007-12-02 | Glory to God in the Highest | `Luke  2:1-20` |
| 2006-12-31 | Our Heavenly Father | `Matthew  6:9-13` |
| 2006-12-17 | Good News of Great Joy | `Luke  2:1-20` |
| 2006-09-10 | Come and You will See | `John  1:35-51` |
| 2005-12-25 | The Worshiped Him | `Matthew  2:1-12` |
| 2005-12-18 | The Word became Flesh | `John  1:14-14` |
| 2005-12-11 | God with us | `Matthew  1:1-25` |
| 2005-10-02 | Service in the Kingdom of God | `Luke  9:57-62` |
| 2005-09-25 | Who is Greater? | `Luke  9:46-56` |
| 2005-09-18 | O unbelieving and Perverse ... | `Luke  9:37-45` |
| 2005-09-11 | Listen To Him! | `Luke  9:28-36` |
| 2005-07-31 | The Christ of God | `Luke  9:18-27` |
| 2005-07-24 | You Give Them Something To Eat! | `Luke  9:10-17` |
| 2005-07-10 | Jesus sent out the twelve | `Luke  9:1-9` |
| 2005-07-03 | Don't be afraid; just believe! | `Luke  8:40-56` |
| 2005-06-26 | Jesus Heals A Demon-Possessed man | `Luke  8:26-39` |
| 2005-06-19 | Where Is Your Faith | `Luke  8:22-25` |
| 2005-06-12 | Jesus' mother and brothers | `Luke  8:19-21` |
| 2005-06-05 | A Noble and Good Heart | `Luke  8:1-15` |
| 2005-05-29 | Your faith has saved you | `Luke  7:36-50` |
| 2005-05-22 | Jesus and John the Baptist | `Luke  7:18-35` |
| 2005-05-15 | Young Man, Get up! | `Luke  7:11-17` |
| 2005-05-08 | The Faith of the Centurion | `Luke  7:1-10` |
| 2005-05-02 | A House on the rock | `Luke  6:46-49` |
| 2005-04-24 | A Tree and its Fruit | `Luke  6:43-45` |
| 2005-04-17 | A student and His teacher | `Luke  6:37-42` |
| 2005-04-10 | Love your enemies | `Luke  6:27-36` |
| 2005-03-20 | Blessings and Woes | `Luke  6:17-26` |
| 2005-03-13 | Jesus called the Twelve | `Luke  6:12-16` |
| 2005-03-06 | New Wine into New Wineskins | `Luke  5:33-6:11` |
| 2005-02-27 | Follow Me! | `Luke  5:27-32` |
| 2005-02-20 | Get up, take your mat and go home | `Luke  5:17-26` |
| 2005-02-13 | Be clean | `Luke  5:12-16` |
| 2005-02-06 | From now on you will catch men | `Luke  5:1-11` |
| 2005-01-30 | That is why I was sent | `Luke  4:31-44` |
| 2005-01-23 | Only Namaan | `Luke  4:14-30` |
| 2005-01-16 | The Temptation of Jesus | `Luke  4:1-13` |
| 2005-01-09 | A Baptism of Repentance | `Luke  3:1-38` |
| 2005-01-02 | In my Father's House | `Luke  2:39-52` |
| 2004-12-26 | My eyes have seen your salvation | `Luke  2:21-38` |
| 2004-12-19 | Good News of Great Joy | `Luke  2:1-20` |
| 2004-12-12 | A Horn of Salvation | `Luke  1:57-80` |
| 2004-12-05 | The Name Jesus | `Luke  1:26-56` |
| 2004-11-28 | In the Spirit and Power of Elijah | `Luke  1:1-25` |
| 2004-08-22 | The Wok of God | `John  6:25-59` |
| 2003-12-21 | The Word became Flesh | `John  1:1-18` |
| 2003-12-14 | Immanuel | `Matthew  1:18-25` |
| 2003-10-26 | Such Great faith | `Luke  7:1-10` |
| 2003-08-31 | From now on you will catch men | `Luke  5:1-10` |
| 2003-05-11 | Our Father in Heaven | `Matthew  6:1-9` |
| 2003-04-27 | The Beatitues | `Matthew  5:1-12` |

</details>

### 2. Cross-chapter spans (119 entries)

Format: `Book Ch:V-Ch:V` (e.g., `1 Peter 1:1-2:3`). These are **valid passages** — the parser just doesn't support this format yet. They display correctly as stored text but can't be parsed/validated.

Not a data fix — requires parser enhancement to support cross-chapter ranges.

<details>
<summary>Full list (119 messages)</summary>

| Date | Title | Passage |
|---|---|---|
| 2025-11-09 | And You Also Will Bear Witness | `John 15:18-16:4` |
| 2025-09-28 | Press on towards Christ | `Philippians 3:11-4:1` |
| 2025-03-30 | The Shepherd Of The Sheep | `John 9:35-10:7` |
| 2025-02-02 | Neither Do I Condemn You | `John 7:53-8:11` |
| 2024-12-01 | They Will Bring Offerings In Righteousness To The Lord | `Malachi 3:1-4:1` |
| 2024-11-24 | I Have Loved You | `Malachi 1:1-2:17` |
| 2024-07-14 | BORN AGAIN | `John 2:23-3:8` |
| 2024-03-31 | 2024 Spring Bible Conference: Feed My Sheep | `John 18:1-21:25` |
| 2024-02-04 | Wherever The Spirit Wanted To Go | `Ezekiel 1:1-2:10` |
| 2023-05-07 | Matthew 24-25 Overview | `Matthew 24:1-25:46` |
| 2022-08-07 | i pity Nineveh | `Jonah 1:1-4:11` |
| 2022-08-07 | The Book of Jonah | `Jonah 1:1-4:26` |
| 2022-07-31 | The Book of Ruth | `Ruth 1:1-4:22` |
| 2021-12-05 | GOOD NEWS SHOULD BE SHARED | `2 Kings 6:24-7:20` |
| 2020-09-20 | Love One Another Deeply | `1 Peter 1:22-2:3` |
| 2020-09-20 | Love One Another | `1 Peter 1:22-2:3` |
| 2020-02-02 | Whoever wants to be my disciples | `Mark 8:31-9:1` |
| 2019-09-01 | IF WE WALK IN THE LIGHT | `1 John 1:1-2:17` |
| 2019-04-28 | CITIES OF REFUGE | `Joshua 18:1-21:45` |
| 2019-04-14 | You can drive them out | `Joshua 16:1-17:18` |
| 2019-04-07 | GIVE ME THIS HILL COUNTRY | `Joshua 13:1-15:63` |
| 2019-03-31 | I WILL HAND ALL OF THEM OVER TO ISR | `Joshua 11:1-12:24` |
| 2018-12-09 | THE LORD HIMSELF WILL COME DOWN FRO | `1 Thessalonians 4:13-5:11` |
| 2018-11-25 | NOW WE REALLY LIVE SINCE YOU ARE ST | `1 Thessalonians 2:17-3:13` |
| 2018-10-21 | DEDICATION OF THE WALL OF JERUSALEM | `Nehemiah 11:1-12:47` |
| 2018-10-14 | MAKING A BINDING AGREEMENT | `Nehemiah 9:38-10:39` |
| 2018-09-23 | WORK DONE WITH THE HELP OF OUR LORD | `Nehemiah 6:15-7:73` |
| 2018-08-26 | LET US REBUILD THE WALL | `Nehemiah 2:11-3:32` |
| 2018-08-19 | Hear the Prayer of Your Servant | `Nehemiah 1:1-2:10` |
| 2018-07-29 | IT IS THE LORD CHRIST YOU ARE SERVI | `Colossians 3:18-4:1` |
| 2018-07-08 | FILL UP IN MY FLESH CHRIST'S AFFLIC | `Colossians 1:24-2:5` |
| 2018-04-22 | OPEN WIDE YOUR HEARTS | `2 Corinthians 6:3-7:16` |
| 2018-04-15 | WE ARE CHRIST'S AMBASSADORS | `2 Corinthians 5:11-6:2` |
| 2017-11-12 | I HAVE BECOME ALL THINGS TO ALL PEO | `1 Corinthians 8:1-9:27` |
| 2017-09-01 | FAITH & ACTION WORK TOGET.(CONF1) | `James 1:19-2:26` |
| 2017-07-23 | ENTRUST TO RELIABLE PEOPLE | `2 Timothy 1:15-2:7` |
| 2016-12-18 | A SON IS GIVEN | `Isaiah 8:19-9:7` |
| 2016-09-04 | BE SHEPHERDS OF GOD'S FLOCK | `1 Peter 4:12-5:14` |
| 2016-09-03 | CHRIST SUFFERED IN HIS BODY | `1 Peter 3:8-4:11` |
| 2016-09-02 | A Royal Priesthood | `1 Peter 2:3-3:7` |
| 2016-09-01 | A Living Hope | `1 Peter 1:1-2:3` |
| 2016-08-28 | You Have Said So | `Luke 22:63-23:25` |
| 2015-09-27 | Run With Perseverance | `Hebrews 11:32-12:3` |
| 2013-06-30 | By His Wounds We Are Healed | `Isaiah 52:13-53:12` |
| 2013-02-24 | Nothing Can Hinder the Lord | `1 Samuel 13:16-14:23` |
| 2012-11-04 | Speak For Your Servant Is Listening | `1 Samuel 3:1-4:1` |
| 2012-08-05 | He Himself Bore Our Sins | `1 Peter 2:13-3:7` |
| 2012-07-22 | Be Holy | `1 Peter 1:13-2:3` |
| 2012-05-27 | How Great the Love the Father has | `1 John 2:28-3:10` |
| 2012-04-07 | The King of the Jews | `John 18:28-19:16` |
| 2012-02-12 | You Also Must Testify | `John 15:18-16:4` |
| 2012-01-01 | Our Goal to Please Him | `2 Corinthians 4:1-5:10` |
| 2011-08-21 | Go Now and Leave Your Life of Sin | `John  7:53-8:11` |
| 2010-11-21 | His Indescribable Gift | `2 Corinthians 8:1-9:15` |
| 2010-10-31 | You Must also Testify in Rome | `Acts 22:30-23:35` |
| 2010-10-24 | You Will Be My Witness to All Men | `Acts 21:37-22:29` |
| 2010-09-26 | Strengthening All the Disciples | `Acts 18:18-19:8` |
| 2010-08-08 | Come Over to Macedonia and Help Us | `Acts 15:36-16:15` |
| 2010-07-11 | The Full Rights of Sons | `Galatians 3:26-4:31` |
| 2010-05-09 | Repentance unto Life | `Acts 10:23-11:30` |
| 2010-05-02 | Get Up, Peter. Kill and Eat. | `Acts 9:32-10:23` |
| 2010-03-21 | Stephen's Faith and Spirit | `Acts 6:8-7:60` |
| 2010-03-14 | Go, Stand, and Tell | `Acts 5:16-6:7` |
| 2010-03-07 | One in Heart and Mind | `Acts 4:32-5:16` |
| 2009-12-20 | Good News of Great Joy | `Luke 1:57-2:20` |
| 2009-11-15 | Keep Watch | `Matthew 24:36-25:13` |
| 2009-08-30 | Jesus Teaches the Way to Life | `Matthew 19:16-20:16` |
| 2009-08-23 | I Am the Lord | `Exodus 1:1-6:12` |
| 2009-08-02 | Become Like Little Children | `Matthew 17:24-18:14` |
| 2009-05-24 | The Parable of the Hidden Treasure | `Matthew 13:44-14:12` |
| 2009-02-08 | The Goal of Your Faith | `Acts 1:1-28:31` |
| 2009-01-04 | The Full Message of this New Life | `Acts 1:1-5:42` |
| 2008-07-13 | Test Me in This | `Malachi 2:17-3:18` |
| 2008-03-16 | You Need to Persevere | `Hebrews 8:1-10:39` |
| 2008-03-09 | Jesus is Able to Save | `Hebrews 6:13-7:28` |
| 2008-03-02 | Let Us Go On To Maturity | `Hebrews 5:11-6:12` |
| 2008-02-24 | The Throne of Grace | `Hebrews 4:14-5:10` |
| 2008-01-13 | Do Not Drift Away | `Hebrews 1:1-2:4` |
| 2007-11-25 | A Thank Offering to the Lord | `Leviticus 22:29-23:44` |
| 2007-10-21 | Moses the man of God | `Deuteronomy 33:1-34:12` |
| 2007-07-15 | Aim for Perfection | `2 Corinthians 12:11-13:14` |
| 2007-07-08 | When I am Weak I am Strong | `2 Corinthians 11:30-12:10` |
| 2007-07-01 | A Godly Jealousy | `2 Corinthians 10:1-11:30` |
| 2007-06-17 | This Grace of Giving | `2 Corinthians 8:1-9:5` |
| 2007-06-03 | Do not be yoked together with... | `2 Corinthians 6:14-7:1` |
| 2007-04-29 | A letter from Christ | `2 Corinthians 1:1-3:18` |
| 2007-04-15 | Singers to Sing | `1 Chronicles 15:1-16:6` |
| 2007-03-25 | Christ the power of God | `1 Corinthians 1:1-2:16` |
| 2007-03-18 | If a Man Dies, Will He Live? | `Job 13:1-14:22` |
| 2007-03-04 | Preach the Word | `2 Timothy 3:1-4:8` |
| 2007-01-28 | Moses, Moses | `Exodus 3:1-4:17` |
| 2007-01-14 | She named him Moses | `Exodus 1:1-2:10` |
| 2006-12-10 | The Sun of Righteousness | `Malachi 1:1-4:6` |
| 2006-12-03 | He will be their Peace | `Micah 4:1-5:5` |
| 2006-11-26 | Give Thanks in All Circumstances | `Job 1:1-2:10` |
| 2006-09-17 | A door standing open in heaven | `Revelation 4:1-5:14` |
| 2006-08-20 | Jesus the Capstone | `Luke 19:45-20:19` |
| 2006-08-13 | God was with Joseph | `Genesis 37:1-50:26` |
| 2006-05-28 | All Things to All Men | `1 Corinthians 8:1-9:27` |
| 2006-03-05 | Repent or Perish | `Luke 12:49-13:9` |
| 2006-02-05 | The Key to Knowledge | `Luke 11:37-12:12` |
| 2005-03-06 | New Wine into New Wineskins | `Luke  5:33-6:11` |
| 2004-06-06 | Remember Your Creator | `Ecclesiastes 11:7-12:14` |
| 2004-05-09 | A mother's prayer | `1 Samuel 1:1-2:11` |
| 2004-05-02 | By faith the walls of Jericho fell | `Joshua 5:13-6:27` |
| 2004-04-25 | By faith people passed through... | `Exodus 13:17-15:27` |
| 2004-02-08 | Working for the Lord | `Colossians 3:18-4:1` |
| 2004-01-18 | To this end I labor | `Colossians 1:24-2:5` |
| 2003-08-17 | David and Goliah | `1 Samuel 15:1-17:58` |
| 2003-07-27 | O Lord, forgive our wickedness | `Exodus 32:1-34:28` |
| 2003-07-20 | Abraham prays for Lot | `Genesis 18:1-19:38` |
| 2003-06-22 | One thing I do | `Philippians 3:12-4:1` |
| 2003-04-15 | The Breath of His Mouth | `2 Thessalonians 2:1-3:18` |
| 2003-04-06 | Fear the Lord and Serve Him | `Joshua 23:1-24:33` |
| 2003-03-23 | The Towns of Levites | `Joshua 20:1-21:45` |
| 2003-03-16 | How Long will you wait? | `Joshua 13:1-19:51` |
| 2003-03-09 | O Sun, Stand Still | `Joshua 10:1-12:24` |
| 2003-02-09 | The Fall of Jericho | `Joshua 5:13-6:27` |
| 2003-01-26 | Armed For Battle | `Joshua 3:1-4:24` |

</details>

### 3. Passages needing manual review (3 entries)

These are cross-chapter spans that look unusual but should **not** be auto-fixed. They will be properly supported when the parser handles `Ch:V-Ch:V` format.

| Date | Title | Current Passage | Notes |
|---|---|---|---|
| 2022-08-07 | The Book of Jonah | `Jonah 1:1-4:26` | Jonah ch4 has 11 verses — the `26` may be a typo, but this is a cross-chapter span that needs manual review |
| 2022-07-31 | The Book of Ruth | `Ruth 1:1-4:22` | Whole-book reference — may be intentional |
| 2014-04-06 | Preach the Word | `2 Timothy 3:1-10-4:8` | Unusual format — could be `3:1-10` + `4:8` cross-chapter span, needs manual review |

---

## Soft-Deleted Entries Never Hard-Deleted (FIXED)

**28 Messages** and **2 BibleStudy** rows had `deletedAt` set but were never purged. The undo window is ~10 seconds (toast duration), but rows persisted indefinitely after that.

- 3 test entries (2026-03-16)
- 25 duplicate entries from speaker migration (bulk-deleted 2026-03-15)

**Fixed:** Deploy script now hard-deletes entries where `deletedAt` is older than 1 day. All 30 stale entries purged on 2026-03-17.
