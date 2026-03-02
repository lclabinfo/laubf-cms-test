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
-- Table structure for table `a_tn2_IBSIntro_list`
--

DROP TABLE IF EXISTS `a_tn2_IBSIntro_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `a_tn2_IBSIntro_list` (
  `no` int NOT NULL AUTO_INCREMENT,
  `board_name` varchar(50) NOT NULL DEFAULT 'eBibleStudy',
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `a_tn2_IBSIntro_list`
--

LOCK TABLES `a_tn2_IBSIntro_list` WRITE;
/*!40000 ALTER TABLE `a_tn2_IBSIntro_list` DISABLE KEYS */;
INSERT INTO `a_tn2_IBSIntro_list` VALUES (4,'eBibleStudy',-4,1,0,NULL,4,0,NULL,1,1,NULL,NULL,NULL,0,0,'Joseph3',0,'68.181.207.154',1503970925,NULL,3,NULL,NULL,NULL,'INTRODUCTION TO HEBREWS',3,'Joseph3','joseph','whcho@kookmin.ac.kr',NULL,NULL,NULL,'',0,NULL,'INTRODUCTION TO HEBREWS\r\nThe Author is unknown. Textual clues lead us to date the book before 70 A.D., since the temple\'s destruction is not mentioned. The recipients, Jewish Christians being persecuted in a Roman world, were suffering conflict, public disgrace, imprisonment and confiscation of property (10:32-34). At first they endured joyfully. But as their hearts grew dull to the message (5:11-12), they became forgetful (12:5) and were tempted to shrink back to their former identity. Throughout the letter the author explains the superiority of Jesus. Jesus is the Son of God (1:1-3). Therefore, Jesus is superior to angels (1:4-2:18), Moses (3:1-4:13), Levitical priests (4:14-7:28), and temple sacrifices (8:1-10:18). Jesus is also the Great High Priest and the mediator of a new covenant with better promises, and the perfect sacrifice. For this reason, the author urges his readers not to shrink back, but hold firmly to their faith in Jesus. Hebrews is divided into two main parts: 1:1-10:18 is doctrinal - concerning Jesus\' identity as our High Priest and his heavenly ministry. 10:19-13:25 is practical, focusing on faith (11), hope (12) and love (13). Faith, hope and love must be a practical part of Christian life. In a relativistic and hostile world, we need to heed the five warnings, and several exhortations (beginning with \'let us...\') in this book, holding firmly to faith in Jesus, our high priest (4:14).',NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,0,1,1,'8','158',NULL,NULL);
/*!40000 ALTER TABLE `a_tn2_IBSIntro_list` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:13:26
