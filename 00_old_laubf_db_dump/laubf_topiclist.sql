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
-- Table structure for table `topiclist`
--

DROP TABLE IF EXISTS `topiclist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `topiclist` (
  `no` int NOT NULL AUTO_INCREMENT,
  `m_id` varchar(50) DEFAULT NULL,
  `title` text,
  `type` varchar(50) DEFAULT NULL,
  `mdate` varchar(50) DEFAULT NULL,
  `mcontent` text,
  PRIMARY KEY (`no`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `topiclist`
--

LOCK TABLES `topiclist` WRITE;
/*!40000 ALTER TABLE `topiclist` DISABLE KEYS */;
INSERT INTO `topiclist` VALUES (1,'joseph','Urgent prayer request for shep. Samia','Church','06-23-2019','Dear coworkers, \r\nWe thank and praise God for hearing Frank and Samia\'s prayers to have a second baby. Samia is 5 months pregnant with a baby boy.\r\n However, on her recent visit to the doctor, she found out that her pregnancy is \"high risk\". \r\nPlease play urgently for the baby to stay inside her womb full term. Pray for her to get enough rest. The doctor has put her on strict bed rest. \r\nMay God hear our prayers and bless this new life to grow well in Samia\'s womb and to be born a healthy baby! Amen!\r\n'),(2,'joseph','Discipleship Meeting ','Church','06-23-2019','Pray for College Students\' Discipleship Meeting : Every Saturday at 5:30pm\r\n\r\n'),(3,'bcjmepark@gmail.com','2019-2020 New Classes','Children','06-30-2019','On June 13, 9 CBF kids were promoted to JBF. We pray they take deep root in Him, and grow in faith.\r\nFrom June 20, new CBF class started. We pray that CBF kids can learn and grow with Jesus.');
/*!40000 ALTER TABLE `topiclist` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:14:05
