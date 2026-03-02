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
-- Table structure for table `a_tn3_memberboard_loginer`
--

DROP TABLE IF EXISTS `a_tn3_memberboard_loginer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `a_tn3_memberboard_loginer` (
  `no` int NOT NULL AUTO_INCREMENT,
  `m_login` tinyint NOT NULL DEFAULT '2',
  `m_date` int DEFAULT NULL,
  `m_id` char(50) NOT NULL DEFAULT '',
  `m_name` char(50) NOT NULL DEFAULT '',
  `m_nick` char(50) NOT NULL DEFAULT '',
  `myicon` char(255) DEFAULT NULL,
  `myphoto` char(255) DEFAULT NULL,
  `mcharacter` char(50) DEFAULT NULL,
  `m_ip` char(20) DEFAULT NULL,
  `m_mail` char(50) DEFAULT NULL,
  PRIMARY KEY (`no`),
  KEY `m_login` (`m_login`),
  KEY `m_id` (`m_id`)
) ENGINE=InnoDB AUTO_INCREMENT=202095 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `a_tn3_memberboard_loginer`
--

LOCK TABLES `a_tn3_memberboard_loginer` WRITE;
/*!40000 ALTER TABLE `a_tn3_memberboard_loginer` DISABLE KEYS */;
INSERT INTO `a_tn3_memberboard_loginer` VALUES (202073,2,1532987407,'kimth1117','源?깭?','源?Т?','','','','223.39.140.160','paulkimth@korea.com'),(202094,2,1532992276,'','','','','','','222.22.22.22','');
/*!40000 ALTER TABLE `a_tn3_memberboard_loginer` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:14:13
