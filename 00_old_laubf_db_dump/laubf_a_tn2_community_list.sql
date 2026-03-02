-- MySQL dump 10.13  Distrib 8.0.45, for macos15 (arm64)
--
-- Host: localhost    Database: laubf
-- ------------------------------------------------------
-- Server version	8.0.45-0ubuntu0.22.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `a_tn2_community_list`
--

DROP TABLE IF EXISTS `a_tn2_community_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `a_tn2_community_list` (
  `no` int NOT NULL AUTO_INCREMENT,
  `board_name` varchar(50) NOT NULL DEFAULT 'community',
  `uid` double NOT NULL DEFAULT '0',
  `division` int NOT NULL DEFAULT '1',
  `thread` int NOT NULL DEFAULT '0',
  `parent` int DEFAULT NULL,
  `follow` int DEFAULT NULL,
  `replycnt` tinyint NOT NULL DEFAULT '0',
  `no_reply` tinyint DEFAULT NULL,
  `mlevel` int DEFAULT NULL,
  `member` tinyint DEFAULT NULL,
  `micon` varchar(255) DEFAULT NULL,
  `mphoto` varchar(255) DEFAULT NULL,
  `mcharacter` varchar(50) DEFAULT NULL,
  `comment` smallint NOT NULL DEFAULT '0',
  `comment2` smallint NOT NULL DEFAULT '0',
  `mnick` varchar(50) NOT NULL DEFAULT '',
  `vote` int NOT NULL DEFAULT '0',
  `ip` varchar(15) DEFAULT NULL,
  `wdate` int DEFAULT NULL,
  `wdate_re` int DEFAULT NULL,
  `hit` int NOT NULL DEFAULT '0',
  `specialset` varchar(10) DEFAULT NULL,
  `give_point` mediumint DEFAULT NULL,
  `re_select` tinyint DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `category` tinyint NOT NULL DEFAULT '0',
  `name` varchar(50) NOT NULL DEFAULT '',
  `id` varchar(50) NOT NULL DEFAULT '',
  `wmail` varchar(50) NOT NULL DEFAULT '',
  `home` varchar(255) DEFAULT NULL,
  `bodytype` char(1) DEFAULT NULL,
  `bodystyle` varchar(255) DEFAULT NULL,
  `mypass` varchar(50) NOT NULL DEFAULT '',
  `secret` int NOT NULL DEFAULT '0',
  `openerid` varchar(255) DEFAULT NULL,
  `tbody` text,
  `tbody_img` text,
  `sms_tel` varchar(20) DEFAULT NULL,
  `ulink1` varchar(255) DEFAULT NULL,
  `ulink1size` int DEFAULT NULL,
  `ulink1hit` int NOT NULL DEFAULT '0',
  `ulink2` varchar(255) DEFAULT NULL,
  `ulink2size` int DEFAULT NULL,
  `ulink2hit` int NOT NULL DEFAULT '0',
  `filedir` int DEFAULT NULL,
  `ufile1` varchar(150) DEFAULT NULL,
  `ufile1size` int DEFAULT NULL,
  `ufile1hit` int NOT NULL DEFAULT '0',
  `ufile2` varchar(150) DEFAULT NULL,
  `ufile2size` int DEFAULT NULL,
  `ufile2hit` int NOT NULL DEFAULT '0',
  `temp1` int DEFAULT NULL,
  `temp2` int DEFAULT NULL,
  `temp3` mediumtext,
  `user_add1` varchar(255) DEFAULT NULL,
  `user_add2` varchar(255) DEFAULT NULL,
  `user_add3` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`no`),
  KEY `uid` (`uid`),
  KEY `division` (`division`),
  KEY `follow` (`follow`),
  KEY `category` (`category`),
  KEY `name` (`name`),
  KEY `id` (`id`),
  KEY `hit` (`hit`),
  KEY `wdate` (`wdate`),
  KEY `comment` (`comment`),
  KEY `replycnt` (`replycnt`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `a_tn2_community_list`
--

LOCK TABLES `a_tn2_community_list` WRITE;
/*!40000 ALTER TABLE `a_tn2_community_list` DISABLE KEYS */;
INSERT INTO `a_tn2_community_list` VALUES (2,'community',-1,1,0,NULL,1,0,NULL,1,1,NULL,NULL,NULL,1,0,'WonheeCho',2,NULL,1570166834,NULL,0,NULL,NULL,NULL,'This is Woman Coworker\'s Community Board',0,'joseph','joseph','whcho@kookmin.ac.kr',NULL,NULL,NULL,'',0,NULL,'This is Woman Coworker\'s Community Board\r\nTest Post',NULL,NULL,'/pds/1570166834.docx',NULL,0,NULL,NULL,0,NULL,'Mk6b-2019Q (1).docx',NULL,0,NULL,NULL,0,NULL,NULL,NULL,'womancoworker',NULL,NULL),(3,'community',-3,1,0,NULL,3,0,NULL,1,1,NULL,NULL,NULL,1,0,'Joseph Cho2',5,NULL,1570765487,NULL,0,NULL,NULL,NULL,'This is LA UBF Resource Board',0,'Joseph Cho','joseph','danylight@gmail.com',NULL,NULL,NULL,'',0,NULL,'This is LA UBF Resource Board',NULL,NULL,'/pds/1570765487.docx',NULL,0,NULL,NULL,0,NULL,'Mk6a-2019Q.docx',NULL,0,NULL,NULL,0,NULL,NULL,NULL,'resourceboard',NULL,NULL),(4,'community',-4,1,0,NULL,4,0,NULL,1,1,NULL,NULL,NULL,0,0,'Rebecca Park',0,NULL,1571167257,NULL,0,NULL,NULL,NULL,'How to Use this Bord',0,'Rebecca Park','parkrebecca@gmail.com','parkrebecca@gmail.com',NULL,NULL,NULL,'',0,NULL,'Please see attached for how to use this Board. ',NULL,NULL,'/pds/1571167257.docx',NULL,0,NULL,NULL,0,NULL,'How to use Community Board for Woman Coworkers.docx',NULL,0,NULL,NULL,0,NULL,NULL,NULL,'womancoworker',NULL,NULL),(5,'community',-5,1,0,NULL,5,0,NULL,1,1,NULL,NULL,NULL,0,0,'Rebecca Park',0,NULL,1571196522,NULL,0,NULL,NULL,NULL,'Woman Coworkers Quarterly Meeting Agenda (09/28/19)',0,'Rebecca Park','parkrebecca@gmail.com','parkrebecca@gmail.com',NULL,NULL,NULL,'',0,NULL,'Thank God for his great mercy.  We had very graceful and fruit meeting among sisters in Christ. Attached is our agenda. ',NULL,NULL,'/pds/1571196522.docx',NULL,0,NULL,NULL,0,NULL,'Agenda for Woman Coworkers 2019.9.28.docx',NULL,0,NULL,NULL,0,NULL,NULL,NULL,'womancoworker',NULL,NULL),(6,'community',-6,1,0,NULL,6,0,NULL,1,1,NULL,NULL,NULL,0,0,'Rebecca Park',0,NULL,1571197516,NULL,0,NULL,NULL,NULL,'Downey Woman Coworker Orgnization for 2019-2020',0,'Rebecca Park','parkrebecca@gmail.com','parkrebecca@gmail.com',NULL,NULL,NULL,'',0,NULL,'Downey UBF Woman Coworkers Organization\r\nDate: 09-29-2019\r\n\r\n1)	Event Planners/Coordinators: \r\no	This group is responsible for various event including Thanksgiving, Christmas, Sunday and Frida Food servings etc.\r\no	The chief coordinator: M. Grace Oh.\r\no	The Assistant coordinators: M. Grace and Teresa.\r\n\r\n2)	Prayer Coordinators: \r\no	This group is responsible for disseminating any urgent prayer topics among woman coworkers and promoting joint prayer sessions using either in person or via telecommunication such as Google Hangouts or Skype.  \r\no	The Chief of coordinator: M. Sarah Segale.\r\no	The Assistant coordinators: M. Esther Lim and M. Maria Oh\r\n	Weekly prayer meeting on every Friday from 7:30 PM at the Bible Center. \r\n\r\n3)	Testimony Meeting Coordinators: \r\no	This group is responsible for promoting testimony writing and sharing among woman coworkers using various methods such as Skype.\r\no	The chief coordinator: M. Mari Lopez.\r\no	The Assistant Coordinators: Connie Park, Sung Yon Lee, Rebecca Park. \r\n	Weekly meeting on every Friday from 8:00 PM at the Bible Center\r\n\r\n4)	Parenting Network Coordinators: \r\no	This group is responsible for providing godly advices to parents who seek practical, yet God centered guidance.  \r\no	The chief coordinator: M. Susana Min\r\no	The Assistant coordinators: \r\n',NULL,NULL,'/pds/1571197516.docx',NULL,0,NULL,NULL,0,NULL,'Downey UBF Woman Coworkers Organization 2019.9.28.docx',NULL,0,NULL,NULL,0,NULL,NULL,NULL,'womancoworker',NULL,NULL),(8,'community',-7,1,0,NULL,7,0,NULL,1,1,NULL,NULL,NULL,0,0,'Joseph Cho',3,NULL,1586502000,NULL,0,NULL,NULL,NULL,'Covid-19 News & Prayer Topics',0,'Joseph Cho','joseph','whcho@kookmin.ac.kr',NULL,NULL,NULL,'',0,NULL,'This is the Covid-19 News & Prayer Topics Board for LA UBF members.\r\nWe share Covid-19 related news and prayer topics collected from UBF HQ.\r\nWe also share prayer topics related to Covid-19 from LA UBF Church members.\r\nLet\'s share and pray together.',NULL,NULL,'',NULL,0,NULL,NULL,0,NULL,'',NULL,0,NULL,NULL,0,NULL,NULL,NULL,'covid19',NULL,NULL),(9,'community',-9,1,0,NULL,9,0,NULL,1,1,NULL,NULL,NULL,1,0,'Joseph Cho',1,NULL,1586502000,NULL,0,NULL,NULL,NULL,'the UBF new donation site and online UBF Prayer Room website',0,'Joseph Cho','joseph','whcho@kookmin.ac.kr',NULL,NULL,NULL,'',0,NULL,'Hello everyone\r\n\r\nI am an IT/Social Media Mission Coordinator under the UBF HQ World Mission Department.\r\n\r\nThe World Mission Department is collecting corona-pandemic news from UBF members worldwide. I am hearing the news from them.\r\n\r\nMany of our self-supporting missionaries and shepherds are facing a financial crisis nowadays. Many lost jobs and have little income to support their family due to the current pandemic situation. \r\nThe missionaries in Europe who had been working as travel guides lost their jobs. The missionaries in South America who run small businesses don’t have any income nowadays. \r\n\r\n\r\nSome of them are worrying about their rent for the next month. \r\n\r\nMany Latin American economies cannot withstand lockdowns.\r\nMany people are irregular workers and live a hand to mouth.\r\n\r\n\r\nWe have been praying for a loving community and it’s time to show our love for our missionaries and shepherds. \r\n\r\nOur ministry is a five loaves and two fish ministry. When we bring the small things (such as small donation and prayer) we have to Jesus, he can bless them and use them to feed five thousand. \r\n\r\nI am pleased to introduce the UBF new donation site and online UBF Prayer Room website.\r\n\r\nWe have created a new donation site.\r\nURL is donate.ubf.org\r\n\r\n[Introduction to Pandemic Relief Fund, website of UBF World Headquarters]\r\nPandemic Relief Fund - The Grace and Privilege of Sharing with Suffering Co-workers\r\nhttp://ubf.org/world-mission-department-news/hq-international-relief-committee-pandemic-relief-fund-grace-and\r\n\r\nThe online UBF Prayer Room address is https://pray.ubf.org. \r\nThis is a new platform for prayer movement in our community. \r\nThere, you can participate in the Prayer Relay project and find updated prayer topics. \r\n\r\nCome and pray together with our coworkers around the world!\r\n',NULL,NULL,'',NULL,0,NULL,NULL,0,NULL,'',NULL,0,NULL,NULL,0,NULL,NULL,NULL,'covid19',NULL,NULL),(10,'community',-10,1,0,NULL,10,0,NULL,1,1,NULL,NULL,NULL,0,0,'Joseph Cho',0,NULL,1586588400,NULL,0,NULL,NULL,NULL,'More detailed prayer topics related to Covid-19',0,'Joseph Cho','joseph','whcho@kookmin.ac.kr',NULL,NULL,NULL,'',0,NULL,'* Pray for God\'s healing for those tested positive in UBF (New York, Cologne, London) - They are recovering well.\r\n1) US- New York : Andrew Choi, Sarah Choi, Eunice Safos\r\n2) UK - London\r\n    - Jr. David Suk :  \r\n    - Joshua, Beth Kim & 2 children \r\n    - Germany : Cologne\r\n\r\n* Pray for missionaries and shepherds in urgent financial need\r\n1) CIS-Kazakhstan-Astana: Francis Yoon\r\n    Misis: Ana Kim, Paul Choi\r\n2) Europe\r\nAndrew Kim (Hungary), Daniel Koh (Serbia), Abraham Park (Serbia), Ezekiel Lee (Croatia),\r\nCaleb Lee (Denmark), Jacob Han (France Nantes), John Joo (Sweden), Paul Lee (Greece), Banabas Woo (Greece)\r\nBanas Kang (Macedonia)\r\n3) Australia\r\nPaul Lee (New Zealand)\r\n4) Asia\r\nLuke Jeon (Sri Lanka)\r\nIndia :  Many brothers and sisters are in financial crisis.\r\nMalaysia :  Campus ministry (Muslim students) during 6-week lockdown; A\'s work as a frontline medical worker and safe delivery in April\r\nPakistan : Sick coworkers and children:  G.K. in Pakistan\r\n\r\n5) Latin America\r\nMarcos Shin (Bolivia), Joseph Kim (Brazil), Andres Kim (Ecuador),\r\nVenezuela UBF (Dir. Shep. Gustavo) :  Shortage of food and water\r\nColombia:  Bible students are in financial difficulty; many currently are out of reach.\r\n\r\n6) Africa\r\nCaleb Shin (Zimbabwe), Mamdou (Egypt), Ayman (Egypt), Zambia, Kenya UBF\r\n7) US\r\nJoshua Jung(New Jersey, Rutgers Univ.)\r\n\r\n\r\n',NULL,NULL,'',NULL,0,NULL,NULL,0,NULL,'',NULL,0,NULL,NULL,0,NULL,NULL,NULL,'covid19',NULL,NULL),(11,'community',-11,1,0,NULL,11,0,NULL,1,1,NULL,NULL,NULL,1,0,'Joseph Cho',2,NULL,1586674800,NULL,0,NULL,NULL,NULL,'The Buy Sell or Give Away menu,',0,'Joseph Cho','joseph','whcho@kookmin.ac.kr',NULL,NULL,NULL,'',0,NULL,'This is the Buy Sell or Give away menu,\r\nIf you want to sell or donate items you have to some our coworkers, just upload and share.\r\n',NULL,NULL,'',NULL,0,NULL,NULL,0,NULL,'',NULL,0,NULL,NULL,0,NULL,NULL,NULL,'buysellgive',NULL,NULL),(12,'community',-12,1,0,NULL,12,0,NULL,1,1,NULL,NULL,NULL,0,0,'Robert L Fishman',0,NULL,1586847600,NULL,0,NULL,NULL,NULL,'Mary and Joshua Min',0,'Robert L Fishman','rfishman2@gmail.com','rfishman2@gmail.com',NULL,NULL,NULL,'',0,NULL,'Please pray for Mary Min in Chicago UBF. She is Miriam\'s best friend and the one who brought her to Jesus. She is a nurse and tested positive for COVID-19. She recently went to the hospital with respiratory symptoms . \r\n\r\nPrayer topics: \r\n1. Mary Min may get a full recovery without worsening respiratory symptoms, during 2 weeks quarantine period.\r\n2. Joshua Min (husband) and Grace, Daniel and Esther (children) may stay safe from infection. \r\n3. All family may put their faith in the risen Jesus through daily prayer.  ',NULL,NULL,'',NULL,0,NULL,NULL,0,NULL,'',NULL,0,NULL,NULL,0,NULL,NULL,NULL,'covid19',NULL,NULL);
/*!40000 ALTER TABLE `a_tn2_community_list` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:09:50
