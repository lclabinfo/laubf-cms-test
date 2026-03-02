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
-- Table structure for table `a_tn2_tip_re`
--

DROP TABLE IF EXISTS `a_tn2_tip_re`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `a_tn2_tip_re` (
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
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `a_tn2_tip_re`
--

LOCK TABLES `a_tn2_tip_re` WRITE;
/*!40000 ALTER TABLE `a_tn2_tip_re` DISABLE KEYS */;
INSERT INTO `a_tn2_tip_re` VALUES (19,21,'?μ쑄寃','jangsahara','jangsahara','?? ?꾩씠?⑤뱶濡??묒떇?섎㈃??留ㅻ쾲 濡쒓릿?댁빞?섎뒗 遺덊렪?⑥씠 ?덉뿀?붾뜲 ?대젃寃??섎㈃ ?섎뒗援곗슂~^^ ?뺣쭚 媛먯궗?⑸땲??\r\n留ㅼ씪 ?묒떇癒밴퀬??寃곕떒?섍퀬 ?댁슜?섎뒗???뺣쭚 醫뗭? ?댁씠 ?섏뼱二쇨퀬 ?덉뒿?덈떎~!! \r\n李몄쑝濡?媛먯궗?쒕┰?덈떎~~ ?대젃寃?醫뗭? ?댁쓣 ???댁슜?댁꽌 紐⑤몢媛?365???묒떇 ?앺솢?????대（湲?湲곕룄?⑸땲??~',NULL,'wLSWQK9pkSz3A',NULL,1423578402,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,''),(20,21,'?μ쑄寃','jangsahara','jangsahara','??諛⑸쾿??줈 ?대낫?섏?留??꾩씠?⑤뱶, 利? ?좏뵆 IOS瑜??곕뒗 ?붾컮?댁뒪???덈릺?섎큶?덈떎~?졼뀪\r\n?깆쑝濡??ㅼ슫?댁꽌 ?깆쓣 ?대┃?대룄 濡쒓릿???댁빞?섎뜑?쇨뎄????쭔 ?댁긽?쒓굔媛?슂~??',NULL,'wLSWQK9pkSz3A',NULL,1426252249,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,''),(21,21,'愿?━?','愿?━?','bible','?꾩씠?? ?꾩씠?⑤뱶 異붽??섎뒗 諛⑸쾿 ?대?吏?줈 ?먯꽭?섍쾶 ?ㅻ챸?섏??듬땲??','','E5HMSbsBNi4FY','',1427694147,0,0,'','','','','',0,'',2,'');
/*!40000 ALTER TABLE `a_tn2_tip_re` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:05:04
