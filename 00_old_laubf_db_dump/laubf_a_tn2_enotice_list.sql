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
-- Table structure for table `a_tn2_enotice_list`
--

DROP TABLE IF EXISTS `a_tn2_enotice_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `a_tn2_enotice_list` (
  `no` int NOT NULL AUTO_INCREMENT,
  `board_name` varchar(50) NOT NULL DEFAULT 'enotice',
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `a_tn2_enotice_list`
--

LOCK TABLES `a_tn2_enotice_list` WRITE;
/*!40000 ALTER TABLE `a_tn2_enotice_list` DISABLE KEYS */;
INSERT INTO `a_tn2_enotice_list` VALUES (1,'enotice',-1,1,0,NULL,1,0,NULL,1,1,NULL,NULL,NULL,0,0,'Prayer',1,'222.22.22.22',1465109158,NULL,37,NULL,NULL,NULL,'Start English UBF Bible Service',0,'議곗썝?','whcho2','danylight@gmail.com',NULL,NULL,NULL,'k3GH1.RB9eEYE',0,'whcho2','Start English UBF Bible Service',NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL),(2,'enotice',-2,1,0,NULL,2,0,NULL,1,1,NULL,NULL,NULL,0,0,'joseph',0,'0.0.0.0',1547259242,NULL,0,NULL,NULL,NULL,'Inductive Bible Study Workshop Network will be started from Feb,2019.',0,'joseph','joseph','whcho@kookmin.ac.kr',NULL,NULL,NULL,'',0,NULL,'Inductive Bible Study Workshop Network will be started from Feb,2019.',NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,'LA',NULL,NULL),(3,'enotice',-3,1,0,NULL,3,0,NULL,1,1,NULL,NULL,NULL,0,0,'joseph',0,'0.0.0.0',1547259344,NULL,0,NULL,NULL,NULL,'IBSWN Development Project First Meeting',0,'joseph','joseph','whcho@kookmin.ac.kr',NULL,NULL,NULL,'',0,NULL,'IBSWN Development Project First Meeting\r\nLocaion: Msn.Juan Seo\'s House\r\nDate: Oct. 2018\r\nMember: Msn.Joseph Cho, Joan, Yerin',NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,'LA',NULL,NULL),(4,'enotice',-4,1,0,NULL,4,0,NULL,1,1,NULL,NULL,NULL,0,0,'joseph',0,'0.0.0.0',1547259371,NULL,0,NULL,NULL,NULL,'IBSWN Development Project Second Meeting',0,'joseph','joseph','whcho@kookmin.ac.kr',NULL,NULL,NULL,'',0,NULL,'IBSWN Development Project Second Meeting\r\nLocaion: Msn.Juan Seo\'s House\r\nDate: Nov. 2018\r\nMember: Msn.Joseph Cho, Joan, Yerin',NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,'LA',NULL,NULL),(5,'enotice',-5,1,0,NULL,5,0,NULL,1,1,NULL,NULL,NULL,0,0,'joseph',1,'0.0.0.0',1547269251,NULL,0,NULL,NULL,NULL,'IBSWN Site Review Meeting',0,'joseph','joseph','whcho@kookmin.ac.kr',NULL,NULL,NULL,'',0,NULL,'IBSWN Site Review Meeting\r\nMember: Mother Barry, Mark Yang, Pastor Ron Ward, Pastor Teddy, Dr.Paul Hong, Joseph Cho\r\nLocation: Chicago UBF\r\nDate: Jan.14, 2019.\r\nAgenda: Website development Review meeting',NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,'LA',NULL,NULL),(6,'enotice',-6,1,0,NULL,6,0,NULL,1,1,NULL,NULL,NULL,0,0,'joseph',1,'0.0.0.0',1548222782,NULL,0,NULL,NULL,NULL,'Feedback board has been opened.',0,'joseph','joseph','whcho@kookmin.ac.kr',NULL,NULL,NULL,'',0,NULL,'Feedback board has been opened.\r\nPlease upload your own idea and improvement comments and feedback here.',NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,'LA',NULL,NULL);
/*!40000 ALTER TABLE `a_tn2_enotice_list` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:15:15
