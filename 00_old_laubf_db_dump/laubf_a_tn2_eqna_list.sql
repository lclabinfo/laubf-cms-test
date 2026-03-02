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
-- Table structure for table `a_tn2_eqna_list`
--

DROP TABLE IF EXISTS `a_tn2_eqna_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `a_tn2_eqna_list` (
  `no` int NOT NULL AUTO_INCREMENT,
  `board_name` varchar(50) NOT NULL DEFAULT 'eqna',
  `uid` double NOT NULL DEFAULT '0',
  `division` int NOT NULL DEFAULT '1',
  `thread` int NOT NULL DEFAULT '0',
  `parent` int DEFAULT NULL,
  `follow` int DEFAULT NULL,
  `replycnt` tinyint NOT NULL DEFAULT '0',
  `no_reply` tinyint DEFAULT NULL,
  `mlevel` int DEFAULT NULL,
  `member` tinyint DEFAULT NULL,
  `micon` varchar(255) DEFAULT NULL,
  `mphoto` varchar(255) DEFAULT NULL,
  `mcharacter` varchar(50) DEFAULT NULL,
  `comment` smallint NOT NULL DEFAULT '0',
  `comment2` smallint NOT NULL DEFAULT '0',
  `mnick` varchar(50) NOT NULL DEFAULT '',
  `vote` int NOT NULL DEFAULT '0',
  `ip` varchar(15) DEFAULT NULL,
  `wdate` int DEFAULT NULL,
  `wdate_re` int DEFAULT NULL,
  `hit` int NOT NULL DEFAULT '0',
  `specialset` varchar(10) DEFAULT NULL,
  `give_point` mediumint DEFAULT NULL,
  `re_select` tinyint DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `category` tinyint NOT NULL DEFAULT '0',
  `name` varchar(50) NOT NULL DEFAULT '',
  `id` varchar(50) NOT NULL DEFAULT '',
  `wmail` varchar(50) NOT NULL DEFAULT '',
  `home` varchar(255) DEFAULT NULL,
  `bodytype` char(1) DEFAULT NULL,
  `bodystyle` varchar(255) DEFAULT NULL,
  `mypass` varchar(50) NOT NULL DEFAULT '',
  `secret` int NOT NULL DEFAULT '0',
  `openerid` varchar(255) DEFAULT NULL,
  `tbody` text,
  `tbody_img` text,
  `sms_tel` varchar(20) DEFAULT NULL,
  `ulink1` varchar(255) DEFAULT NULL,
  `ulink1size` int DEFAULT NULL,
  `ulink1hit` int NOT NULL DEFAULT '0',
  `ulink2` varchar(255) DEFAULT NULL,
  `ulink2size` int DEFAULT NULL,
  `ulink2hit` int NOT NULL DEFAULT '0',
  `filedir` int DEFAULT NULL,
  `ufile1` varchar(150) DEFAULT NULL,
  `ufile1size` int DEFAULT NULL,
  `ufile1hit` int NOT NULL DEFAULT '0',
  `ufile2` varchar(150) DEFAULT NULL,
  `ufile2size` int DEFAULT NULL,
  `ufile2hit` int NOT NULL DEFAULT '0',
  `temp1` int DEFAULT NULL,
  `temp2` int DEFAULT NULL,
  `temp3` mediumtext,
  `user_add1` varchar(255) DEFAULT NULL,
  `user_add2` varchar(255) DEFAULT NULL,
  `user_add3` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`no`),
  KEY `uid` (`uid`),
  KEY `division` (`division`),
  KEY `follow` (`follow`),
  KEY `category` (`category`),
  KEY `name` (`name`),
  KEY `id` (`id`),
  KEY `hit` (`hit`),
  KEY `wdate` (`wdate`),
  KEY `comment` (`comment`),
  KEY `replycnt` (`replycnt`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `a_tn2_eqna_list`
--

LOCK TABLES `a_tn2_eqna_list` WRITE;
/*!40000 ALTER TABLE `a_tn2_eqna_list` DISABLE KEYS */;
INSERT INTO `a_tn2_eqna_list` VALUES (4,'eqna',-1,1,0,NULL,1,0,NULL,1,1,NULL,NULL,NULL,0,0,'joseph',0,'0.0.0.0',1548222664,NULL,0,NULL,NULL,NULL,'Feedback Board',0,'Admin','joseph','whcho@kookmin.ac.kr',NULL,NULL,NULL,'',0,NULL,'Please upload your feedback on the IBSTH service.',NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,'LA',NULL,NULL),(6,'eqna',-5,1,0,NULL,5,0,NULL,1,1,NULL,NULL,NULL,1,0,'sirsuh@gmail.com',0,'0.0.0.0',1550928690,NULL,0,NULL,NULL,NULL,'몇 가지 개선해야 할 점을 제안합니다. ',0,'Barnabas Suh','sirsuh@gmail.com','sirsuh@gmail.com',NULL,NULL,NULL,'',0,NULL,'1. 한번 작성한 후 본문범위가 수정이 안됨\r\n2. 수동저장보다는 자동으로 저장하기 기능을 넣었으면 함. (구글 docs처럼)\r\n3. step 넘어가기가 순차적으로만 진행됨 → 선택이 가능하도록. 예)  관찰, 해석, 적용에서 선택이 아무 거나 될 수 있도록. 수정할 때 불편합니다. \r\n4. 한글버전에서 문단나누기 기능이 안됨\r\n5. 사파리(맥용)에서 틀이 흐트러짐. 의외로 맥을 쓰는 사람이 많습니다. \r\n6. pdf 파일 변환 시 문단정렬이 안됨. \r\n\r\n제가 올려놓은 룻기를 보세요. (공유해 놓았습니다)\r\n\r\n서바나바 올림',NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,'Anam UBF Church',NULL,NULL),(8,'eqna',-7,1,0,NULL,7,0,NULL,1,1,NULL,NULL,NULL,0,0,'markyangubf@gmail.com',0,'0.0.0.0',1551204092,NULL,0,NULL,NULL,NULL,'forget password',0,'Mark C Yang','markyangubf@gmail.com','markyangubf@gmail.com',NULL,NULL,NULL,'',0,NULL,'처음 로그인을 할 때 password를 잊어버렸을 때 forget password를 클릭하여 이 메일에서 다시 reset 하도록 했습니다. 이 메일을 보냈다고 하는데 이 메일로 오지 않습니다. 개선이 필요합니다. 제가 로그인을 한 것은 password를 다시 기억했기 때문입니다.  Mark Yang',NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,'UBF church',NULL,NULL),(9,'eqna',-9,1,0,NULL,9,0,NULL,1,1,NULL,NULL,NULL,1,0,'sirsuh@gmail.com',0,'0.0.0.0',1551249106,NULL,0,NULL,NULL,NULL,'첨부 파일 기능을 넣어 주세요. 그리고 메일 주소도 부탁합니다. ',0,'Barnabas Suh','sirsuh@gmail.com','sirsuh@gmail.com',NULL,NULL,NULL,'',0,NULL,'수정사항을 캡처했는데 첨부가 되지 않네요 ... ^^',NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,'Anam UBF Church',NULL,NULL),(10,'eqna',-10,1,0,NULL,10,0,NULL,1,1,NULL,NULL,NULL,1,0,'paulchang121@gmail.com',0,'0.0.0.0',1551309523,NULL,0,NULL,NULL,NULL,'Dividing paragraphs and giving subtitle section doesn\'t seem to work in English version',0,'Paul Chang','paulchang121@gmail.com','paulchang121@gmail.com',NULL,NULL,NULL,'',0,NULL,'In observation section, dividing paragraph and give subtitle doesn\'t work in English version.\r\nThanks\r\n\r\n\r\n',NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,0,NULL,NULL,0,NULL,NULL,NULL,'Hamilton UBF chapter',NULL,NULL);
/*!40000 ALTER TABLE `a_tn2_eqna_list` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-02 14:09:25
