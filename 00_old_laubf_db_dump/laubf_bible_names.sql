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
-- Table structure for table `bible_names`
--

DROP TABLE IF EXISTS `bible_names`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bible_names` (
  `id` int NOT NULL AUTO_INCREMENT,
  `language` varchar(20) NOT NULL DEFAULT 'English',
  `bnum` int DEFAULT NULL,
  `blname` varchar(15) DEFAULT NULL,
  `bsname` varchar(5) DEFAULT NULL,
  `chaptlen` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bnameidx` (`bnum`)
) ENGINE=InnoDB AUTO_INCREMENT=199 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bible_names`
--

LOCK TABLES `bible_names` WRITE;
/*!40000 ALTER TABLE `bible_names` DISABLE KEYS */;
INSERT INTO `bible_names` VALUES (1,'Korean',101,'창세기','창',50),(2,'Korean',102,'출애굽기','출',40),(3,'Korean',103,'레위기','레',27),(4,'Korean',104,'민수기','민',36),(5,'Korean',105,'신명기','신',34),(6,'Korean',106,'여호수아','수',24),(7,'Korean',107,'사사기','삿',21),(8,'Korean',108,'룻기','룻',4),(9,'Korean',109,'사무엘상','삼상',31),(10,'Korean',110,'사무엘하','삼하',24),(11,'Korean',111,'열왕기상','왕상',22),(12,'Korean',112,'열왕기하','왕하',25),(13,'Korean',113,'역대상','대상',29),(14,'Korean',114,'역대하','대하',36),(15,'Korean',115,'에스라','스',10),(16,'Korean',116,'느헤미야','느',13),(17,'Korean',117,'에스더','에',10),(18,'Korean',118,'욥기','욥',42),(19,'Korean',119,'시편','시',150),(20,'Korean',120,'잠언','잠',31),(21,'Korean',121,'전도서','전',12),(22,'Korean',122,'아가','아',8),(23,'Korean',123,'이사야','사',66),(24,'Korean',124,'예레미야','렘',52),(25,'Korean',125,'예레미야애가','애',5),(26,'Korean',126,'에스겔','겔',48),(27,'Korean',127,'다니엘','단',12),(28,'Korean',128,'호세아','호',14),(29,'Korean',129,'요엘','욜',3),(30,'Korean',130,'아모스','암',9),(31,'Korean',131,'오바댜','옵',1),(32,'Korean',132,'요나','욘',4),(33,'Korean',133,'미가','미',7),(34,'Korean',134,'나훔','나',3),(35,'Korean',135,'하박국','합',3),(36,'Korean',136,'스바냐','습',3),(37,'Korean',137,'학개','학',2),(38,'Korean',138,'스가랴','슥',14),(39,'Korean',139,'말라기','말',4),(40,'Korean',140,'마태복음','마',28),(41,'Korean',141,'마가복음','막',16),(42,'Korean',142,'누가복음','눅',24),(43,'Korean',143,'요한복음','요',21),(44,'Korean',144,'사도행전','행',28),(45,'Korean',145,'로마서','롬',16),(46,'Korean',146,'고린도전서','고전',16),(47,'Korean',147,'고린도후서','고후',13),(48,'Korean',148,'갈라디아서','갈',6),(49,'Korean',149,'에베소서','엡',6),(50,'Korean',150,'빌립보서','빌',4),(51,'Korean',151,'골로새서','골',4),(52,'Korean',152,'데살로니가전서','살전',5),(53,'Korean',153,'데살로니가후서','살후',3),(54,'Korean',154,'디모데전서','딤전',6),(55,'Korean',155,'디모데후서','딤후',4),(56,'Korean',156,'디도서','딛',3),(57,'Korean',157,'빌레몬서','몬',1),(58,'Korean',158,'히브리서','히',13),(59,'Korean',159,'야고보서','약',5),(60,'Korean',160,'베드로전서','벧전',5),(61,'Korean',161,'베드로후서','벧후',3),(62,'Korean',162,'요한일서','요일',5),(63,'Korean',163,'요한이서','요이',1),(64,'Korean',164,'요한삼서','요삼',1),(65,'Korean',165,'유다서','유',1),(66,'Korean',166,'요한계시록','계',22),(67,'English',101,'Genesis','Gen',50),(68,'English',102,'Exodus','Exo',40),(69,'English',103,'Leviticus','Lev',27),(70,'English',104,'Numbers','Num',36),(71,'English',105,'Deuteronomy','Deu',34),(72,'English',106,'Joshua','Jos',24),(73,'English',107,'Judges','Jdg',21),(74,'English',108,'Ruth','Rth',4),(75,'English',109,'1Samuel','1Sam',31),(76,'English',110,'2Samuel','2Sam',24),(77,'English',111,'1Kings','1Ki',22),(78,'English',112,'2Kings','2Ki',25),(79,'English',113,'1Chronicles','1Chr',29),(80,'English',114,'2Chronicles','2Chr',36),(81,'English',115,'Ezra','Ezr',10),(82,'English',116,'Nehemiah','Neh',13),(83,'English',117,'Esther','Est',10),(84,'English',118,'Job','Job',42),(85,'English',119,'Psalm','Psa',150),(86,'English',120,'Proverbs','Pro',31),(87,'English',121,'Ecclesiastes','Ecc',12),(88,'English',122,'SongofSongs','Sng',8),(89,'English',123,'Isaiah','Isa',66),(90,'English',124,'Jeremiah','Jer',52),(91,'English',125,'Lamentations','Lam',5),(92,'English',126,'Ezekiel','Ezk',48),(93,'English',127,'Daniel','Dan',12),(94,'English',128,'Hosea','Hos',14),(95,'English',129,'Joel','Jol',3),(96,'English',130,'Amos','Amo',9),(97,'English',131,'Obadiah','Oba',1),(98,'English',132,'Jonah','Jon',4),(99,'English',133,'Micah','Mic',7),(100,'English',134,'Nahum','Nah',3),(101,'English',135,'Habakkuk','Hab',3),(102,'English',136,'Zephaniah','Zeph',3),(103,'English',137,'Haggai','Hag',2),(104,'English',138,'Zechariah','Zech',14),(105,'English',139,'Malachi','Mal',4),(106,'English',140,'Matthew','Mt',28),(107,'English',141,'Mark','Mk',16),(108,'English',142,'Luke','Lk',24),(109,'English',143,'John','Jn',21),(110,'English',144,'Acts','Act',28),(111,'English',145,'Romans','Rom',16),(112,'English',146,'1Corinthians','1Cor',16),(113,'English',147,'2Corinthians','2Cor',13),(114,'English',148,'Galatians','Gal',6),(115,'English',149,'Ephesians','Eph',6),(116,'English',150,'Philippians','Phil',4),(117,'English',151,'Colossians','Col',4),(118,'English',152,'1Thessalonians','1Th',5),(119,'English',153,'2Thessalonians','2Th',3),(120,'English',154,'1Timothy','1Tim',6),(121,'English',155,'2Timothy','2Tim',4),(122,'English',156,'Titus','Tit',3),(123,'English',157,'Philemon','Phm',1),(124,'English',158,'Hebrews','Heb',13),(125,'English',159,'James','Jas',5),(126,'English',160,'1Peter','1Pet',5),(127,'English',161,'2Peter','2Pet',3),(128,'English',162,'1John','1Jn',5),(129,'English',163,'2John','2Jn',1),(130,'English',164,'3John','3Jn',1),(131,'English',165,'Jude','Jud',1),(132,'English',166,'Revelation','Rev',22),(133,'Spanish',101,'Genesis','Gen',50),(134,'Spanish',102,'Exodo','Exo',40),(135,'Spanish',103,'Levitico','Lev',27),(136,'Spanish',104,'Numeros','Num',36),(137,'Spanish',105,'Deuteronomio','Deu',34),(138,'Spanish',106,'Josue','Jos',24),(139,'Spanish',107,'Jueces','Jdg',21),(140,'Spanish',108,'Rut','Rth',4),(141,'Spanish',109,'1Samuel','1Sam',31),(142,'Spanish',110,'2Samuel','2Sam',24),(143,'Spanish',111,'1Reyes','1Ki',22),(144,'Spanish',112,'2Reyes','2Ki',25),(145,'Spanish',113,'1Cronicas','1Chr',29),(146,'Spanish',114,'2Cronicas','2Chr',36),(147,'Spanish',115,'Esdras','Ezr',10),(148,'Spanish',116,'Nehemias','Neh',13),(149,'Spanish',117,'Ester','Est',10),(150,'Spanish',118,'Job','Job',42),(151,'Spanish',119,'Salmos','Psa',150),(152,'Spanish',120,'Proverbios','Pro',31),(153,'Spanish',121,'Eclesiastes','Ecc',12),(154,'Spanish',122,'Cantares','Sng',8),(155,'Spanish',123,'Isaias','Isa',66),(156,'Spanish',124,'Jeremias','Jer',52),(157,'Spanish',125,'Lamentaciones','Lam',5),(158,'Spanish',126,'Ezequiel','Ezk',48),(159,'Spanish',127,'Daniel','Dan',12),(160,'Spanish',128,'Oseas','Hos',14),(161,'Spanish',129,'Joel','Jol',3),(162,'Spanish',130,'Amos','Amo',9),(163,'Spanish',131,'Abdias','Oba',1),(164,'Spanish',132,'Jonas','Jon',4),(165,'Spanish',133,'Miqueas','Mic',7),(166,'Spanish',134,'Nahum','Nah',3),(167,'Spanish',135,'Habacuc','Hab',3),(168,'Spanish',136,'Sofonias','Zeph',3),(169,'Spanish',137,'Hageo','Hag',2),(170,'Spanish',138,'Zacarias','Zech',14),(171,'Spanish',139,'Malaquias','Mal',4),(172,'Spanish',140,'Mateo','Mt',28),(173,'Spanish',141,'Marcos','Mk',16),(174,'Spanish',142,'Lucas','Lk',24),(175,'Spanish',143,'Juan','Jn',21),(176,'Spanish',144,'Hechos','Act',28),(177,'Spanish',145,'Romanos','Rom',16),(178,'Spanish',146,'1Corintios','1Cor',16),(179,'Spanish',147,'2Corintios','2Cor',13),(180,'Spanish',148,'Galatas','Gal',6),(181,'Spanish',149,'Efesios','Eph',6),(182,'Spanish',150,'Filipenses','Phil',4),(183,'Spanish',151,'Colosenses','Col',4),(184,'Spanish',152,'1Tesalonicenses','1Th',5),(185,'Spanish',153,'2Tesalonicenses','2Th',3),(186,'Spanish',154,'1Timoteo','1Tim',6),(187,'Spanish',155,'2Timoteo','2Tim',4),(188,'Spanish',156,'Tito','Tit',3),(189,'Spanish',157,'Filemon','Phm',1),(190,'Spanish',158,'Hebreos','Heb',13),(191,'Spanish',159,'Santiago','Jas',5),(192,'Spanish',160,'1Pedro','1Pet',5),(193,'Spanish',161,'2Pedro','2Pet',3),(194,'Spanish',162,'1Juan','1Jn',5),(195,'Spanish',163,'2Juan','2Jn',1),(196,'Spanish',164,'3Juan','3Jn',1),(197,'Spanish',165,'Judas','Jud',1),(198,'Spanish',166,'Apocalipsis','Rev',22);
/*!40000 ALTER TABLE `bible_names` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:09:40
