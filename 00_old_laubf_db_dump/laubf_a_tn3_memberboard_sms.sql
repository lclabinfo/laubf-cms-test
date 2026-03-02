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
-- Table structure for table `a_tn3_memberboard_sms`
--

DROP TABLE IF EXISTS `a_tn3_memberboard_sms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `a_tn3_memberboard_sms` (
  `no` int NOT NULL AUTO_INCREMENT,
  `sm_time` int DEFAULT NULL,
  `sm_wait` varchar(15) DEFAULT NULL,
  `sm_to_id` varchar(100) NOT NULL DEFAULT '',
  `sm_to_name` varchar(100) NOT NULL DEFAULT '',
  `sm_to_num` varchar(20) NOT NULL DEFAULT '',
  `sm_from_id` varchar(100) NOT NULL DEFAULT '',
  `sm_from_name` varchar(100) NOT NULL DEFAULT '',
  `sm_from_num` varchar(20) NOT NULL DEFAULT '',
  `sm_title` varchar(100) DEFAULT NULL,
  `sm_body` text,
  `sm_img_to` varchar(255) DEFAULT NULL,
  `sm_img_from` varchar(255) DEFAULT NULL,
  `sm_result` int DEFAULT NULL,
  `sm_point` int DEFAULT NULL,
  `sm_where` varchar(20) DEFAULT NULL,
  `sm_today` int DEFAULT NULL,
  PRIMARY KEY (`no`),
  KEY `sm_time` (`sm_time`),
  KEY `sm_to_id` (`sm_to_id`),
  KEY `sm_from_id` (`sm_from_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `a_tn3_memberboard_sms`
--

LOCK TABLES `a_tn3_memberboard_sms` WRITE;
/*!40000 ALTER TABLE `a_tn3_memberboard_sms` DISABLE KEYS */;
/*!40000 ALTER TABLE `a_tn3_memberboard_sms` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:13:49
