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
-- Table structure for table `a_tn3_memberboard_point`
--

DROP TABLE IF EXISTS `a_tn3_memberboard_point`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `a_tn3_memberboard_point` (
  `no` int NOT NULL AUTO_INCREMENT,
  `id_to` varchar(50) NOT NULL DEFAULT '',
  `id_from` varchar(50) NOT NULL DEFAULT '',
  `x_time` int DEFAULT NULL,
  `x_today` int DEFAULT NULL,
  `x_url` varchar(255) DEFAULT NULL,
  `x_save` tinyint NOT NULL DEFAULT '0',
  `x_div` smallint NOT NULL DEFAULT '0',
  `x_where` varchar(50) DEFAULT NULL,
  `x_point` bigint NOT NULL DEFAULT '0',
  `point1` smallint NOT NULL DEFAULT '0',
  `point2` smallint NOT NULL DEFAULT '0',
  `point3` smallint NOT NULL DEFAULT '0',
  PRIMARY KEY (`no`),
  KEY `id_to` (`id_to`),
  KEY `id_from` (`id_from`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `a_tn3_memberboard_point`
--

LOCK TABLES `a_tn3_memberboard_point` WRITE;
/*!40000 ALTER TABLE `a_tn3_memberboard_point` DISABLE KEYS */;
/*!40000 ALTER TABLE `a_tn3_memberboard_point` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:05:24
