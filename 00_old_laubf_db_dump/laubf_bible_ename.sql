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
-- Table structure for table `bible_ename`
--

DROP TABLE IF EXISTS `bible_ename`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bible_ename` (
  `id` int NOT NULL DEFAULT '0',
  `bnum` int DEFAULT NULL,
  `blname` varchar(15) DEFAULT NULL,
  `bsname` varchar(5) DEFAULT NULL,
  `chaptlen` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bible_ename`
--

LOCK TABLES `bible_ename` WRITE;
/*!40000 ALTER TABLE `bible_ename` DISABLE KEYS */;
INSERT INTO `bible_ename` VALUES (1,101,'Genesis','Gen',50),(2,102,'Exodus','Exo',40),(3,103,'Leviticus','Lev',27),(4,104,'Numbers','Num',36),(5,105,'Deuteronomy','Deu',34),(6,106,'Joshua','Jos',24),(7,107,'Judges','Jdg',21),(8,108,'Ruth','Rth',4),(9,109,'1Samuel','1Sam',31),(10,110,'2Samuel','2Sam',24),(11,111,'1Kings','1Ki',22),(12,112,'2Kings','2Ki',25),(13,113,'1Chronicles','1Chr',29),(14,114,'2Chronicles','2Chr',36),(15,115,'Ezra','Ezr',10),(16,116,'Nehemiah','Neh',13),(17,117,'Esther','Est',10),(18,118,'Job','Job',42),(19,119,'Psalm','Psa',150),(20,120,'Proverbs','Pro',31),(21,121,'Ecclesiastes','Ecc',12),(22,122,'SongofSongs','Sng',8),(23,123,'Isaiah','Isa',66),(24,124,'Jeremiah','Jer',52),(25,125,'Lamentations','Lam',5),(26,126,'Ezekiel','Ezk',48),(27,127,'Daniel','Dan',12),(28,128,'Hosea','Hos',14),(29,129,'Joel','Jol',3),(30,130,'Amos','Amo',9),(31,131,'Obadiah','Oba',1),(32,132,'Jonah','Jon',4),(33,133,'Micah','Mic',7),(34,134,'Nahum','Nah',3),(35,135,'Habakkuk','Hab',3),(36,136,'Zephaniah','Zeph',3),(37,137,'Haggai','Hag',2),(38,138,'Zechariah','Zech',14),(39,139,'Malachi','Mal',4),(40,140,'Matthew','Mt',28),(41,141,'Mark','Mk',16),(42,142,'Luke','Lk',24),(43,143,'John','Jn',21),(44,144,'Acts','Act',28),(45,145,'Romans','Rom',16),(46,146,'1Corinthians','1Cor',16),(47,147,'2Corinthians','2Cor',13),(48,148,'Galatians','Gal',6),(49,149,'Ephesians','Eph',6),(50,150,'Philippians','Phil',4),(51,151,'Colossians','Col',4),(52,152,'1Thessalonians','1Th',5),(53,153,'2Thessalonians','2Th',3),(54,154,'1Timothy','1Tim',6),(55,155,'2Timothy','2Tim',4),(56,156,'Titus','Tit',3),(57,157,'Philemon','Phm',1),(58,158,'Hebrews','Heb',13),(59,159,'James','Jas',5),(60,160,'1Peter','1Pet',5),(61,161,'2Peter','2Pet',3),(62,162,'1John','1Jn',5),(63,163,'2John','2Jn',1),(64,164,'3John','3Jn',1),(65,165,'Jude','Jud',1),(66,166,'Revelation','Rev',22);
/*!40000 ALTER TABLE `bible_ename` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:15:35
