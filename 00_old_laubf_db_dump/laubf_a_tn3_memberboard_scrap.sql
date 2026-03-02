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
-- Table structure for table `a_tn3_memberboard_scrap`
--

DROP TABLE IF EXISTS `a_tn3_memberboard_scrap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `a_tn3_memberboard_scrap` (
  `no` int NOT NULL AUTO_INCREMENT,
  `scp_id` varchar(50) NOT NULL DEFAULT '',
  `scrap_folder` tinyint DEFAULT NULL,
  `scp_board` varchar(50) DEFAULT NULL,
  `scp_page` int NOT NULL DEFAULT '0',
  `scp_no` int NOT NULL DEFAULT '0',
  `scp_config` tinyint NOT NULL DEFAULT '0',
  `scp_subject` varchar(255) DEFAULT NULL,
  `scp_date` int NOT NULL DEFAULT '0',
  `scp_link` varchar(255) DEFAULT NULL,
  `scp_type` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`no`),
  KEY `scp_id` (`scp_id`),
  KEY `scrap_folder` (`scrap_folder`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `a_tn3_memberboard_scrap`
--

LOCK TABLES `a_tn3_memberboard_scrap` WRITE;
/*!40000 ALTER TABLE `a_tn3_memberboard_scrap` DISABLE KEYS */;
INSERT INTO `a_tn3_memberboard_scrap` VALUES (1,'whcho',1,NULL,0,0,0,'?꾧뎅 ?숈궗紐⑹옄 ?섏뼇??諛쒗몴?먮즺?낅땲??',1402291460,'http://bs.ubf.kr/tn/board.php?board=mobnotice&call=tmob&command=body&no=10&fix_navi=1,1,0',0),(2,'sarangeonda',1,NULL,0,0,0,'?꾧뎅 ?숈궗紐⑹옄 ?섏뼇??諛쒗몴?먮즺?낅땲??',1402730581,'http://bs.ubf.kr/tn/board.php?board=mobnotice&call=tmob&command=body&no=10&fix_navi=1,1,0',0);
/*!40000 ALTER TABLE `a_tn3_memberboard_scrap` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:06:30
