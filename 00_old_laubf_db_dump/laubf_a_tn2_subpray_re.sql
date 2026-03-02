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
-- Table structure for table `a_tn2_subpray_re`
--

DROP TABLE IF EXISTS `a_tn2_subpray_re`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `a_tn2_subpray_re` (
  `no` int NOT NULL AUTO_INCREMENT,
  `parent` int NOT NULL DEFAULT '0',
  `name` varchar(30) NOT NULL DEFAULT '',
  `mnick` varchar(30) NOT NULL DEFAULT '',
  `id` varchar(30) NOT NULL DEFAULT '',
  `tbody` text,
  `re_tort` text,
  `mypass` varchar(50) NOT NULL DEFAULT '',
  `ip` varchar(20) DEFAULT NULL,
  `wdate` int DEFAULT NULL,
  `mem` int DEFAULT NULL,
  `comment2` smallint NOT NULL DEFAULT '0',
  `wmail` varchar(50) DEFAULT NULL,
  `ficon` varchar(100) DEFAULT NULL,
  `micon` varchar(255) DEFAULT NULL,
  `mphoto` varchar(255) DEFAULT NULL,
  `mcharacter` varchar(50) DEFAULT NULL,
  `textstyle` tinyint DEFAULT NULL,
  `it_secret` varchar(100) DEFAULT NULL,
  `is_reselect` tinyint NOT NULL DEFAULT '2',
  `reply_file` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`no`),
  KEY `parent` (`parent`),
  KEY `name` (`name`),
  KEY `is_reselect` (`is_reselect`),
  KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `a_tn2_subpray_re`
--

LOCK TABLES `a_tn2_subpray_re` WRITE;
/*!40000 ALTER TABLE `a_tn2_subpray_re` DISABLE KEYS */;
INSERT INTO `a_tn2_subpray_re` VALUES (1,13,'誘쇨낡','誘쇨낡','sinsil05','醫뗭? ?꾨줈洹몃옩???앷꺼??媛먯궗?섎꽕??^ ?몄쥌??媛?슫???깅졊????궗媛??덇만 湲곕룄?⑸땲??',NULL,'2LFZHISh68HSY','124.60.129.10',1403005248,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,''),(2,17,'諛뺤슂?섎떒','諛뺤슂?섎떒','pjonathan','?섏뼇?뚣뀫源?룞洹쇳븰?щ떂珥덉껌?꾪빐\r\n              源?만?⑸ぉ?먮떂珥덉껌?꾪빐\r\n媛뺤궗(諛깆슂?됯컯??硫붿떆吏?껜?ъ쐞??\n嫄닿컯?좎? 諛??묒떇 留ㅼ씪 ?④굅?대쭏?뚯쑝濡?\n諛뺤씠??ぉ?먦뀫媛?젙???먮?二쇱떆?꾨줉\r\n?몄씠??由щ툕媛?ぉ?먦뀫?꾨갑洹쇰Т?밸━?꾪빐',NULL,'.lIB.z9CD7Me.','110.70.54.16',1403069716,1,0,NULL,NULL,NULL,NULL,NULL,NULL,'wAEktpedKHKV.',2,''),(3,17,'諛뺤슂?섎떒','諛뺤슂?섎떒','pjonathan','?щ쫫?섏뼇?뚣뀫源?룞洹쇳븰??源?만?⑸ぉ?먯큹泥?쐞??\n媛뺤궗硫붿떆吏?껜??\n嫄닿컯?↔굣湲곗슫??\n諛뺤씠??ぉ?먭??뺤쓽?먮?二쇱떆湲?\n?몃━釉뚭?,?댁궘紐⑹옄媛?젙?≪쟾諛⑷렐臾댁듅由ъ쐞?',NULL,'.lIB.z9CD7Me.','110.70.54.16',1403070125,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,''),(4,13,'alice','alice','nala080','?둚e?뗫?怨???,\r\n?꾨찘',NULL,'QrCuHFE86LopY','211.246.77.52',1403096602,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,''),(5,21,'?먯슂?','?먯슂?','lifemap21','二쇰떂,蹂듬릺寃뚰븯?듭냼?',NULL,'IG977tzLyAnjs','121.179.177.56',1403810000,1,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,''),(6,5,'議곗썝?','Prayer','whcho','以묐낫湲곕룄 留롮씠 ?댁＜?몄슂.',NULL,'k3GH1.RB9eEYE',NULL,1417096705,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,''),(8,4,'議곗썝??','?섎떎?덉뿕','danycho','?덈뀞?섏꽭??',NULL,'k3GH1.RB9eEYE',NULL,1417099088,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,''),(9,78,'?뺤?寃','Alice','nala080','?щ옉???ъ쑝硫?湲곗쟻???쇱뼱?쒕떎',NULL,'EBmgowx7awgg2',NULL,1492045922,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,'');
/*!40000 ALTER TABLE `a_tn2_subpray_re` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:15:41
