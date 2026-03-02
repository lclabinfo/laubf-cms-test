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
-- Table structure for table `a_tn2_community_re`
--

DROP TABLE IF EXISTS `a_tn2_community_re`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `a_tn2_community_re` (
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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `a_tn2_community_re`
--

LOCK TABLES `a_tn2_community_re` WRITE;
/*!40000 ALTER TABLE `a_tn2_community_re` DISABLE KEYS */;
INSERT INTO `a_tn2_community_re` VALUES (8,3,'Joseph Cho','Joseph2','joseph','Second reply',NULL,'k3GH1.RB9eEYE',NULL,1570765866,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,''),(9,2,'Joseph Cho','Joseph2','joseph','Reply Comment Test',NULL,'k3GH1.RB9eEYE',NULL,1570997457,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,''),(11,18,'Joseph Cho','Joseph2','joseph','asdfasdf',NULL,'k3GH1.RB9eEYE',NULL,1571122800,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,''),(12,3,'Joseph Cho','Joseph Cho','joseph','Hi',NULL,'k3GH1.RB9eEYE',NULL,1586156400,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,''),(13,11,'Rebecca Park','Rebecca Park','parkrebecca@gmail.com','This is great. Thank you. ',NULL,'$2y$10$QSK/vjkpP9HjlJhN7NN5HesbKkW68O61Dl43a.2hKtW',NULL,1589526000,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,''),(14,9,'Joseph Cho','Joseph Cho','joseph','Thank you',NULL,'k3GH1.RB9eEYE',NULL,1621407600,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,''),(15,9,'Joseph Cho','Joseph Cho','joseph','afsafd',NULL,'k3GH1.RB9eEYE',NULL,1621494000,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,''),(16,9,'Joseph Cho','Joseph Cho','joseph','sadf',NULL,'k3GH1.RB9eEYE',NULL,1621494000,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,'');
/*!40000 ALTER TABLE `a_tn2_community_re` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:12:54
