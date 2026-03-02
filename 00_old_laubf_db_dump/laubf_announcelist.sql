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
-- Table structure for table `announcelist`
--

DROP TABLE IF EXISTS `announcelist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcelist` (
  `no` int NOT NULL AUTO_INCREMENT,
  `m_id` varchar(50) DEFAULT NULL,
  `title` text,
  `msgtype` varchar(50) DEFAULT NULL,
  `mdate` varchar(50) DEFAULT NULL,
  `mcontent` text,
  `instagramurl` text,
  `instagramimage` text,
  PRIMARY KEY (`no`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcelist`
--

LOCK TABLES `announcelist` WRITE;
/*!40000 ALTER TABLE `announcelist` DISABLE KEYS */;
INSERT INTO `announcelist` VALUES (7,'joseph','Jun 12 2019','Youth','06-23-2019','2019 JBF/HBF BIBLE CAFÉ\r\nWHERE IS YOUR FAITH?\r\n(LUKE 8:25)',NULL,NULL),(8,'joseph','Jun 23 2019','Children','06-23-2019','new classes special\r\nLuke 10:38-42\r\nMessenger : Sarah Larsen',NULL,NULL),(10,'bcjmepark@gmail.com','Fourth of July, 2019','Children','06-30-2019','We\'re going to celebrate 4th of July event at the LA UBF center.\r\nDate/Time: July 4th, 2019 / 6:30 - 9:30 PM\r\nWhat\'s included: BBQ & Fireworks\r\nWho can attend: Anyone who\'d like to join the fun event',NULL,NULL),(11,'bcjmepark@gmail.com','CBF Bible Passages and Messengers - September 2019','Children','09-15-2019','9/8 (Luke 15:11-32 - Billy Park)\r\n9/15 (Luke 16:1-15 - James Yu)\r\n9/22 (Luke 16:19-31 - Kenny Yoon)\r\n9/29 (Luke 17:1-10 - Maggie Wong)\r\n',NULL,NULL),(12,'joseph','Sunday Worship Service','Church','02-15-2020','12/26/2019 Sunday Worship Service\r\n',NULL,'/announcement/laubfsws.jpg'),(13,'joseph','1/19/2020 Announcement','Church','02-15-2020','1/19/2020 Announcement','https://www.instagram.com/p/B7kPLv6lC_H/','/announcement/announcement1_1.jpg'),(14,'joseph','2/2/2020 Announcement','Church','02-15-2020','2/2/2020 Announcement','https://www.instagram.com/p/B8GEVOrlyMB/','/announcement/announcement3.jpeg'),(15,'joseph','LBCC Campus Group Bible Study','Church','02-15-2020','LBCC Campus Group Bible Study','https://www.instagram.com/p/B8GNyDHlH9z/','/announcement/groupbiblestudy.jpeg'),(16,'joseph','2/9/2020 Announcement','Church','02-15-2020','2/9/2020 Announcement','https://www.instagram.com/p/B8hiwm1ljOt/','/announcement/announcement1.jpeg');
/*!40000 ALTER TABLE `announcelist` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:12:45
