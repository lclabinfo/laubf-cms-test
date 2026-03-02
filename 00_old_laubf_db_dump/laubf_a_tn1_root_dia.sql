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
-- Table structure for table `a_tn1_root_dia`
--

DROP TABLE IF EXISTS `a_tn1_root_dia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `a_tn1_root_dia` (
  `no` int NOT NULL AUTO_INCREMENT,
  `di_time` int DEFAULT NULL,
  `di_subject` varchar(255) DEFAULT NULL,
  `di_body` text,
  `di_body_css` varchar(255) DEFAULT NULL,
  `di_dat_y` int DEFAULT NULL,
  `di_dat_m` int DEFAULT NULL,
  `di_dat_d` int DEFAULT NULL,
  `di_a` varchar(255) DEFAULT NULL,
  `di_b` varchar(255) DEFAULT NULL,
  `di_c` varchar(255) DEFAULT NULL,
  `di_d` int DEFAULT NULL,
  `di_e` int DEFAULT NULL,
  `di_f` int DEFAULT NULL,
  PRIMARY KEY (`no`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `a_tn1_root_dia`
--

LOCK TABLES `a_tn1_root_dia` WRITE;
/*!40000 ALTER TABLE `a_tn1_root_dia` DISABLE KEYS */;
INSERT INTO `a_tn1_root_dia` VALUES (1,1368957457,'?뚰겕?명듃 ?ㅼ튂??媛먯궗?쒕┰?덈떎.','<BR>?ㅼ튂?묒뾽???대젮??? ?놁쑝?⑤굹??<BR>?댁젣遺?꽣 李④렐李④렐 湲곕뒫???댄렣 蹂댁꽭??<BR>?ъ슜?먮떂???앷컖??援ы쁽?댁쨪 ???덈뒗<BR>?ㅼ뼇??湲곕뒫?ㅼ씠 ?ㅼ뼱 ?덉뒿?덈떎.<BR>..... <IMG src=./img/editor_sign/ic021.gif align=absMiddle border=0>','BACKGROUND-COLOR:#FFFFEF',2013,5,19,NULL,NULL,NULL,NULL,NULL,NULL),(2,1379065796,'?뚰겕?명듃 ?ㅼ튂??媛먯궗?쒕┰?덈떎.','<BR>?ㅼ튂?묒뾽???대젮??? ?놁쑝?⑤굹??<BR>?댁젣遺?꽣 李④렐李④렐 湲곕뒫???댄렣 蹂댁꽭??<BR>?ъ슜?먮떂???앷컖??援ы쁽?댁쨪 ???덈뒗<BR>?ㅼ뼇??湲곕뒫?ㅼ씠 ?ㅼ뼱 ?덉뒿?덈떎.<BR>..... <IMG src=./img/editor_sign/ic021.gif align=absMiddle border=0>','BACKGROUND-COLOR:#FFFFEF',2013,9,13,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `a_tn1_root_dia` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:08:43
