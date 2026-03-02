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
-- Table structure for table `a_tn2_edbshare_list`
--

DROP TABLE IF EXISTS `a_tn2_edbshare_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `a_tn2_edbshare_list` (
  `no` int NOT NULL AUTO_INCREMENT,
  `board_name` varchar(50) NOT NULL DEFAULT 'edbshare',
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
) ENGINE=InnoDB AUTO_INCREMENT=276 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `a_tn2_edbshare_list`
--

LOCK TABLES `a_tn2_edbshare_list` WRITE;
/*!40000 ALTER TABLE `a_tn2_edbshare_list` DISABLE KEYS */;
INSERT INTO `a_tn2_edbshare_list` VALUES (273,'edbshare',-1,1,0,NULL,1,0,NULL,1,1,NULL,NULL,NULL,0,0,'Prayer',1,'68.181.207.247',1483162761,NULL,11,NULL,NULL,NULL,'Share Daily Bread Board',0,'Prayer','whcho2','danylight@gmail.com',NULL,NULL,NULL,'',0,NULL,'This is Share Daily Bread Board.\r\nYou can share your DB with others.',NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,'none',NULL,NULL),(274,'edbshare',-274,1,0,NULL,274,0,NULL,1,1,NULL,NULL,NULL,0,0,'Joseph3',0,'67.165.154.22',1521864949,NULL,3,NULL,NULL,NULL,'adsfasdf',0,'Joseph3','joseph','whcho@kookmin.ac.kr',NULL,NULL,NULL,'',0,NULL,'sadfasdf',NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,'none',NULL,NULL),(275,'edbshare',-275,1,0,NULL,275,0,NULL,1,1,NULL,NULL,NULL,0,0,'Debbie',0,'174.210.20.213',1527340508,NULL,3,NULL,NULL,NULL,'Jesus called in a loud voice, \"Lazarus, come out!\"',0,'Debbie','Debbiec','changy@satellitehealth.com',NULL,NULL,NULL,'',0,NULL,'We each one of us had destiny in dying in darkness of sin.\r\nBefore I knew Jesus in person, I was in darkness.  I had been a  church goer since I was 5 years old.  However I didn\'t know how to live without purpose of life.  I was looking for people s attention, approval, man s love.  The Samaritan woman in John ch. 4 depicted me very well.  Without Jesus s intercept I would wonder in darkness and would perish to eternal judgement of God.\r\nBut one day I heard Jesus s loving voice,\r\n\"I died instead of you.  You don t need to die\"  Father thank you for sending Jesus who died on the cross for all sinners like me.  Since then the Words of God became more powerful in me that I tasted God s presence, joy in me and knew how i have to live as God s servant to spread this wonderful heavenly kingdom.\r\nV40 says \"did i not tell you that if you  believed you would see the  glory of God?\"\r\nFather help me believe and trust you every min. Live by faith not by sight.\r\nPls. Help all our spiritual and physical children to know you, your power,  love, mercy, blessing.  Help us continue. Come out from darkness and trust you that we may see your glory.  Amen',NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,'none',NULL,NULL);
/*!40000 ALTER TABLE `a_tn2_edbshare_list` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:09:31
