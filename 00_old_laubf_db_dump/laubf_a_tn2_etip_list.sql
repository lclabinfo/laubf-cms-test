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
-- Table structure for table `a_tn2_etip_list`
--

DROP TABLE IF EXISTS `a_tn2_etip_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `a_tn2_etip_list` (
  `no` int NOT NULL AUTO_INCREMENT,
  `board_name` varchar(50) NOT NULL DEFAULT 'etip',
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `a_tn2_etip_list`
--

LOCK TABLES `a_tn2_etip_list` WRITE;
/*!40000 ALTER TABLE `a_tn2_etip_list` DISABLE KEYS */;
INSERT INTO `a_tn2_etip_list` VALUES (2,'etip',-2,1,0,NULL,2,0,NULL,1,1,NULL,NULL,NULL,0,0,'Joseph3',0,'173.114.43.173',1492267527,NULL,29,NULL,NULL,NULL,'How to Install Bible Reading Program icon',0,'Joseph3','joseph','whcho@kookmin.ac.kr',NULL,NULL,NULL,'',0,NULL,'<table border=0 width=100% bg_color=#ececec>\r\n<tr><td><div id=\'div2\' style=\'background-color:#ffffff; display:block\'>\r\n    	<table width=100%>\r\n    	<tr><td>\r\n    	\r\n	<tr><td>\r\n	   <table width=100%>\r\n	   <tr><td width=100px class=\'ng_dbappl\'><b>Introduction the way how to run without login every time you use.</b></td></tr>\r\n 	   </table>\r\n 	   <hr size=\'1\' noshade align=\'center\' style=\'color:#999999;border-style:dotted\'>\r\n 	   <table>\r\n	   <tr><td class=\'ng_bbsbody_pre\'>\r\nHere\'s how to use the mobile web browser on your smartphone to save your shortcut icon on the home screen and need not to login every time.\r\n\r\n\r\n<b>1. For Android smartphone</b>\r\n\r\nLaunch your browser -> Login -> at the first page after login -> Add a bookmark ->  select Add (shortcut) to Home screen, push ADD button, and the Bible reading icon added on the Home screen, it runs without authentication.\r\n\r\n[Browser - Login] ebs.ubf.kr \r\n <img src=/bible/image/image002.png>\r\n\r\n[Home Screen]\r\n <img src=/bible/image/image004.png>\r\n\r\n[Add shortcut on Home screen]\r\nYou must add it on the first screen after login.\r\n <img src=/bible/image/image010.png>\r\n\r\n <img src=/bible/image/image012.png>\r\n\r\nAfter that, if you click the Bible reading icon added on the home screen, you can run without authentication.\r\n\r\n<b>2. For iPhone</b>\r\n\r\nAfter login ebs.ubf.kr in Safari web browser\r\n(You must login and log in from home screen)\r\n\r\nAt the bottom of your browser, click the icon with the square box and the arrow pointing up\r\n<img src=/bible/image/iphone2-1.png>\r\n\r\nClick the Add to Home Screen icon\r\n<img src=/bible/image/iphone2-2.png>\r\n\r\nClick [Add] in the upper right corner\r\n<img src=/bible/image/iphone2-3.png>\r\n\r\nAdded to home screen.\r\n<img src=/bible/image/iphone2-4.png>\r\n\r\n<b>3. iPad</b>\r\n\r\nSimilar to the iPhone, but the upper arrow box is in the upper right corner of the browser.\r\n<img src=/bible/image/ipad-1.png>\r\n\r\nClick [Add] in the upper right corner\r\n<img src=/bible/image/ipad2-2.png>\r\n\r\nAdded to home screen.\r\n<img src=/bible/image/ipad-3.png>\r\n\r\nAfter that, if you click the Bible reading icon added on the home screen, you can run without authentication.\r\n	   </table>\r\n	</td></tr>\r\n	</table>\r\n',NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,'none',NULL,NULL);
/*!40000 ALTER TABLE `a_tn2_etip_list` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:14:53
