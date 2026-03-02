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
-- Table structure for table `a_tn3_memberboard_note`
--

DROP TABLE IF EXISTS `a_tn3_memberboard_note`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `a_tn3_memberboard_note` (
  `no` int NOT NULL AUTO_INCREMENT,
  `note_table` varchar(20) NOT NULL DEFAULT '',
  `note_master` varchar(50) NOT NULL DEFAULT '',
  `note_parent` int NOT NULL DEFAULT '0',
  `note_date` int DEFAULT NULL,
  `note_subject` varchar(200) DEFAULT NULL,
  `note_body` text,
  `note_style` varchar(255) DEFAULT NULL,
  `note_str1` varchar(255) DEFAULT NULL,
  `note_str2` varchar(255) DEFAULT NULL,
  `note_str3` varchar(255) DEFAULT NULL,
  `repl_off` tinyint DEFAULT NULL,
  `is_notice` tinyint NOT NULL DEFAULT '0',
  `is_secret` tinyint DEFAULT NULL,
  `note_id` varchar(50) NOT NULL DEFAULT '',
  `note_name` varchar(50) NOT NULL DEFAULT '',
  `note_nick` varchar(50) NOT NULL DEFAULT '',
  `note_icon` varchar(255) DEFAULT NULL,
  `note_photo` varchar(255) DEFAULT NULL,
  `note_file` varchar(70) DEFAULT NULL,
  `note_link` varchar(255) DEFAULT NULL,
  `note_repl` int NOT NULL DEFAULT '0',
  `note_hit` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`no`),
  KEY `note_table` (`note_table`),
  KEY `note_master` (`note_master`),
  KEY `note_parent` (`note_parent`),
  KEY `note_name` (`note_name`),
  KEY `note_nick` (`note_nick`),
  KEY `note_id` (`note_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `a_tn3_memberboard_note`
--

LOCK TABLES `a_tn3_memberboard_note` WRITE;
/*!40000 ALTER TABLE `a_tn3_memberboard_note` DISABLE KEYS */;
/*!40000 ALTER TABLE `a_tn3_memberboard_note` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:04:44
